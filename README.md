# Smart Traffic Density & Signal Optimization System

An intelligent traffic management system that optimizes traffic signal timing based on real-time traffic density analysis to reduce congestion, minimize wait times, and improve traffic flow efficiency.

##  Project Overview

The Smart Traffic Density Signal Optimization System is designed to address urban traffic congestion through intelligent signal control. The system uses density-based algorithms to dynamically adjust traffic light timings at intersections, reducing bottlenecks and improving overall traffic flow.

### Key Features

- **Real-time Traffic Density Analysis**: Monitor vehicle density at intersections
- **Dynamic Signal Timing**: Automatically adjust traffic light durations based on traffic patterns
- **Web Dashboard**: Interactive interface for traffic monitoring and management
- **Multi-intersection Support**: Handle multiple intersections simultaneously
- **API-driven Architecture**: RESTful backend for seamless integration

## Project Structure

```
Smart-Traffic-Density-Signal-Optimization-System/
├── backend/                 # Python Flask API server
├── frontend/                # React.js dashboard
├── run.bat                  # Automated startup script (Windows)
├── Smart Traffic Report.pdf # Project documentation
├── co po mapping.pdf        # Component mapping documentation
├── sem 8 Final_Project_Diary.pdf  # Project development diary
└── README.md               # This file
```

## Tech Stack

- **Backend**: Python, Flask
- **Frontend**: React.js, JavaScript
- **Architecture**: Client-Server (REST API)
- **Runtime**: Node.js (Frontend), Python 3.x (Backend)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.7+** - For the backend server
- **Node.js 14+** & **npm** - For the frontend development server
- **Git** - For version control

## Installation & Setup

### Quick Start (Windows)

Simply run the provided batch script:

```bash
run.bat
```

This will automatically:
1. Install Python dependencies
2. Start the backend server on `http://127.0.0.1:8000`
3. Install Node.js dependencies
4. Start the frontend development server on `http://localhost:5173`

### Manual Setup

#### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The backend API will be available at `http://127.0.0.1:8000`

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend dashboard will be available at `http://localhost:5173`

## Usage

1. **Start both servers** using the quick start method or manual setup
2. **Open your browser** and navigate to `http://localhost:5173`
3. **Monitor traffic** through the interactive dashboard
4. **View real-time analytics** of traffic density and signal timing

## Project Documentation

The repository includes detailed documentation files:

- **Smart Traffic Report.pdf** - Comprehensive project report with technical details
- **co po mapping.pdf** - Component and port mapping documentation
- **sem 8 Final_Project_Diary.pdf** - Complete development timeline and progress logs

## System Architecture

The system uses a client-server architecture:

```
Frontend (React) <---> REST API (Flask) <---> Traffic Data Processing
   Dashboard            Backend Server           Algorithm
```

## Configuration

Key configuration details:

- **Backend Port**: 8000
- **Frontend Port**: 5173
- **API Endpoint**: `http://127.0.0.1:8000/api`

## API Endpoints

Common API endpoints (documented in backend):

- `GET /api/traffic` - Get current traffic data
- `GET /api/signals` - Get traffic signal status
- `POST /api/optimize` - Trigger signal optimization
- `GET /api/analytics` - Get traffic analytics

## Contributing

To contribute to this project:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🐛 Troubleshooting

### Backend won't start
- Ensure Python 3.7+ is installed
- Check that port 8000 is not in use
- Run `pip install -r requirements.txt` again

### Frontend won't start
- Ensure Node.js 14+ and npm are installed
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check that port 5173 is not in use

### Connection issues between frontend and backend
- Verify both servers are running
- Check firewall settings
- Ensure correct API endpoint configuration in frontend

## License

This project is provided as-is for educational and research purposes.

## Acknowledgments

Special thanks to all contributors and the academic community for insights and support in developing this intelligent traffic management system.

---
