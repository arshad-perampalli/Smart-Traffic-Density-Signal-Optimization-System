@echo off
echo Starting Smart Traffic Management and Signal Optimization System...
echo ================================================================

echo Starting Python Backend Server...
start cmd /k "cd backend && pip install -r requirements.txt && python app.py"

echo Starting React Frontend Server...
start cmd /k "cd frontend && npm install && npm run dev"

echo.
echo Both servers are launching in separate windows!
echo - The backend API is running on http://127.0.0.1:8000
echo - The frontend dashboard is running on http://localhost:5173
echo.
echo You can now open your browser and navigate to the frontend URL!
pause
