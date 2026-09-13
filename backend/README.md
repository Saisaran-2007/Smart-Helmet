# Smart Helmet Backend

## 1. Open this folder in VS Code

Open:
SMART-HELMET/backend

## 2. Install packages

npm install

## 3. Start the server

npm run dev

The API will run at:
http://localhost:5000

## 4. Test

Open:
http://localhost:5000/api/health

You should see JSON with:
"status": "ok"

## API

GET  /api/health
GET  /api/telemetry
POST /api/telemetry
POST /api/accident
POST /api/sos
GET  /api/events
GET  /api/routes
POST /api/routes

## Example telemetry body

{
  "helmetId": "HLM-001",
  "latitude": 13.0827,
  "longitude": 80.2707,
  "speed": 42,
  "accel": { "x": 0, "y": 0, "z": 1 },
  "gyro": { "x": 0, "y": 0, "z": 0 },
  "accidentDetected": false,
  "battery": 82,
  "gpsFix": true,
  "satellites": 8
}

This is a local prototype backend. Real deployment will require authentication,
HTTPS, persistent storage, validation and production infrastructure.
