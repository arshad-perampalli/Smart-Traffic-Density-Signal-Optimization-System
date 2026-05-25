from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response
import os
import shutil
import cv2
from ultralytics import YOLO
import numpy as np
import time
import threading
from rl_agent import TrafficRLAgent
from model_metrics import ModelMetrics

app = FastAPI(title="Smart Traffic System API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Load YOLO model
try:
    model = YOLO("yolov8n.pt")
except Exception as e:
    print(f"Error loading YOLO model: {e}")
    model = None

# Initialize RL agent
rl_agent = TrafficRLAgent()

# Initialize model metrics tracker
metrics_tracker = ModelMetrics()

# Global stats
current_stats = {
    "total_vehicles": 0,
    "average_speed": "48 km/h",
    "active_cameras": 8,
    "incidents": 1,
    "traffic_density": "Moderate",
    "optimizations_performed": 24,
    "rl_green_lane": 1,
    "lanes": {
        1: {"vehicle_count": 0, "time_allotted": 5, "next_green_time": 5},
        2: {"vehicle_count": 0, "time_allotted": 5, "next_green_time": 5},
        3: {"vehicle_count": 0, "time_allotted": 5, "next_green_time": 5},
        4: {"vehicle_count": 0, "time_allotted": 5, "next_green_time": 5}
    }
}

def rl_loop():
    while True:
        lane_counts = {l: current_stats["lanes"][l]["vehicle_count"] for l in range(1, 5)}
        rl_result = rl_agent.step(lane_counts)
        current_stats["rl_green_lane"] = rl_result["green_lane"]
        for l in range(1, 5):
            current_stats["lanes"][l]["next_green_time"] = round(max(5, lane_counts[l] * 0.7))
        time.sleep(1)

threading.Thread(target=rl_loop, daemon=True).start()


def generate_frames(lane_id=1):
    video_path = os.path.join(UPLOAD_DIR, f"video {lane_id}.mp4")
    if not os.path.exists(video_path):
        return
    
    cap = cv2.VideoCapture(video_path)
    
    while True:
        success, frame = cap.read()
        if not success:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue
        
        if model:
            # Run YOLOv8 detection
            results = model(frame, verbose=False)
            
            # Count vehicles (class names 2: car, 3: motorcycle, 5: bus, 7: truck)
            vehicle_ids = [2, 3, 5, 7]
            vehicle_count = 0
            
            

            for result in results:
                boxes = result.boxes
                for box in boxes:
                    cls = int(box.cls[0])
                    if cls in vehicle_ids:
                        vehicle_count += 1
                        # Draw bounding box
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                        cv2.putText(frame, f"{model.names[cls]}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

            # Update vehicle count and total only — RL runs separately
            current_stats["lanes"][lane_id]["vehicle_count"] = vehicle_count
            current_stats["total_vehicles"] = sum(current_stats["lanes"][l]["vehicle_count"] for l in range(1, 5))

            # Update confusion matrix / accuracy metrics
            metrics_tracker.update(results, model)

            total = current_stats["total_vehicles"]
            if total > 150:
                current_stats["traffic_density"] = "High"
            elif total >= 85:
                current_stats["traffic_density"] = "Moderate"
            else:
                current_stats["traffic_density"] = "Low"
        
        # Encode frame as JPEG
        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        
        # Add a small delay to control frame rate and CPU usage
        time.sleep(0.01)

@app.get("/video_feed/{lane_id}")
async def video_feed(lane_id: int):
    return StreamingResponse(generate_frames(lane_id), media_type="multipart/x-mixed-replace; boundary=frame")

@app.post("/login")
async def login(username: str = Form(...), password: str = Form(...)):
    if username == "admin" and password == "admin123":
        return {"status": "success", "token": "mock_jwt_token"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/upload-video")
async def upload_video(lane_id: int = Form(...), video: UploadFile = File(...)):
    try:
        file_location = os.path.join(UPLOAD_DIR, f"video {lane_id}.mp4")
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(video.file, file_object)
        return {"status": "success", "filename": f"video {lane_id}.mp4", "message": f"Video uploaded successfully for Lane {lane_id} analysis."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
async def get_stats():
    for l in range(1, 5):
        count = current_stats["lanes"][l]["vehicle_count"]
        t = round(max(5, count * 0.7))
        current_stats["lanes"][l]["time_allotted"] = t
        current_stats["lanes"][l]["next_green_time"] = t
    return {
        "status": "success",
        "data": current_stats
    }

@app.get("/model_metrics")
async def get_model_metrics():
    """Returns accuracy, precision, recall, F1, confusion matrix data."""
    return {"status": "success", "data": metrics_tracker.get_metrics()}

@app.get("/confusion_matrix_image")
async def get_confusion_matrix_image():
    """Returns the confusion matrix as a PNG image generated by matplotlib."""
    img_bytes = metrics_tracker.get_confusion_matrix_image()
    return Response(content=img_bytes, media_type="image/png")

@app.get("/rl_stats")
async def get_rl_stats():
    return {"status": "success", "data": rl_agent.get_stats()}

@app.get("/rl_action")
async def get_rl_action():
    lane_counts = {l: current_stats["lanes"][l]["vehicle_count"] for l in range(1, 5)}
    result = rl_agent.step(lane_counts)
    return {"status": "success", "data": result}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
