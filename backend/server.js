import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ==========================================
// HELMETRA BACKEND HOME
// ==========================================

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "Helmetra Smart Helmet Backend",
    message: "Backend is running successfully 🚀",
    api: "/api/health",
  });
});

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Smart Helmet Backend",
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// HELMET TELEMETRY
// ==========================================

let telemetry = {
  helmetId: "HLM-001",

  timestamp: new Date().toISOString(),

  latitude: 13.0827,
  longitude: 80.2707,

  speed: 42,

  accel: {
    x: 0.02,
    y: -0.01,
    z: 1.01,
  },

  gyro: {
    x: 0.3,
    y: 0.2,
    z: 0.1,
  },

  accidentDetected: false,

  battery: 82,

  gpsFix: true,

  satellites: 8,

  connected: true,
};

// ==========================================
// EVENTS
// ==========================================

let events = [];

// ==========================================
// DEMO ROUTES
// ==========================================

let routes = [
  {
    id: "R001",
    from: "Chennai Central",
    to: "Marina Beach",
    distance: 8.4,
    duration: 18,
    status: "Completed",
    date: new Date().toISOString().slice(0, 10),
  },
];

// ==========================================
// GET TELEMETRY
// ==========================================

app.get("/api/telemetry", (req, res) => {
  res.json(telemetry);
});

// ==========================================
// RECEIVE TELEMETRY FROM ESP32
// ==========================================

app.post("/api/telemetry", (req, res) => {
  telemetry = {
    ...telemetry,
    ...req.body,
    timestamp: new Date().toISOString(),
  };

  res.status(201).json({
    message: "Telemetry received",
    telemetry,
  });
});

// ==========================================
// ACCIDENT EVENT
// ==========================================

app.post("/api/accident", (req, res) => {
  const event = {
    id: `ACC-${Date.now()}`,

    type: "ACCIDENT",

    timestamp: new Date().toISOString(),

    latitude:
      req.body.latitude ??
      telemetry.latitude,

    longitude:
      req.body.longitude ??
      telemetry.longitude,

    helmetId:
      req.body.helmetId ??
      telemetry.helmetId,
  };

  telemetry.accidentDetected = true;
  telemetry.timestamp = new Date().toISOString();

  events.unshift(event);

  res.status(201).json({
    message: "Accident event recorded",
    event,
  });
});

// ==========================================
// SOS EVENT
// ==========================================

app.post("/api/sos", (req, res) => {
  const event = {
    id: `SOS-${Date.now()}`,

    type: "SOS",

    timestamp: new Date().toISOString(),

    latitude:
      req.body.latitude ??
      telemetry.latitude,

    longitude:
      req.body.longitude ??
      telemetry.longitude,

    helmetId:
      req.body.helmetId ??
      telemetry.helmetId,
  };

  events.unshift(event);

  res.status(201).json({
    message: "SOS event recorded",
    event,
  });
});

// ==========================================
// GET EMERGENCY EVENTS
// ==========================================

app.get("/api/events", (req, res) => {
  res.json(events);
});

// ==========================================
// GET ROUTES
// ==========================================

app.get("/api/routes", (req, res) => {
  res.json(routes);
});

// ==========================================
// ADD ROUTE
// ==========================================

app.post("/api/routes", (req, res) => {
  const route = {
    id: `R${Date.now()}`,

    from: req.body.from,

    to: req.body.to,

    distance:
      req.body.distance ?? 0,

    duration:
      req.body.duration ?? 0,

    status:
      req.body.status ?? "Completed",

    date: new Date()
      .toISOString()
      .slice(0, 10),
  };

  routes.unshift(route);

  res.status(201).json(route);
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Helmetra Smart Helmet Backend running on port ${PORT}`
  );
});