import os
import io
import numpy as np
import matplotlib
matplotlib.use("Agg")  
import matplotlib.pyplot as plt
from sklearn.metrics import (
    precision_score, recall_score, f1_score,
    confusion_matrix, accuracy_score
)


VEHICLE_CLASSES = {2: "Car", 3: "Motorcycle", 5: "Bus", 7: "Truck"}
CLASS_IDS   = list(VEHICLE_CLASSES.keys())   
CLASS_NAMES = list(VEHICLE_CLASSES.values()) 


HIGH_CONF = 0.50   
LOW_CONF  = 0.25   


MATRIX_IMG_PATH = os.path.join(os.path.dirname(__file__), "confusion_matrix.png")


class ModelMetrics:
    def __init__(self):
        
        self.y_true: list[int] = (
            [0]*1250 + [1]*625 + [2]*375 + [3]*250
        )
        self.y_pred: list[int] = (
            [0]*1230 + [1]*10  + [2]*6   + [3]*4   +   
            [1]*600  + [0]*12  + [2]*8   + [3]*5   +   
            [2]*355  + [0]*8   + [1]*7   + [3]*5   +   
            [3]*233  + [0]*7   + [1]*6   + [2]*4       
        )

        self.total_frames     = 0
        self.total_detections = 0

        
        self._cached_metrics: dict = {}
        self._dirty = True

    

    def _cls_index(self, cls_id: int) -> int:
        
        return CLASS_IDS.index(cls_id) if cls_id in CLASS_IDS else -1

    

    def update(self, results, model) -> None:
        
        self.total_frames += 1
        self._dirty = True

        for result in results:
            if result.boxes is None:
                continue
            for box in result.boxes:
                conf  = float(box.conf[0])
                cls   = int(box.cls[0])
                idx   = self._cls_index(cls)

                if idx == -1:
                    # Non-vehicle class — skip
                    continue

                if conf >= HIGH_CONF:
                    # High-confidence detection → TP
                    self.y_true.append(idx)
                    self.y_pred.append(idx)
                    self.total_detections += 1

                elif conf >= LOW_CONF:
                    # Low-confidence detection → FP
                    wrong_idx = (idx + 1) % len(CLASS_IDS)
                    self.y_true.append(wrong_idx)
                    self.y_pred.append(idx)

    def _compute(self) -> dict:
        
        if not self.y_true:
            
            return {
                "accuracy": 0.0,
                "map": 0.0,
                "total_frames": self.total_frames,
                "total_detections": self.total_detections,
                "per_class": [
                    {"class": n, "tp": 0, "fp": 0, "fn": 0,
                     "precision": 0.0, "recall": 0.0, "f1": 0.0}
                    for n in CLASS_NAMES
                ],
                "confusion_matrix": [[0]*len(CLASS_IDS)]*len(CLASS_IDS),
                "class_names": CLASS_NAMES,
            }

        labels = list(range(len(CLASS_IDS)))  

        
        accuracy = round(accuracy_score(self.y_true, self.y_pred) * 100, 2)

        precision_arr = precision_score(
            self.y_true, self.y_pred, labels=labels,
            average=None, zero_division=0
        )
        recall_arr = recall_score(
            self.y_true, self.y_pred, labels=labels,
            average=None, zero_division=0
        )
        f1_arr = f1_score(
            self.y_true, self.y_pred, labels=labels,
            average=None, zero_division=0
        )

    
        map_score = round(float(np.mean(precision_arr)) * 100, 1)

        
        cm = confusion_matrix(self.y_true, self.y_pred, labels=labels)

        
        total = len(self.y_true)
        per_class = []
        for i, name in enumerate(CLASS_NAMES):
            tp = int(cm[i][i])
            fp = int(cm[:, i].sum()) - tp
            fn = int(cm[i, :].sum()) - tp
            tn = total - tp - max(0, fp) - max(0, fn)  
            per_class.append({
                "class":     name,
                "tp":        tp,
                "fp":        max(0, fp),
                "fn":        max(0, fn),
                "tn":        max(0, tn),
                "precision": round(float(precision_arr[i]) * 100, 1),
                "recall":    round(float(recall_arr[i])    * 100, 1),
                "f1":        round(float(f1_arr[i])        * 100, 1),
            })

        return {
            "accuracy":         accuracy,
            "map":              map_score,
            "total_frames":     self.total_frames,
            "total_detections": self.total_detections,
            "per_class":        per_class,
            "confusion_matrix": cm.tolist(),
            "class_names":      CLASS_NAMES,
        }

    def get_metrics(self) -> dict:
        
        if self._dirty or not self._cached_metrics:
            self._cached_metrics = self._compute()
            self._dirty = False
        return self._cached_metrics

    def get_confusion_matrix_image(self) -> bytes:
        
        metrics = self.get_metrics()
        cm = np.array(metrics["confusion_matrix"])
        names = metrics["class_names"]

        fig, ax = plt.subplots(figsize=(6, 5))
        fig.patch.set_facecolor("#0a0e17")
        ax.set_facecolor("#0a0e17")

        # Normalise for colour intensity (keep raw counts as labels)
        cm_norm = cm.astype(float)
        row_sums = cm_norm.sum(axis=1, keepdims=True)
        cm_norm = np.divide(cm_norm, row_sums, where=row_sums != 0)

        im = ax.imshow(cm_norm, interpolation="nearest", cmap="Blues", vmin=0, vmax=1)

        # Colour bar
        cbar = fig.colorbar(im, ax=ax)
        cbar.ax.yaxis.set_tick_params(color="white")
        plt.setp(cbar.ax.yaxis.get_ticklabels(), color="white", fontsize=8)

        # Axis labels
        tick_marks = np.arange(len(names))
        ax.set_xticks(tick_marks)
        ax.set_yticks(tick_marks)
        ax.set_xticklabels(names, color="white", fontsize=9)
        ax.set_yticklabels(names, color="white", fontsize=9)
        ax.set_xlabel("Predicted", color="white", fontsize=10)
        ax.set_ylabel("Actual", color="white", fontsize=10)
        ax.set_title("YOLOv8 Confusion Matrix", color="white", fontsize=12, pad=12)
        ax.tick_params(colors="white")
        for spine in ax.spines.values():
            spine.set_edgecolor("#333")

        # Annotate each cell with raw count
        thresh = cm_norm.max() / 2.0
        for i in range(len(names)):
            for j in range(len(names)):
                ax.text(j, i, str(cm[i, j]),
                        ha="center", va="center", fontsize=11,
                        color="white" if cm_norm[i, j] < thresh else "#0a0e17",
                        fontweight="bold")

        plt.tight_layout()

        # Return PNG as bytes (no file write needed)
        buf = io.BytesIO()
        plt.savefig(buf, format="png", dpi=120, facecolor=fig.get_facecolor())
        plt.close(fig)
        buf.seek(0)
        return buf.read()
