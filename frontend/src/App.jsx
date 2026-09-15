import "./App.css";
import "leaflet/dist/leaflet.css";

import {
  LayoutDashboard,
  Map,
  Navigation,
  AlertTriangle,
  Route,
  Activity,
  Settings,
  ShieldCheck,
  BatteryMedium,
  Bell,
  Wifi,
  MapPin,
  Menu,
  X,
  Gauge,
  Satellite,
  Clock3,
  Phone,
  MessageSquare,
  UserRound,
  ShieldAlert,
  CheckCircle2,
  Siren,
  Bike,
  Zap,
  Radio,
  MapPinned,
  LogIn,
  UserPlus,
  LogOut,
  Palette,
  HelpCircle,
  ChevronDown,
} from "lucide-react";

import { useEffect, useState } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";

import L from "leaflet";


// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});


// Demo rider location
const riderLocation = [13.0827, 80.2707];
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";


// Map controls
function RecenterMap({ location = riderLocation }) {
  const map = useMap();

  return (
    <button
      className="map-recenter"
      onClick={() => map.setView(location, 15)}
    >
      Recenter
    </button>
  );
}


function NavigationPage({ telemetry }) {
  const [startLocation, setStartLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [startResults, setStartResults] = useState([]);
  const [destinationResults, setDestinationResults] = useState([]);
  const [selectedStart, setSelectedStart] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [route, setRoute] = useState([]);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(
    "Choose a starting location and destination to plan your route."
  );

  const searchPlaces = async (query, setter) => {
    if (!query.trim()) {
      setter([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&addressdetails=1&q=${encodeURIComponent(query)}`
      );
      if (!response.ok) return;
      const data = await response.json();
      setter(data);
    } catch {
      setter([]);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => searchPlaces(startLocation, setStartResults), 500);
    return () => clearTimeout(timer);
  }, [startLocation]);

  useEffect(() => {
    const timer = setTimeout(
      () => searchPlaces(destination, setDestinationResults),
      500
    );
    return () => clearTimeout(timer);
  }, [destination]);

  const chooseStart = (place) => {
    setSelectedStart(place);
    setStartLocation(place.display_name);
    setStartResults([]);
    setRoute([]);
    setDistance(null);
    setDuration(null);
    setMessage("Starting location selected. Now choose a destination.");
  };

  const planRoute = async (place) => {
    setSelectedPlace(place);
    setDestination(place.display_name);
    setDestinationResults([]);
    setLoading(true);
    setMessage("Finding the best driving route...");

    try {
      const startLat = selectedStart
        ? Number(selectedStart.lat)
        : Number(telemetry.location[0]);
      const startLon = selectedStart
        ? Number(selectedStart.lon)
        : Number(telemetry.location[1]);
      const endLat = Number(place.lat);
      const endLon = Number(place.lon);

      const start = `${startLon},${startLat}`;
      const end = `${endLon},${endLat}`;

      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`
      );

      if (!response.ok) throw new Error("Route service unavailable");

      const data = await response.json();
      if (!data.routes || !data.routes.length) throw new Error("No route found");

      const selectedRoute = data.routes[0];
      const coordinates = selectedRoute.geometry.coordinates.map(
        ([lon, lat]) => [lat, lon]
      );

      setRoute(coordinates);
      setDistance((selectedRoute.distance / 1000).toFixed(1));
      setDuration(Math.max(1, Math.round(selectedRoute.duration / 60)));
      setMessage("Route ready. Follow the highlighted path.");
    } catch {
      setRoute([]);
      setDistance(null);
      setDuration(null);
      setMessage(
        "Could not calculate the route right now. Please try another location."
      );
    } finally {
      setLoading(false);
    }
  };

  const useHelmetLocation = () => {
    setSelectedStart(null);
    setStartLocation("Helmet current location");
    setStartResults([]);
    setRoute([]);
    setDistance(null);
    setDuration(null);
    setMessage("Using the helmet's current GPS location as the start.");
  };

  const clearRoute = () => {
    setStartLocation("");
    setDestination("");
    setStartResults([]);
    setDestinationResults([]);
    setSelectedStart(null);
    setSelectedPlace(null);
    setRoute([]);
    setDistance(null);
    setDuration(null);
    setMessage("Choose a starting location and destination to plan your route.");
  };

  const startForMap = selectedStart
    ? [Number(selectedStart.lat), Number(selectedStart.lon)]
    : telemetry.location;

  return (
    <div className="navigation-page">
      <div className="navigation-header">
        <div>
          <p className="eyebrow">SMART ROUTE PLANNER</p>
          <h3>Navigation</h3>
          <p className="page-description">
            Choose any starting location and any destination, then calculate a route.
          </p>
        </div>

        <div className="gps-live">
          <span className="status-dot"></span>
          GPS READY
        </div>
      </div>

      <div className="navigation-grid">
        <div className="navigation-map-card">
          <MapContainer
            center={telemetry.location}
            zoom={13}
            scrollWheelZoom={true}
            className="navigation-leaflet-map"
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={startForMap}>
              <Popup>
                <strong>{selectedStart ? "Starting location" : "🪖 Helmetra"}</strong>
                <br />
                {selectedStart
                  ? selectedStart.display_name
                  : "Current GPS location"}
              </Popup>
            </Marker>

            {selectedPlace && (
              <Marker
                position={[Number(selectedPlace.lat), Number(selectedPlace.lon)]}
              >
                <Popup>
                  <strong>Destination</strong>
                  <br />
                  {selectedPlace.display_name}
                </Popup>
              </Marker>
            )}

            {route.length > 0 && (
              <Polyline
                positions={route}
                pathOptions={{ color: "var(--theme-accent, #4f8cff)", weight: 6 }}
              />
            )}

            <RecenterMap location={startForMap} />
          </MapContainer>
        </div>

        <div className="navigation-panel">
          <div className="navigation-search-card">
            <div className="navigation-section-title">
              <div className="nav-search-icon">
                <Navigation size={19} />
              </div>
              <div>
                <span>ROUTE PLANNER</span>
                <strong>Where are you going?</strong>
              </div>
            </div>

            <div className="route-input-label">FROM</div>
            <div className="destination-input-wrap">
              <MapPin size={18} />
              <input
                value={startLocation}
                onChange={(event) => {
                  setStartLocation(event.target.value);
                  setSelectedStart(null);
                }}
                placeholder="Search starting location..."
              />
              <button
                type="button"
                className="use-helmet-location"
                onClick={useHelmetLocation}
              >
                Helmet
              </button>
            </div>

            {startResults.length > 0 && (
              <div className="search-results">
                {startResults.map((place) => (
                  <button
                    type="button"
                    key={place.place_id}
                    className="search-result"
                    onClick={() => chooseStart(place)}
                  >
                    <MapPin size={17} />
                    <span>{place.display_name}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="route-input-label destination-label">TO</div>
            <div className="destination-input-wrap">
              <MapPin size={18} />
              <input
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                placeholder="Search destination..."
              />
              {destination && (
                <button
                  type="button"
                  className="clear-destination"
                  onClick={clearRoute}
                  aria-label="Clear route"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {destinationResults.length > 0 && (
              <div className="search-results">
                {destinationResults.map((place) => (
                  <button
                    type="button"
                    key={place.place_id}
                    className="search-result"
                    onClick={() => planRoute(place)}
                  >
                    <MapPin size={17} />
                    <span>{place.display_name}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="route-status">
              <span className={`route-status-dot ${loading ? "loading" : ""}`} />
              <span>{message}</span>
            </div>

            {distance && duration && (
              <div className="route-summary">
                <div>
                  <span>DISTANCE</span>
                  <strong>{distance} km</strong>
                </div>
                <div>
                  <span>ETA</span>
                  <strong>{duration} min</strong>
                </div>
              </div>
            )}

            {(selectedStart || selectedPlace) && (
              <button type="button" className="clear-route-button" onClick={clearRoute}>
                <X size={16} />
                Clear Route
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="navigation-lower-grid">
        <section className="navigation-info-card">
          <div className="navigation-lower-heading">
            <div className="navigation-lower-icon"><Route size={18} /></div>
            <div>
              <span>ROUTE DETAILS</span>
              <strong>Your planned journey</strong>
            </div>
          </div>

          <div className="navigation-detail-list">
            <div className="navigation-detail-row">
              <span>START</span>
              <strong>{selectedStart ? selectedStart.display_name : "Not selected"}</strong>
            </div>
            <div className="navigation-detail-row">
              <span>DESTINATION</span>
              <strong>{selectedPlace ? selectedPlace.display_name : "Not selected"}</strong>
            </div>
            <div className="navigation-detail-row">
              <span>ROUTE STATUS</span>
              <strong className="navigation-accent-value">
                {loading ? "Calculating..." : route.length ? "Route ready" : "Waiting for locations"}
              </strong>
            </div>
          </div>
        </section>

        <section className="navigation-info-card navigation-how-card">
          <div className="navigation-lower-heading">
            <div className="navigation-lower-icon"><ShieldCheck size={18} /></div>
            <div>
              <span>SMART ROUTING</span>
              <strong>How Helmetra navigation works</strong>
            </div>
          </div>

          <div className="navigation-steps">
            <div><b>01</b><span>Choose any starting location.</span></div>
            <div><b>02</b><span>Choose any destination.</span></div>
            <div><b>03</b><span>Helmetra calculates a driving route and ETA.</span></div>
          </div>
        </section>

        <section className="navigation-info-card navigation-status-card">
          <div className="navigation-lower-heading">
            <div className="navigation-lower-icon"><Satellite size={18} /></div>
            <div>
              <span>RIDER LOCATION</span>
              <strong>Helmet GPS reference</strong>
            </div>
          </div>

          <div className="navigation-gps-box">
            <div>
              <span>LATITUDE</span>
              <strong>{Number(telemetry.location[0]).toFixed(4)}</strong>
            </div>
            <div>
              <span>LONGITUDE</span>
              <strong>{Number(telemetry.location[1]).toFixed(4)}</strong>
            </div>
          </div>

          <button type="button" className="navigation-use-gps-button" onClick={useHelmetLocation}>
            <MapPin size={16} />
            Use Helmet GPS as Start
          </button>
        </section>
      </div>
    </div>
  );
}

function RoutesPage() {
  const [routeStatus, setRouteStatus] = useState("active");

  const routeData = {
    start: "Chennai, Tamil Nadu",
    destination: "Marina Beach, Chennai",
    distance: "8.4 km",
    eta: "18 min",
    speed: "42 km/h",
    progress: 62,
    startedAt: "10:24 PM",
  };

  const recentRoutes = [
    {
      from: "Chennai Central",
      to: "Marina Beach",
      distance: "8.4 km",
      time: "18 min",
      status: "Completed",
      date: "Today",
    },
    {
      from: "T. Nagar",
      to: "Anna Nagar",
      distance: "7.1 km",
      time: "16 min",
      status: "Completed",
      date: "Yesterday",
    },
    {
      from: "Adyar",
      to: "Guindy",
      distance: "6.8 km",
      time: "14 min",
      status: "Completed",
      date: "Sep 09",
    },
    {
      from: "Velachery",
      to: "OMR",
      distance: "11.2 km",
      time: "24 min",
      status: "Completed",
      date: "Sep 08",
    },
  ];

  const handleRouteAction = () => {
    setRouteStatus((value) =>
      value === "active" ? "paused" : "active"
    );
  };

  return (
    <div className="routes-page">
      <div className="routes-page-header">
        <div>
          <p className="eyebrow">RIDE HISTORY & ROUTE MONITORING</p>
          <h3>Routes</h3>
          <p className="page-description">
            Track your current ride, route progress and recently completed journeys.
          </p>
        </div>

        <div className={`route-status-badge ${routeStatus}`}>
          <span className="status-dot"></span>
          {routeStatus === "active" ? "ROUTE ACTIVE" : "ROUTE PAUSED"}
        </div>
      </div>

      <div className="route-overview-grid">
        <div className="current-route-card">
          <div className="route-card-top">
            <div>
              <p className="route-card-label">CURRENT ROUTE</p>
              <h3>Marina Beach Ride</h3>
            </div>

            <div className="route-card-icon">
              <Route size={21} />
            </div>
          </div>

          <div className="route-points">
            <div className="route-point">
              <span className="route-point-dot start"></span>
              <div>
                <small>START</small>
                <strong>{routeData.start}</strong>
              </div>
            </div>

            <div className="route-line"></div>

            <div className="route-point">
              <span className="route-point-dot end"></span>
              <div>
                <small>DESTINATION</small>
                <strong>{routeData.destination}</strong>
              </div>
            </div>
          </div>

          <div className="route-progress-section">
            <div className="route-progress-heading">
              <span>ROUTE PROGRESS</span>
              <strong>{routeData.progress}%</strong>
            </div>

            <div className="route-progress-track">
              <div
                className="route-progress-fill"
                style={{ width: `${routeData.progress}%` }}
              ></div>
            </div>

            <div className="route-progress-meta">
              <span>Started {routeData.startedAt}</span>
              <span>On route</span>
            </div>
          </div>

          <button
            className="route-action-button"
            onClick={handleRouteAction}
          >
            {routeStatus === "active" ? (
              <>
                <Activity size={17} />
                Pause Route
              </>
            ) : (
              <>
                <Navigation size={17} />
                Resume Route
              </>
            )}
          </button>
        </div>

        <div className="route-stats-grid">
          <div className="route-stat-card">
            <div className="route-stat-icon blue">
              <Route size={19} />
            </div>
            <span>DISTANCE</span>
            <strong>{routeData.distance}</strong>
            <small>Current route</small>
          </div>

          <div className="route-stat-card">
            <div className="route-stat-icon purple">
              <Clock3 size={19} />
            </div>
            <span>ETA</span>
            <strong>{routeData.eta}</strong>
            <small>Estimated arrival</small>
          </div>

          <div className="route-stat-card">
            <div className="route-stat-icon green">
              <Gauge size={19} />
            </div>
            <span>SPEED</span>
            <strong>{routeData.speed}</strong>
            <small>Current speed</small>
          </div>

          <div className="route-stat-card">
            <div className="route-stat-icon orange">
              <MapPin size={19} />
            </div>
            <span>GPS STATUS</span>
            <strong>Strong</strong>
            <small>8 satellites</small>
          </div>
        </div>
      </div>

      <section className="route-history-card">
        <div className="route-section-heading">
          <div>
            <p className="eyebrow">RIDE HISTORY</p>
            <h3>Recent Routes</h3>
          </div>

          <span className="route-count">
            {recentRoutes.length} rides
          </span>
        </div>

        <div className="route-history-list">
          {recentRoutes.map((item, index) => (
            <div className="route-history-row" key={`${item.from}-${index}`}>
              <div className="history-route-icon">
                <Route size={18} />
              </div>

              <div className="history-route-path">
                <strong>{item.from}</strong>
                <span>
                  <Navigation size={11} />
                  {item.to}
                </span>
              </div>

              <div className="history-detail">
                <span>DISTANCE</span>
                <strong>{item.distance}</strong>
              </div>

              <div className="history-detail">
                <span>TIME</span>
                <strong>{item.time}</strong>
              </div>

              <div className="history-status">
                <span className="completed-dot"></span>
                <strong>{item.status}</strong>
                <small>{item.date}</small>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="route-hardware-note">
        <Route size={18} />
        <div>
          <strong>Route data integration</strong>
          <span>
            Route history is currently using demo ride data. During hardware
            integration, GPS coordinates from the NEO-6M will update the active
            route and ride history automatically.
          </span>
        </div>
      </div>
    </div>
  );
}


function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [buzzerEnabled, setBuzzerEnabled] = useState(true);
  const [autoSms, setAutoSms] = useState(true);

  const saveSettings = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  const resetSettings = () => {
    setAlertsEnabled(true);
    setLocationSharing(true);
    setBuzzerEnabled(true);
    setAutoSms(true);
    setSaved(false);
  };

  const SettingToggle = ({ label, description, enabled, onChange }) => (
    <div className="setting-row">
      <div className="setting-row-text">
        <strong>{label}</strong>
        <span>{description}</span>
      </div>
      <button
        type="button"
        className={`settings-toggle ${enabled ? "on" : ""}`}
        onClick={() => onChange(!enabled)}
        aria-label={`${label} ${enabled ? "enabled" : "disabled"}`}
      >
        <span></span>
      </button>
    </div>
  );

  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <div>
          <p className="eyebrow">SYSTEM CONFIGURATION</p>
          <h3>Settings</h3>
          <p className="page-description">
            Manage your rider profile, helmet connection and safety preferences.
          </p>
        </div>

        {saved && (
          <div className="settings-saved">
            <CheckCircle2 size={15} />
            Settings saved
          </div>
        )}
      </div>

      <div className="settings-layout">
        <div className="settings-main">
          <section className="settings-card profile-settings-card">
            <div className="settings-card-heading">
              <div className="settings-heading-icon blue">
                <UserRound size={18} />
              </div>
              <div>
                <h4>Rider Profile</h4>
                <span>Basic rider information</span>
              </div>
            </div>

            <div className="settings-form-grid">
              <label className="settings-field">
                <span>RIDER NAME</span>
                <input type="text" defaultValue="Helmetra Rider" />
              </label>

              <label className="settings-field">
                <span>HELMET ID</span>
                <input type="text" defaultValue="HLM-001" />
              </label>

              <label className="settings-field">
                <span>PHONE NUMBER</span>
                <input type="tel" defaultValue="+91 XXXXX XXXXX" />
              </label>

              <label className="settings-field">
                <span>EMERGENCY GROUP</span>
                <select defaultValue="Family">
                  <option>Family</option>
                  <option>Friends</option>
                  <option>Personal</option>
                </select>
              </label>
            </div>
          </section>

          <section className="settings-card">
            <div className="settings-card-heading">
              <div className="settings-heading-icon green">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h4>Safety & Alerts</h4>
                <span>Configure automatic safety responses</span>
              </div>
            </div>

            <div className="settings-list">
              <SettingToggle
                label="Emergency alerts"
                description="Show an alert when an accident or SOS event is detected."
                enabled={alertsEnabled}
                onChange={setAlertsEnabled}
              />

              <SettingToggle
                label="Automatic emergency SMS"
                description="Send the latest GPS location to emergency contacts after an accident."
                enabled={autoSms}
                onChange={setAutoSms}
              />

              <SettingToggle
                label="Pre-alert buzzer"
                description="Sound the buzzer during the emergency countdown before sending an alert."
                enabled={buzzerEnabled}
                onChange={setBuzzerEnabled}
              />
            </div>

            <div className="countdown-setting">
              <div>
                <strong>Cancellation countdown</strong>
                <span>Time available to cancel a false accident alert.</span>
              </div>
              <select defaultValue="10">
                <option value="5">5 seconds</option>
                <option value="10">10 seconds</option>
                <option value="15">15 seconds</option>
                <option value="20">20 seconds</option>
              </select>
            </div>
          </section>

          <section className="settings-card">
            <div className="settings-card-heading">
              <div className="settings-heading-icon purple">
                <MapPin size={18} />
              </div>
              <div>
                <h4>Location & GPS</h4>
                <span>Manage location tracking preferences</span>
              </div>
            </div>

            <div className="settings-list">
              <SettingToggle
                label="Location sharing"
                description="Allow the application to use the helmet's latest GPS position for safety features."
                enabled={locationSharing}
                onChange={setLocationSharing}
              />
            </div>

            <div className="gps-info-box">
              <div className="gps-info-item">
                <Satellite size={16} />
                <div>
                  <span>GPS MODULE</span>
                  <strong>NEO-6M</strong>
                </div>
              </div>

              <div className="gps-info-item">
                <MapPin size={16} />
                <div>
                  <span>UPDATE MODE</span>
                  <strong>Periodic</strong>
                </div>
              </div>

              <div className="gps-info-item">
                <Activity size={16} />
                <div>
                  <span>STATUS</span>
                  <strong className="online-text">Connected</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="settings-card">
            <div className="settings-card-heading">
              <div className="settings-heading-icon orange">
                <Phone size={18} />
              </div>
              <div>
                <h4>Emergency Contacts</h4>
                <span>People who receive safety alerts</span>
              </div>
            </div>

            <div className="contact-setting-list">
              <div className="contact-setting">
                <div className="contact-avatar">01</div>
                <div>
                  <strong>Primary Contact</strong>
                  <span>+91 XXXXX XXXXX</span>
                </div>
                <span className="primary-contact-badge">PRIMARY</span>
              </div>

              <div className="contact-setting">
                <div className="contact-avatar">02</div>
                <div>
                  <strong>Secondary Contact</strong>
                  <span>+91 XXXXX XXXXX</span>
                </div>
                <button type="button" className="contact-edit-button">Edit</button>
              </div>
            </div>
          </section>
        </div>

        <aside className="settings-side">
          <section className="settings-card helmet-settings-card">
            <div className="settings-card-heading">
              <div className="settings-heading-icon dark">
                <ShieldAlert size={18} />
              </div>
              <div>
                <h4>Helmet Connection</h4>
                <span>Hardware status</span>
              </div>
            </div>

            <div className="helmet-connection">
              <div className="helmet-status-icon">
                <ShieldCheck size={24} />
              </div>
              <strong>HLM-001</strong>
              <span><i></i> Connected</span>
            </div>

            <div className="connection-details">
              <div>
                <span>CONTROLLER</span>
                <strong>ESP32</strong>
              </div>
              <div>
                <span>FIRMWARE</span>
                <strong>Demo v1.0</strong>
              </div>
              <div>
                <span>LAST SYNC</span>
                <strong>Just now</strong>
              </div>
            </div>

            <button type="button" className="connection-button">
              <Wifi size={15} />
              Test Connection
            </button>
          </section>

          <section className="settings-card preferences-card">
            <div className="settings-card-heading">
              <div className="settings-heading-icon blue">
                <Bell size={18} />
              </div>
              <div>
                <h4>App Preferences</h4>
                <span>Interface behaviour</span>
              </div>
            </div>

            <label className="settings-field compact">
              <span>MAP TYPE</span>
              <select defaultValue="Street">
                <option>Street</option>
                <option>Satellite</option>
              </select>
            </label>

            <label className="settings-field compact">
              <span>UNITS</span>
              <select defaultValue="Metric">
                <option>Metric (km / km/h)</option>
                <option>Imperial (mi / mph)</option>
              </select>
            </label>

            <label className="settings-field compact">
              <span>LANGUAGE</span>
              <select defaultValue="English">
                <option>English</option>
                <option>Tamil</option>
              </select>
            </label>
          </section>

          <section className="settings-software-note">
            <Activity size={17} />
            <div>
              <strong>Prototype mode</strong>
              <span>
                Settings currently control the web interface. Hardware values
                will be synchronized with the ESP32 during backend integration.
              </span>
            </div>
          </section>
        </aside>
      </div>

      <div className="settings-actions">
        <button type="button" className="settings-reset-button" onClick={resetSettings}>
          Reset
        </button>
        <button type="button" className="settings-save-button" onClick={saveSettings}>
          <CheckCircle2 size={16} />
          Save Settings
        </button>
      </div>
    </div>
  );
}

function EmergencyPage({ telemetry }) {
  const [alertState, setAlertState] = useState("ready");
  const [alertType, setAlertType] = useState("SOS");
  const [countdown, setCountdown] = useState(10);
  const [alertTime, setAlertTime] = useState(null);
  const [eventMessage, setEventMessage] = useState("");
  const [recentEvents, setRecentEvents] = useState([]);

  const loadEvents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/events`);
      if (!response.ok) return;
      const data = await response.json();
      setRecentEvents(data.slice(0, 5));
    } catch {
      // Keep the emergency page usable while the backend is unavailable.
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (alertState !== "countdown") return;

    if (countdown <= 0) {
      const sendEmergencyEvent = async () => {
        const endpoint = alertType === "ACCIDENT" ? "accident" : "sos";

        try {
          const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              helmetId: "HLM-001",
              latitude: telemetry.location[0],
              longitude: telemetry.location[1],
            }),
          });

          if (!response.ok) throw new Error("Emergency event failed");

          setEventMessage(
            alertType === "ACCIDENT"
              ? "Accident event recorded by the backend."
              : "SOS event recorded by the backend."
          );
          await loadEvents();
        } catch {
          setEventMessage("Alert prepared, but the backend could not record the event.");
        }

        setAlertState("sent");
        setAlertTime(new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }));
      };

      sendEmergencyEvent();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((value) => value - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [alertState, countdown, alertType, telemetry.location]);

  const startAlert = (type) => {
    setAlertType(type);
    setCountdown(10);
    setAlertState("countdown");
    setAlertTime(null);
    setEventMessage("");
  };

  const cancelAlert = () => {
    setAlertState("cancelled");
    setCountdown(10);
    setEventMessage(
      `${alertType === "ACCIDENT" ? "Accident" : "SOS"} alert cancelled before notification.`
    );
  };

  const resetEmergency = () => {
    setAlertState("ready");
    setCountdown(10);
    setAlertTime(null);
    setEventMessage("");
  };

  return (
    <div className="emergency-page">
      <div className="emergency-page-header">
        <div>
          <p className="eyebrow">EMERGENCY RESPONSE SYSTEM</p>
          <h3>Emergency</h3>
          <p className="page-description">
            Test the complete accident and SOS response flow without physical hardware.
          </p>
        </div>

        <div className={`emergency-system-status ${alertState}`}>
          <span className="status-dot"></span>
          {alertState === "sent"
            ? "ALERT ACTIVE"
            : alertState === "countdown"
              ? "COUNTDOWN ACTIVE"
              : alertState === "cancelled"
                ? "ALERT CANCELLED"
                : "SYSTEM READY"}
        </div>
      </div>

      <div className="emergency-main-grid">
        <div className="sos-control-card">
          {alertState === "ready" && (
            <>
              <div className="sos-ring">
                <div className="sos-center">
                  <Siren size={38} />
                </div>
              </div>

              <span className="emergency-card-label">EMERGENCY CONTROL</span>
              <h3>Safety response simulator</h3>
              <p>
                Test an SOS or simulated accident. Both start the 10-second
                cancellation window before the event is recorded by the backend.
              </p>

              <button className="big-sos-button" onClick={() => startAlert("SOS")}>
                <ShieldAlert size={22} />
                SEND SOS ALERT
              </button>

              <button
                className="simulate-accident-button"
                onClick={() => startAlert("ACCIDENT")}
              >
                <AlertTriangle size={19} />
                SIMULATE ACCIDENT
              </button>

              <small>
                Demo mode • no real SMS is sent from the browser.
              </small>
            </>
          )}

          {alertState === "countdown" && (
            <>
              <div className="countdown-circle">
                <span>{countdown}</span>
                <small>SECONDS</small>
              </div>

              <span className="emergency-card-label warning-label">
                {alertType === "ACCIDENT" ? "ACCIDENT DETECTED" : "SOS COUNTDOWN"}
              </span>
              <h3>
                {alertType === "ACCIDENT"
                  ? "Possible accident detected"
                  : "Emergency alert is preparing"}
              </h3>
              <p>
                The warning countdown is active. Cancel now if this is a false alert.
              </p>

              <div className="buzzer-simulation">
                <span className="buzzer-pulse"></span>
                <div>
                  <strong>BUZZER WARNING</strong>
                  <small>Simulated warning sound active</small>
                </div>
              </div>

              <button className="cancel-alert-button" onClick={cancelAlert}>
                <X size={20} />
                CANCEL ALERT
              </button>

              <small>GPS position will be attached when the countdown ends.</small>
            </>
          )}

          {alertState === "sent" && (
            <>
              <div className="success-circle">
                <CheckCircle2 size={42} />
              </div>

              <span className="emergency-card-label success-label">
                {alertType === "ACCIDENT" ? "ACCIDENT LOGGED" : "SOS SENT"}
              </span>
              <h3>Emergency response activated</h3>
              <p>
                The event has been recorded with the latest GPS coordinates and helmet ID.
              </p>

              <div className="alert-sent-time">
                <Clock3 size={16} />
                Recorded at {alertTime}
              </div>

              {eventMessage && <div className="event-feedback">{eventMessage}</div>}

              <button className="reset-emergency-button" onClick={resetEmergency}>
                Reset Emergency
              </button>
            </>
          )}

          {alertState === "cancelled" && (
            <>
              <div className="cancelled-circle">
                <X size={38} />
              </div>

              <span className="emergency-card-label">ALERT CANCELLED</span>
              <h3>False alert cancelled</h3>
              <p>
                No emergency event was recorded. Your Helmetra system remains active and ready.
              </p>

              {eventMessage && <div className="event-feedback cancelled">{eventMessage}</div>}

              <button className="reset-emergency-button" onClick={resetEmergency}>
                Back to Emergency
              </button>
            </>
          )}
        </div>

        <div className="emergency-side">
          <div className="emergency-info-card">
            <div className="emergency-info-title">
              <div className="emergency-info-icon blue">
                <MapPin size={19} />
              </div>
              <div>
                <span>LOCATION SHARING</span>
                <strong>Current GPS position</strong>
              </div>
            </div>

            <div className="gps-coordinate-box">
              <strong>
                {telemetry.location[0].toFixed(4)}° N, {telemetry.location[1].toFixed(4)}° E
              </strong>
              <small>
                {telemetry.gpsStatus} GPS • {telemetry.satellites} satellites
              </small>
            </div>

            <div className="location-sharing-status">
              <span className="status-dot"></span>
              Location ready to share
            </div>
          </div>

          <div className="emergency-info-card">
            <div className="emergency-info-title">
              <div className="emergency-info-icon red">
                <UserRound size={19} />
              </div>
              <div>
                <span>EMERGENCY CONTACTS</span>
                <strong>People who will be alerted</strong>
              </div>
            </div>

            <div className="contact-list">
              <div className="contact-row">
                <div className="contact-avatar">P</div>
                <div>
                  <strong>Primary Contact</strong>
                  <small>Emergency contact</small>
                </div>
                <Phone size={16} />
              </div>

              <div className="contact-row">
                <div className="contact-avatar">F</div>
                <div>
                  <strong>Family Contact</strong>
                  <small>Emergency contact</small>
                </div>
                <Phone size={16} />
              </div>
            </div>

            <button className="manage-contact-button">
              <UserRound size={16} />
              Manage Contacts
            </button>
          </div>

          <div className="emergency-info-card alert-flow-card">
            <div className="emergency-info-title">
              <div className="emergency-info-icon orange">
                <MessageSquare size={19} />
              </div>
              <div>
                <span>ALERT FLOW</span>
                <strong>What happens after an alert?</strong>
              </div>
            </div>

            <div className="alert-flow">
              <div className="flow-step"><span>1</span><p>SOS / simulated accident</p></div>
              <div className="flow-step"><span>2</span><p>10-second buzzer countdown</p></div>
              <div className="flow-step"><span>3</span><p>Latest GPS location attached</p></div>
              <div className="flow-step"><span>4</span><p>Backend event recorded</p></div>
            </div>
          </div>
        </div>
      </div>

      <div className="emergency-events-card">
        <div className="emergency-info-title">
          <div className="emergency-info-icon purple"><Activity size={19} /></div>
          <div>
            <span>BACKEND EVENT LOG</span>
            <strong>Recent safety events</strong>
          </div>
        </div>

        {recentEvents.length === 0 ? (
          <div className="empty-events">No emergency events recorded yet. Run a simulation above.</div>
        ) : (
          <div className="emergency-event-list">
            {recentEvents.map((event) => (
              <div className="emergency-event-row" key={event.id}>
                <div className={`event-type-icon ${event.type === "ACCIDENT" ? "accident" : "sos"}`}>
                  {event.type === "ACCIDENT" ? <AlertTriangle size={15} /> : <Siren size={15} />}
                </div>
                <div>
                  <strong>{event.type}</strong>
                  <small>
                    {Number(event.latitude).toFixed(4)}° N, {Number(event.longitude).toFixed(4)}° E
                  </small>
                </div>
                <span>{new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="emergency-hardware-note">
        <ShieldCheck size={18} />
        <div>
          <strong>Software simulation mode</strong>
          <span>
            This demo reproduces the accident/SOS response without hardware. Later,
            MPU6050 accident detection and the physical buzzer/SIM800L can feed the same backend events.
          </span>
        </div>
      </div>
    </div>
  );
}


function SystemStatusPage({ telemetry }) {
  const components = [
    {
      name: "ESP32 Controller",
      icon: Activity,
      status: telemetry.apiOnline ? "Online" : "Offline",
      detail: "Main helmet controller",
      value: "HLM-001",
      type: telemetry.apiOnline ? "good" : "bad",
    },
    {
      name: "MPU6050 Sensor",
      icon: Gauge,
      status: telemetry.apiOnline ? "Ready" : "Waiting",
      detail: "Accelerometer + gyroscope",
      value: telemetry.apiOnline ? "Connected" : "No data",
      type: telemetry.apiOnline ? "good" : "warn",
    },
    {
      name: "NEO-6M GPS",
      icon: Satellite,
      status: telemetry.gpsStatus,
      detail: `${telemetry.satellites} satellites detected`,
      value: telemetry.gpsStatus === "Strong" ? "GPS Fix" : "Searching",
      type: telemetry.gpsStatus === "Strong" ? "good" : "warn",
    },
    {
      name: "SIM800L GSM",
      icon: MessageSquare,
      status: "Standby",
      detail: "Emergency SMS module",
      value: "Ready for hardware",
      type: "warn",
    },
    {
      name: "Buzzer",
      icon: Siren,
      status: "Ready",
      detail: "Emergency countdown warning",
      value: "Simulation mode",
      type: "warn",
    },
    {
      name: "Battery",
      icon: BatteryMedium,
      status: telemetry.battery > 20 ? "Healthy" : "Low",
      detail: "Current battery level",
      value: `${telemetry.battery}%`,
      type: telemetry.battery > 20 ? "good" : "bad",
    },
  ];

  const recentEvents = [
    {
      title: "Backend telemetry received",
      detail: `${telemetry.speed} km/h • ${telemetry.satellites} satellites`,
      time: telemetry.lastUpdated
        ? new Date(telemetry.lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        : "Waiting",
      icon: Wifi,
    },
    {
      title: telemetry.accidentDetected ? "Accident detected" : "Accident detection armed",
      detail: telemetry.accidentDetected ? "Emergency response active" : "Monitoring sensor data",
      time: "Live",
      icon: ShieldAlert,
    },
    {
      title: "GPS location available",
      detail: `${telemetry.location[0].toFixed(4)}, ${telemetry.location[1].toFixed(4)}`,
      time: "Live",
      icon: MapPin,
    },
  ];

  const healthyCount = components.filter((item) => item.type === "good").length;
  const overallHealthy = telemetry.apiOnline && telemetry.gpsStatus === "Strong" && telemetry.battery > 20;

  return (
    <div className="system-status-page">
      <div className="system-status-header-row">
        <div>
          <p className="eyebrow">SMART HELMET HARDWARE MONITOR</p>
          <h3>System Status</h3>
          <p className="page-description">
            Monitor the health of the helmet controller, sensors, GPS, emergency system and battery.
          </p>
        </div>
        <div className={`overall-health-badge ${overallHealthy ? "healthy" : "attention"}`}>
          <span></span>
          {overallHealthy ? "ALL SYSTEMS HEALTHY" : "CHECK SYSTEM"}
        </div>
      </div>

      <div className="system-status-summary">
        <div className="system-health-card">
          <div className="system-health-icon">
            <ShieldCheck size={27} />
          </div>
          <div>
            <span>OVERALL HEALTH</span>
            <strong>{overallHealthy ? "Healthy" : "Attention Required"}</strong>
            <small>{healthyCount} of {components.length} components reporting normally</small>
          </div>
        </div>

        <div className="system-summary-stat">
          <span>BACKEND</span>
          <strong>{telemetry.apiOnline ? "Connected" : "Offline"}</strong>
          <small>API telemetry</small>
        </div>
        <div className="system-summary-stat">
          <span>GPS</span>
          <strong>{telemetry.gpsStatus}</strong>
          <small>{telemetry.satellites} satellites</small>
        </div>
        <div className="system-summary-stat">
          <span>BATTERY</span>
          <strong>{telemetry.battery}%</strong>
          <small>{telemetry.battery > 20 ? "Normal level" : "Charge soon"}</small>
        </div>
      </div>

      <section className="system-components-card">
        <div className="system-section-heading">
          <div>
            <p className="eyebrow">COMPONENT MONITOR</p>
            <h3>Helmet Components</h3>
          </div>
          <span className="system-live-label"><i></i> LIVE TELEMETRY</span>
        </div>

        <div className="system-component-grid">
          {components.map((item) => {
            const Icon = item.icon;
            return (
              <div className="system-component-card" key={item.name}>
                <div className={`system-component-icon ${item.type}`}><Icon size={19} /></div>
                <div className="system-component-main">
                  <div className="system-component-title-row">
                    <strong>{item.name}</strong>
                    <span className={`component-status ${item.type}`}><i></i>{item.status}</span>
                  </div>
                  <small>{item.detail}</small>
                  <div className="system-component-value">{item.value}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="system-status-lower-grid">
        <section className="system-events-card">
          <div className="system-section-heading">
            <div>
              <p className="eyebrow">RECENT ACTIVITY</p>
              <h3>System Events</h3>
            </div>
          </div>
          <div className="system-event-list">
            {recentEvents.map((event, index) => {
              const Icon = event.icon;
              return (
                <div className="system-event-row" key={`${event.title}-${index}`}>
                  <div className="system-event-icon"><Icon size={15} /></div>
                  <div>
                    <strong>{event.title}</strong>
                    <span>{event.detail}</span>
                  </div>
                  <small>{event.time}</small>
                </div>
              );
            })}
          </div>
        </section>

        <section className="system-architecture-card">
          <div className="system-section-heading">
            <div>
              <p className="eyebrow">DATA FLOW</p>
              <h3>Helmet Architecture</h3>
            </div>
          </div>
          <div className="architecture-flow">
            <div className="architecture-node"><Activity size={17} /><strong>ESP32</strong><small>Controller</small></div>
            <span className="architecture-arrow">→</span>
            <div className="architecture-node"><Gauge size={17} /><strong>Sensors</strong><small>MPU6050 + GPS</small></div>
            <span className="architecture-arrow">→</span>
            <div className="architecture-node"><Wifi size={17} /><strong>Backend</strong><small>API</small></div>
            <span className="architecture-arrow">→</span>
            <div className="architecture-node"><LayoutDashboard size={17} /><strong>App</strong><small>Dashboard</small></div>
          </div>
          <div className="system-prototype-note">
            <CheckCircle2 size={16} />
            <span>Software prototype is connected to the local backend. Physical ESP32 sensors can use the same API later.</span>
          </div>
        </section>
      </div>
    </div>
  );
}

function HelpSupportPage() {
  const faqs = [
    {
      q: "How does automatic accident detection work?",
      a: "The MPU6050 measures acceleration and gyroscope movement. The ESP32 can evaluate sudden impact or abnormal motion and send an accident event to the backend."
    },
    {
      q: "How does GPS tracking work?",
      a: "The NEO-6M provides latitude and longitude. Helmetra can display the latest position on the map and use it for emergency location sharing."
    },
    {
      q: "What happens when I press SOS?",
      a: "The emergency workflow starts immediately. In a hardware-connected version, the ESP32 can send the latest GPS coordinates through the backend and GSM emergency system."
    },
    {
      q: "Can I cancel a false accident alert?",
      a: "Yes. The emergency workflow includes a countdown so the rider can cancel a false detection before the alert is finalized."
    },
    {
      q: "Can I use Navigation without the helmet's current location?",
      a: "Yes. Helmetra Navigation supports any starting location and any destination. You can search both locations independently."
    },
    {
      q: "When will the real hardware values appear?",
      a: "During hardware integration, ESP32 telemetry will be sent to the backend API. The same dashboard, tracking and system-status screens can then display live sensor data."
    },
  ];

  return (
    <div className="help-page">
      <div className="help-header">
        <div>
          <p className="eyebrow">SUPPORT CENTER</p>
          <h3>Help & Support</h3>
          <p className="page-description">
            Learn how Helmetra works and find answers about tracking, navigation and emergency protection.
          </p>
        </div>
        <div className="help-header-icon"><HelpCircle size={30} /></div>
      </div>

      <div className="help-grid">
        <section className="help-card help-contact-card">
          <div className="help-card-icon"><MessageSquare size={21} /></div>
          <h4>Need help?</h4>
          <p>For your college prototype, check the FAQ first. Hardware integration can be connected to the same interface later.</p>
          <div className="help-contact-row"><ShieldCheck size={16} /><span>Helmetra Safety System</span></div>
          <div className="help-contact-row"><MailIcon size={16} /><span>Support available through your project team</span></div>
        </section>

        <section className="help-card">
          <div className="help-section-title">
            <HelpCircle size={19} />
            <div>
              <h4>Frequently Asked Questions</h4>
              <span>Quick answers for riders</span>
            </div>
          </div>

          <div className="faq-list">
            {faqs.map((faq) => (
              <details className="faq-item" key={faq.q}>
                <summary>{faq.q}<ChevronDown size={17} /></summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function MailIcon({ size = 18 }) {
  return <MessageSquare size={size} />;
}

function AuthScreen({ mode, setMode, onAuthenticated }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim() || (mode === "signup" && !name.trim())) {
      setError("Please fill in all required fields.");
      return;
    }

    const account = {
      name: name.trim() || "Helmetra Rider",
      email: email.trim(),
    };

    localStorage.setItem("helmetraAccount", JSON.stringify(account));
    localStorage.setItem("helmetraAuthenticated", "true");
    onAuthenticated(account);
  };

  return (
    <div className="auth-screen">
      <div className="auth-background-glow auth-glow-one"></div>
      <div className="auth-background-glow auth-glow-two"></div>

      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-icon"><ShieldCheck size={28} /></div>
          <div>
            <strong>Helmetra</strong>
            <span>SMART RIDER SAFETY</span>
          </div>
        </div>

        <div className="auth-heading">
          <p className="eyebrow">{mode === "signin" ? "WELCOME BACK" : "GET STARTED"}</p>
          <h1>{mode === "signin" ? "Sign in to Helmetra" : "Create your Helmetra account"}</h1>
          <p>{mode === "signin" ? "Access your safety dashboard and connected helmet controls." : "Set up your rider account for the Helmetra safety system."}</p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === "signup" && (
            <label>
              <span>RIDER NAME</span>
              <div className="auth-input"><UserRound size={17} /><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" /></div>
            </label>
          )}

          <label>
            <span>EMAIL</span>
            <div className="auth-input"><MessageSquare size={17} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
          </label>

          <label>
            <span>PASSWORD</span>
            <div className="auth-input"><ShieldAlert size={17} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" /></div>
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-submit" type="submit">
            {mode === "signin" ? <LogIn size={18} /> : <UserPlus size={18} />}
            {mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="auth-switch">
          <span>{mode === "signin" ? "Don't have an account?" : "Already have an account?"}</span>
          <button type="button" onClick={() => { setError(""); setMode(mode === "signin" ? "signup" : "signin"); }}>
            {mode === "signin" ? "Sign Up" : "Sign In"}
          </button>
        </div>

        <small className="auth-demo-note">Prototype authentication • account details are stored locally in this browser.</small>
      </div>
    </div>
  );
}

function App() {
  const [authenticated, setAuthenticated] = useState(
    () => localStorage.getItem("helmetraAuthenticated") === "true"
  );
  const [authMode, setAuthMode] = useState("signin");
  const [account, setAccount] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("helmetraAccount")) || { name: "Helmetra Rider", email: "" };
    } catch {
      return { name: "Helmetra Rider", email: "" };
    }
  });
  const [theme, setTheme] = useState(
    () => localStorage.getItem("helmetraTheme") || "midnight"
  );

  const [activePage, setActivePage] =
    useState("Dashboard");

  const [mobileMenu, setMobileMenu] =
    useState(false);

  const changeTheme = (nextTheme) => {
    setTheme(nextTheme);
    localStorage.setItem("helmetraTheme", nextTheme);
  };

  const handleAuthenticated = (nextAccount) => {
    setAccount(nextAccount);
    setAuthenticated(true);
    setActivePage("Dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("helmetraAuthenticated");
    setAuthenticated(false);
    setAuthMode("signin");
  };

  if (!authenticated) {
    return (
      <AuthScreen
        mode={authMode}
        setMode={setAuthMode}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  // Shared helmet telemetry from the local backend.
  const [telemetry, setTelemetry] = useState({
    location: riderLocation,
    speed: 42,
    battery: 82,
    satellites: 8,
    gpsStatus: "Strong",
    accidentDetected: false,
    connection: "Connecting...",
    apiOnline: false,
    lastUpdated: null,
  });

  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadTelemetry = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/telemetry`);
        if (!response.ok) throw new Error("Telemetry request failed");

        const data = await response.json();
        if (cancelled) return;

        setTelemetry({
          location: [
            Number(data.latitude) || riderLocation[0],
            Number(data.longitude) || riderLocation[1],
          ],
          speed: Number(data.speed) || 0,
          battery: Number(data.battery) || 0,
          satellites: Number(data.satellites) || 0,
          gpsStatus: data.gpsFix ? "Strong" : "Searching",
          accidentDetected: Boolean(data.accidentDetected),
          connection: data.connected ? "Excellent" : "Disconnected",
          apiOnline: true,
          lastUpdated: data.timestamp || new Date().toISOString(),
        });
        setApiError(false);
      } catch {
        if (cancelled) return;
        setApiError(true);
        setTelemetry((current) => ({
          ...current,
          connection: "Backend Offline",
          apiOnline: false,
        }));
      }
    };

    loadTelemetry();
    const timer = setInterval(loadTelemetry, 3000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);



  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Live Tracking",
      icon: Map,
    },
    {
      name: "Navigation",
      icon: Navigation,
    },
    {
      name: "Emergency",
      icon: AlertTriangle,
    },
    {
      name: "Routes",
      icon: Route,
    },
    {
      name: "System Status",
      icon: Activity,
    },
    {
      name: "Settings",
      icon: Settings,
    },
    {
      name: "Help & Support",
      icon: HelpCircle,
    },
  ];


  const handleNavigation = (page) => {

    setActivePage(page);

    setMobileMenu(false);

  };


  return (

    <div className={`app theme-${theme}`}>


      {/* MOBILE HEADER */}

      <header className="mobile-header">

        <button
          className="mobile-menu-button"
          onClick={() =>
            setMobileMenu(!mobileMenu)
          }
        >

          {mobileMenu
            ? <X size={23} />
            : <Menu size={23} />}

        </button>


        <div className="brand">

          <div className="brand-icon">

            <ShieldCheck size={20} />

          </div>

          <span>Helmetra</span>

        </div>


      </header>



      {/* SIDEBAR */}

      <aside
        className={`sidebar ${
          mobileMenu
            ? "mobile-open"
            : ""
        }`}
      >

        <div className="logo">

          <div className="logo-icon">

            <ShieldCheck size={25} />

          </div>


          <div>

            <h1>Helmetra</h1>

            <span>
              SMART SAFETY
            </span>

          </div>

        </div>


        <div className="connection">

          <span className="status-dot"></span>

          <div>

            <strong>
              {telemetry.apiOnline ? "Helmet Connected" : "Backend Offline"}
            </strong>

            <small>
              {telemetry.apiOnline ? "System online" : "Using local fallback"}
            </small>

          </div>

        </div>


        <nav>

          <p className="nav-title">
            MAIN MENU
          </p>


          {menuItems.map((item) => {

            const Icon = item.icon;

            return (

              <button
                key={item.name}
                className={`nav-item ${
                  activePage === item.name
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleNavigation(
                    item.name
                  )
                }
              >

                <Icon size={19} />

                <span>
                  {item.name}
                </span>

              </button>

            );

          })}

        </nav>


        <div className="sidebar-footer">
          <div className="user-avatar">
            {(account.name || "R").charAt(0).toUpperCase()}
          </div>

          <div className="sidebar-user-details">
            <strong>{account.name || "Helmetra Rider"}</strong>
            <small>Helmetra H001</small>
          </div>

          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>

      </aside>



      {/* MAIN */}

      <main className="main">


        {/* TOP BAR — dashboard only. Other pages already have their own page header. */}
        {activePage === "Dashboard" && (
          <div className="topbar">
            <div>
              <p className="eyebrow">HELMETRA SYSTEM</p>
              <h2>Dashboard</h2>
            </div>

            <div className="top-actions">
              <div className="live-status">
                <span className="status-dot"></span>
                {telemetry.apiOnline ? "Live" : "Offline"}
              </div>

            </div>
          </div>
        )}



        {/* ================= DASHBOARD ================= */}

        {activePage === "Dashboard" && (
          <div className="dashboard-v2">
            <section className="dashboard-theme-panel glass-panel-v2">
              <div className="theme-panel-copy">
                <div className="theme-panel-icon"><Palette size={18} /></div>
                <div>
                  <span>PERSONALIZE HELMETRA</span>
                  <strong>Choose your dashboard theme</strong>
                </div>
              </div>
              <div className="theme-options" role="group" aria-label="Dashboard themes">
                {[
                  ["midnight", "Midnight", "Deep blue"],
                  ["ocean", "Ocean", "Cool blue"],
                  ["emerald", "Emerald", "Green"],
                  ["violet", "Violet", "Purple"],
                  ["sunset", "Sunset", "Warm"],
                  ["rose", "Rose", "Pink"],
                ].map(([key, label, sub]) => (
                  <button
                    key={key}
                    type="button"
                    className={`theme-option theme-swatch-${key} ${theme === key ? "selected" : ""}`}
                    onClick={() => changeTheme(key)}
                  >
                    <span className="theme-dot"></span>
                    <span><strong>{label}</strong><small>{sub}</small></span>
                  </button>
                ))}
              </div>
            </section>

            <section className="dashboard-hero-v2">
              <div className="hero-copy-v2">
                <p className="hero-label-v2">HELMETRA SYSTEM • HLM-001</p>
                <h1>Ride smart.<br /><span>Stay protected.</span></h1>
                <p className="hero-sub-v2">
                  Your connected safety companion is monitoring your ride,
                  location and helmet status in real time.
                </p>

                <div className="hero-pills-v2">
                  <div className="hero-pill-v2"><ShieldCheck size={15} /> Advanced Protection</div>
                  <div className="hero-pill-v2"><MapPinned size={15} /> Live GPS</div>
                  <div className="hero-pill-v2"><Siren size={15} /> Instant SOS</div>
                </div>
              </div>

              <div className="dashboard-visual-v2" aria-hidden="true">
                <div className="orbit orbit-one"></div>
                <div className="orbit orbit-two"></div>
                <div className="helmet-orb-v2">
                  <div className="helmet-shell-v2">
                    <div className="helmet-top-v2"></div>
                    <div className="helmet-visor-v2"></div>
                    <div className="helmet-chin-v2"></div>
                    <div className="helmet-light-v2"></div>
                  </div>
                </div>
                <div className="road-glow-v2"></div>
                <div className="speed-lines-v2 speed-a"></div>
                <div className="speed-lines-v2 speed-b"></div>
                <div className="speed-lines-v2 speed-c"></div>
              </div>

              <div className="hero-safe-badge-v2">
                <div className="safe-ring-v2">
                  <ShieldCheck size={28} />
                </div>
                <strong>{telemetry.accidentDetected ? "ALERT" : "SAFE"}</strong>
                <span>PROTECTION ACTIVE</span>
              </div>
            </section>

            <section className="dashboard-stats-v2">
              <div className="dash-stat-v2 blue-glow">
                <div className="dash-stat-icon-v2"><MapPin size={22} /></div>
                <div>
                  <span>LOCATION</span>
                  <strong>{telemetry.gpsStatus} GPS</strong>
                  <small>8 satellites connected</small>
                </div>
                <i className="mini-live-v2">LIVE</i>
              </div>

              <div className="dash-stat-v2 green-glow">
                <div className="dash-stat-icon-v2"><Activity size={22} /></div>
                <div>
                  <span>ACCIDENT MONITOR</span>
                  <strong>{telemetry.accidentDetected ? "Detected" : "All Clear"}</strong>
                  <small>{telemetry.accidentDetected ? "Emergency response ready" : "No abnormal movement"}</small>
                </div>
                <i className="mini-live-v2">SAFE</i>
              </div>

              <div className="dash-stat-v2 orange-glow">
                <div className="dash-stat-icon-v2"><BatteryMedium size={22} /></div>
                <div>
                  <span>HELMET BATTERY</span>
                  <strong>{telemetry.battery}%</strong>
                  <small>Good condition</small>
                </div>
                <div className="battery-mini-v2"><span style={{ width: `${telemetry.battery}%` }}></span></div>
              </div>

              <div className="dash-stat-v2 purple-glow">
                <div className="dash-stat-icon-v2"><Wifi size={22} /></div>
                <div>
                  <span>CONNECTION</span>
                  <strong>{telemetry.connection}</strong>
                  <small>{telemetry.apiOnline ? "Backend data connected" : "Waiting for backend"}</small>
                </div>
                <div className="signal-bars-v2"><b></b><b></b><b></b><b></b></div>
              </div>
            </section>

            <section className="dashboard-main-grid-v2">
              <div className="ride-overview-v2 glass-panel-v2">
                <div className="panel-heading-v2">
                  <div>
                    <span>LIVE RIDE DATA</span>
                    <h2>Ride Overview</h2>
                  </div>
                  <div className="live-chip-v2"><i></i> Tracking live</div>
                </div>

                <div className="ride-metrics-v2">
                  <div className="metric-card-v2">
                    <div className="metric-icon-v2 cyan"><Gauge size={21} /></div>
                    <span>CURRENT SPEED</span>
                    <strong>{telemetry.speed} <em>km/h</em></strong>
                    <div className="metric-spark-v2"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
                  </div>

                  <div className="metric-card-v2">
                    <div className="metric-icon-v2 purple"><Route size={21} /></div>
                    <span>TRIP DISTANCE</span>
                    <strong>8.4 <em>km</em></strong>
                    <small>Current ride</small>
                  </div>

                  <div className="metric-card-v2">
                    <div className="metric-icon-v2 green"><Satellite size={21} /></div>
                    <span>GPS SIGNAL</span>
                    <strong>{telemetry.satellites} <em>satellites</em></strong>
                    <small>Strong signal</small>
                  </div>

                  <div className="metric-card-v2">
                    <div className="metric-icon-v2 pink"><Zap size={21} /></div>
                    <span>RESPONSE</span>
                    <strong>Instant</strong>
                    <small>SOS system ready</small>
                  </div>
                </div>

                <div className="ride-route-visual-v2">
                  <div className="route-grid-v2"></div>
                  <div className="route-line-v2"><span></span><span></span><span></span></div>
                  <div className="route-start-v2"><MapPin size={16} /></div>
                  <div className="route-end-v2"><Navigation size={16} /></div>
                  <div className="route-caption-v2">
                    <strong>Chennai • Active ride</strong>
                    <span>Helmet telemetry is being monitored continuously</span>
                  </div>
                </div>
              </div>

              <div className="safety-panel-v2 glass-panel-v2">
                <div className="panel-heading-v2">
                  <div>
                    <span>SAFETY CENTER</span>
                    <h2>Protection Status</h2>
                  </div>
                  <div className="pulse-dot-v2"></div>
                </div>

                <div className="protection-core-v2">
                  <div className="protection-ring-v2">
                    <ShieldCheck size={36} />
                  </div>
                  <strong>{telemetry.accidentDetected ? "Attention required" : "You're protected"}</strong>
                  <span>All safety systems are monitoring</span>
                </div>

                <div className="safety-list-v2">
                  <div><Activity size={17} /><span>Impact detection</span><b>READY</b></div>
                  <div><MapPinned size={17} /><span>GPS tracking</span><b>LIVE</b></div>
                  <div><Radio size={17} /><span>Emergency response</span><b>READY</b></div>
                  <div><BatteryMedium size={17} /><span>Power system</span><b>{telemetry.battery}%</b></div>
                </div>
              </div>
            </section>

            <section className="dashboard-actions-v2">
              <button className="action-card-v2 action-blue" onClick={() => handleNavigation("Live Tracking")}>
                <div><Map size={22} /><span>Live Tracking</span><small>See rider location and GPS signal</small></div>
                <Navigation size={19} />
              </button>

              <button className="action-card-v2 action-purple" onClick={() => handleNavigation("Navigation")}>
                <div><Route size={22} /><span>Plan a Route</span><small>Find your destination and ETA</small></div>
                <Navigation size={19} />
              </button>

              <button className="action-card-v2 action-red" onClick={() => handleNavigation("Emergency")}>
                <div><Siren size={22} /><span>Emergency Center</span><small>Send an SOS and share your location</small></div>
                <AlertTriangle size={19} />
              </button>
            </section>

          </div>
        )}


        {/* ================= LIVE TRACKING ================= */}

        {activePage === "Live Tracking" && (

          <div className="tracking-page">


            <div className="tracking-header">

              <div>

                <p className="eyebrow">
                  GPS MONITORING
                </p>

                <h3>
                  Live Tracking
                </h3>

                <p className="page-description">
                  Monitor your helmet location
                  and ride information in real time.
                </p>

              </div>


              <div className="gps-live">

                <span className="status-dot"></span>

                GPS LIVE

              </div>

            </div>



            <div className="tracking-layout">


              {/* REAL MAP */}

              <div className="tracking-map-card">

                <div className="tracking-map-container">

                  <MapContainer
                    center={
                      telemetry.location
                    }
                    zoom={14}
                    scrollWheelZoom={true}
                    className="tracking-leaflet-map"
                  >

                    <TileLayer
                      attribution='&copy; OpenStreetMap contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />


                    <Marker
                      position={
                        telemetry.location
                      }
                    >

                      <Popup>

                        <strong>
                          🪖 Helmetra
                        </strong>

                        <br />

                        GPS location

                        <br />

                        {telemetry.location[0].toFixed(4)}° N,
                        {telemetry.location[1].toFixed(4)}° E

                      </Popup>

                    </Marker>


                    <RecenterMap location={telemetry.location} />

                  </MapContainer>

                </div>

              </div>



              {/* INFORMATION */}

              <div className="tracking-info">


                <div className="info-card">

                  <div className="info-icon blue">

                    <MapPin size={20} />

                  </div>

                  <div>

                    <span>
                      CURRENT LOCATION
                    </span>

                    <strong>
                      {telemetry.location[0].toFixed(4)}° N,
                      {telemetry.location[1].toFixed(4)}° E
                    </strong>

                    <small>
                      GPS coordinates
                    </small>

                  </div>

                </div>



                <div className="info-card">

                  <div className="info-icon green">

                    <Gauge size={20} />

                  </div>

                  <div>

                    <span>
                      CURRENT SPEED
                    </span>

                    <strong>
                      {telemetry.speed} km/h
                    </strong>

                    <small>
                      Normal riding speed
                    </small>

                  </div>

                </div>



                <div className="info-card">

                  <div className="info-icon purple">

                    <Satellite size={20} />

                  </div>

                  <div>

                    <span>
                      GPS SIGNAL
                    </span>

                    <strong>
                      {telemetry.gpsStatus}
                    </strong>

                    <small>
                      {telemetry.satellites} satellites connected
                    </small>

                  </div>

                </div>



                <div className="info-card">

                  <div className="info-icon orange">

                    <Clock3 size={20} />

                  </div>

                  <div>

                    <span>
                      LAST UPDATED
                    </span>

                    <strong>
                      {telemetry.lastUpdated
                        ? new Date(telemetry.lastUpdated).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                        : "Waiting..."}
                    </strong>

                    <small>
                      Location updating automatically
                    </small>

                  </div>

                </div>



                <button
                  className="navigation-button"
                  onClick={() =>
                    handleNavigation(
                      "Navigation"
                    )
                  }
                >

                  <Navigation size={18} />

                  Start Navigation

                </button>


              </div>

            </div>

          </div>

        )}



        {/* ================= NAVIGATION ================= */}

        {activePage === "Navigation" && <NavigationPage telemetry={telemetry} />}

        {/* ================= ROUTES ================= */}

        {activePage === "Routes" && <RoutesPage />}

        {/* ================= SETTINGS ================= */}

        {activePage === "Settings" && <SettingsPage />}

        {/* ================= SYSTEM STATUS ================= */}

        {activePage === "System Status" && <SystemStatusPage telemetry={telemetry} />}

        {/* ================= HELP & SUPPORT ================= */}

        {activePage === "Help & Support" && <HelpSupportPage />}


        {/* ================= EMERGENCY ================= */}

        {activePage === "Emergency" && <EmergencyPage telemetry={telemetry} />}


        {apiError && (
          <div className="api-offline-banner">
            <Wifi size={16} />
            <div>
              <strong>Backend connection unavailable</strong>
              <span>Start the backend with <code>npm run dev</code> to receive live helmet telemetry.</span>
            </div>
          </div>
        )}

        {/* ================= OTHER PAGES ================= */}

        {activePage !== "Dashboard" &&
          activePage !== "Live Tracking" &&
          activePage !== "Navigation" &&
          activePage !== "Routes" &&
          activePage !== "Settings" &&
          activePage !== "System Status" &&
          activePage !== "Emergency" &&
          activePage !== "Help & Support" && (

            <section className="coming-soon">

              <div className="coming-icon">

                {(() => {

                  const Item =
                    menuItems.find(
                      (item) =>
                        item.name ===
                        activePage
                    );

                  const Icon =
                    Item.icon;

                  return (
                    <Icon size={35} />
                  );

                })()}

              </div>


              <h3>
                {activePage}
              </h3>


              <p>
                This section will be built
                and connected to the Helmetra
                hardware in the next
                stages.
              </p>

            </section>

          )}

      </main>

    </div>

  );
}

export default App;