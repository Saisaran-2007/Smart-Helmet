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
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  UserPlus,
  LogIn,
  HelpCircle,
  LogOut,
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
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";


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


function FitRoute({ route }) {
  const map = useMap();

  useEffect(() => {
    if (route.length > 1) {
      map.fitBounds(route, { padding: [35, 35] });
    }
  }, [map, route]);

  return null;
}


function RoutePlanner({ telemetry, mode = "navigation" }) {
  const [startQuery, setStartQuery] = useState("");
  const [endQuery, setEndQuery] = useState("");
  const [startResults, setStartResults] = useState([]);
  const [endResults, setEndResults] = useState([]);
  const [startPlace, setStartPlace] = useState({
    lat: telemetry.location[0],
    lon: telemetry.location[1],
    display_name: "Helmet current location",
    isHelmet: true,
  });
  const [endPlace, setEndPlace] = useState(null);
  const [route, setRoute] = useState([]);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Choose a start point and destination to plan your route.");

  const searchPlaces = (value, setter) => {
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(value)}`
        );
        if (!response.ok) return;
        setter(await response.json());
      } catch {
        setter([]);
      }
    }, 450);
    return () => clearTimeout(timer);
  };

  useEffect(() => {
    if (!startQuery.trim()) {
      setStartResults([]);
      return undefined;
    }
    return searchPlaces(startQuery, setStartResults);
  }, [startQuery]);

  useEffect(() => {
    if (!endQuery.trim()) {
      setEndResults([]);
      return undefined;
    }
    return searchPlaces(endQuery, setEndResults);
  }, [endQuery]);

  useEffect(() => {
    if (startPlace?.isHelmet) {
      setStartPlace((current) => ({
        ...current,
        lat: telemetry.location[0],
        lon: telemetry.location[1],
      }));
    }
  }, [telemetry.location[0], telemetry.location[1]]);

  const calculateRoute = async (start, end) => {
    if (!start || !end) return;
    setLoading(true);
    setMessage("Finding the best driving route...");

    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${Number(start.lon)},${Number(start.lat)};${Number(end.lon)},${Number(end.lat)}?overview=full&geometries=geojson`
      );
      if (!response.ok) throw new Error("Route service unavailable");
      const data = await response.json();
      if (!data.routes?.length) throw new Error("No route found");

      const selectedRoute = data.routes[0];
      setRoute(selectedRoute.geometry.coordinates.map(([lon, lat]) => [lat, lon]));
      setDistance((selectedRoute.distance / 1000).toFixed(1));
      setDuration(Math.max(1, Math.round(selectedRoute.duration / 60)));
      setMessage("Route ready. Follow the highlighted path.");
    } catch {
      setRoute([]);
      setDistance(null);
      setDuration(null);
      setMessage("Could not calculate this route. Try another location.");
    } finally {
      setLoading(false);
    }
  };

  const selectStart = (place) => {
    const selected = { ...place, lat: Number(place.lat), lon: Number(place.lon), isHelmet: false };
    setStartPlace(selected);
    setStartQuery(place.display_name);
    setStartResults([]);
    setRoute([]);
    setDistance(null);
    setDuration(null);
    setMessage(endPlace ? "Start changed. Calculating your new route..." : "Start point selected. Now choose your destination.");
    if (endPlace) calculateRoute(selected, endPlace);
  };

  const selectEnd = (place) => {
    const selected = { ...place, lat: Number(place.lat), lon: Number(place.lon), isHelmet: false };
    setEndPlace(selected);
    setEndQuery(place.display_name);
    setEndResults([]);
    calculateRoute(startPlace, selected);
  };

  const useHelmetLocation = () => {
    const place = {
      lat: telemetry.location[0],
      lon: telemetry.location[1],
      display_name: "Helmet current location",
      isHelmet: true,
    };
    setStartPlace(place);
    setStartQuery("");
    setStartResults([]);
    if (endPlace) calculateRoute(place, endPlace);
    else setMessage("Helmet GPS selected as the start point.");
  };

  const clearPlanner = () => {
    setStartQuery("");
    setEndQuery("");
    setStartResults([]);
    setEndResults([]);
    setStartPlace({
      lat: telemetry.location[0],
      lon: telemetry.location[1],
      display_name: "Helmet current location",
      isHelmet: true,
    });
    setEndPlace(null);
    setRoute([]);
    setDistance(null);
    setDuration(null);
    setMessage("Choose a start point and destination to plan your route.");
  };

  const title = mode === "routes" ? "Routes" : "Navigation";
  const subtitle = mode === "routes"
    ? "Plan and review routes between any two locations."
    : "Plan a route from any starting point to any destination.";

  return (
    <div className={`route-planner-page ${mode === "routes" ? "routes-planner" : "navigation-page"}`}>
      <div className="route-planner-header">
        <div>
          <p className="eyebrow">{mode === "routes" ? "ROUTE PLANNER" : "SMART ROUTE PLANNER"}</p>
          <h3>{title}</h3>
          <p className="page-description">{subtitle}</p>
        </div>
        <div className="gps-live"><span className="status-dot"></span>{loading ? "CALCULATING" : "GPS READY"}</div>
      </div>

      <div className="route-planner-grid">
        <div className="route-planner-map-card">
          <MapContainer
            center={startPlace ? [Number(startPlace.lat), Number(startPlace.lon)] : telemetry.location}
            zoom={13}
            scrollWheelZoom={true}
            className="route-planner-map"
          >
            <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {startPlace && <Marker position={[Number(startPlace.lat), Number(startPlace.lon)]}><Popup><strong>Start point</strong><br />{startPlace.display_name}</Popup></Marker>}
            {endPlace && <Marker position={[Number(endPlace.lat), Number(endPlace.lon)]}><Popup><strong>Destination</strong><br />{endPlace.display_name}</Popup></Marker>}
            {route.length > 0 && <Polyline positions={route} pathOptions={{ color: "#8b5cf6", weight: 6 }} />}
            <FitRoute route={route} />
            <RecenterMap location={startPlace ? [Number(startPlace.lat), Number(startPlace.lon)] : telemetry.location} />
          </MapContainer>
        </div>

        <div className="route-planner-panel">
          <div className="route-input-card">
            <div className="planner-card-heading">
              <div className="planner-heading-icon blue"><MapPin size={19} /></div>
              <div><span>START LOCATION</span><strong>Where are you starting?</strong></div>
            </div>
            <div className="planner-input-wrap">
              <MapPin size={18} />
              <input value={startQuery} onChange={(event) => setStartQuery(event.target.value)} placeholder="Search any starting location..." />
              {startQuery && <button className="planner-clear" onClick={() => setStartQuery("")} aria-label="Clear start"><X size={15} /></button>}
            </div>
            <button className="helmet-location-button" onClick={useHelmetLocation}><Satellite size={15} /> Use helmet's current GPS location</button>
            {startResults.length > 0 && <div className="planner-search-results">{startResults.map((place) => <button key={place.place_id} className="planner-search-result" onClick={() => selectStart(place)}><MapPin size={16} /><span>{place.display_name}</span></button>)}</div>}
          </div>

          <div className="route-input-card">
            <div className="planner-card-heading">
              <div className="planner-heading-icon purple"><Navigation size={19} /></div>
              <div><span>DESTINATION</span><strong>Where do you want to go?</strong></div>
            </div>
            <div className="planner-input-wrap">
              <MapPin size={18} />
              <input value={endQuery} onChange={(event) => setEndQuery(event.target.value)} placeholder="Search any destination..." />
              {endQuery && <button className="planner-clear" onClick={() => setEndQuery("")} aria-label="Clear destination"><X size={15} /></button>}
            </div>
            {endResults.length > 0 && <div className="planner-search-results">{endResults.map((place) => <button key={place.place_id} className="planner-search-result" onClick={() => selectEnd(place)}><MapPin size={16} /><span>{place.display_name}</span></button>)}</div>}
          </div>

          <div className="planner-summary-card">
            <div className="planner-summary-top">
              <div><span>ROUTE SUMMARY</span><strong>{distance ? `${distance} km route` : "No route selected"}</strong></div>
              <button className="planner-reset" onClick={clearPlanner}>Clear</button>
            </div>
            <div className="planner-metrics">
              <div><strong>{distance ? `${distance} km` : "--"}</strong><span>Distance</span></div>
              <div><strong>{duration ? `${duration} min` : "--"}</strong><span>ETA</span></div>
            </div>
            <div className="planner-from-to">
              <div className="planner-point"><span className="planner-point-dot start"></span><div><small>START</small><strong>{startPlace?.display_name || "Not selected"}</strong></div></div>
              <div className="planner-connector"></div>
              <div className="planner-point"><span className="planner-point-dot end"></span><div><small>DESTINATION</small><strong>{endPlace?.display_name || "Not selected"}</strong></div></div>
            </div>
            <div className="planner-status"><span className={loading ? "loading" : ""}></span>{message}</div>
            {route.length > 0 && <button className="start-route-button" onClick={() => setMessage("Route started. Navigation is ready.")}><Navigation size={17} /> Start Route</button>}
          </div>

          <div className="planner-note"><MapPin size={17} /><div><strong>Any-to-any route planning</strong><span>Choose any starting location and any destination. Helmet GPS is optional and can be used with one tap.</span></div></div>
        </div>
      </div>

      {mode === "routes" && <RoutesHistory />}
    </div>
  );
}

function NavigationPage({ telemetry }) {
  return <RoutePlanner telemetry={telemetry} mode="navigation" />;
}

function RoutesHistory() {
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [search, setSearch] = useState("");
  const recentRoutes = [
    { from: "Chennai Central", to: "Marina Beach", distance: "8.4 km", time: "18 min", status: "Completed", date: "Today" },
    { from: "T. Nagar", to: "Anna Nagar", distance: "7.1 km", time: "16 min", status: "Completed", date: "Yesterday" },
    { from: "Adyar", to: "Guindy", distance: "6.8 km", time: "14 min", status: "Completed", date: "Sep 09" },
    { from: "Velachery", to: "OMR", distance: "11.2 km", time: "24 min", status: "Completed", date: "Sep 08" },
  ];
  const filteredRoutes = recentRoutes.filter((item) => `${item.from} ${item.to}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <section className="route-history-card">
      <div className="route-section-heading">
        <div><p className="eyebrow">RIDE HISTORY</p><h3>Recent Routes</h3></div>
        <div className="route-history-tools"><div className="route-search"><MapPin size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search routes" /></div><span className="route-count">{filteredRoutes.length} rides</span></div>
      </div>
      <div className="route-history-list">
        {filteredRoutes.length === 0 ? <div className="route-empty-state"><Route size={24} /><strong>No matching routes</strong><span>Try another route name.</span></div> : filteredRoutes.map((item, index) => (
          <button className={`route-history-row ${selectedRoute === index ? "selected" : ""}`} key={`${item.from}-${index}`} onClick={() => setSelectedRoute(index)}>
            <div className="history-route-icon"><Route size={18} /></div>
            <div className="history-route-path"><strong>{item.from}</strong><span><Navigation size={11} />{item.to}</span></div>
            <div className="history-detail"><span>DISTANCE</span><strong>{item.distance}</strong></div>
            <div className="history-detail"><span>TIME</span><strong>{item.time}</strong></div>
            <div className="history-status"><span className="completed-dot"></span><strong>{item.status}</strong><small>{item.date}</small></div>
          </button>
        ))}
      </div>
      {selectedRoute !== null && filteredRoutes[selectedRoute] && <div className="route-selected-feedback"><CheckCircle2 size={16} />Selected: {filteredRoutes[selectedRoute].from} → {filteredRoutes[selectedRoute].to}</div>}
    </section>
  );
}

function RoutesPage({ telemetry }) {
  return <RoutePlanner telemetry={telemetry} mode="routes" />;
}


function SettingsPage() {
  const defaults = {
    riderName: "Smart Helmet Rider",
    helmetId: "HLM-001",
    phone: "+91 XXXXX XXXXX",
    emergencyGroup: "Family",
    alertsEnabled: true,
    locationSharing: true,
    buzzerEnabled: true,
    autoSms: true,
    countdown: "10",
    mapType: "Street",
    units: "Metric (km / km/h)",
    language: "English",
  };

  const [settings, setSettings] = useState(() => {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem("helmetra_settings") || "{}") };
    } catch {
      return defaults;
    }
  });
  const [saved, setSaved] = useState(false);

  const update = (key, value) => setSettings((current) => ({ ...current, [key]: value }));
  const saveSettings = () => {
    localStorage.setItem("helmetra_settings", JSON.stringify(settings));
    localStorage.setItem("helmetra_user", settings.riderName || "Rider");
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };
  const resetSettings = () => {
    setSettings(defaults);
    localStorage.setItem("helmetra_settings", JSON.stringify(defaults));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  const SettingToggle = ({ label, description, enabled, onChange }) => (
    <div className="setting-row">
      <div className="setting-row-text"><strong>{label}</strong><span>{description}</span></div>
      <button type="button" className={`settings-toggle ${enabled ? "on" : ""}`} onClick={() => onChange(!enabled)} aria-label={`${label} ${enabled ? "enabled" : "disabled"}`}><span></span></button>
    </div>
  );

  return (
    <div className="settings-page page-enter">
      <div className="settings-page-header">
        <div><p className="eyebrow">SYSTEM CONFIGURATION</p><h3>Settings</h3><p className="page-description">Manage your rider profile, safety preferences and application behaviour.</p></div>
        {saved && <div className="settings-saved"><CheckCircle2 size={15} />Settings saved locally</div>}
      </div>

      <div className="settings-layout">
        <div className="settings-main">
          <section className="settings-card profile-settings-card">
            <div className="settings-card-heading"><div className="settings-heading-icon blue"><UserRound size={18} /></div><div><h4>Rider Profile</h4><span>Your local rider information</span></div></div>
            <div className="settings-form-grid">
              <label className="settings-field"><span>RIDER NAME</span><input value={settings.riderName} onChange={(e) => update("riderName", e.target.value)} /></label>
              <label className="settings-field"><span>HELMET ID</span><input value={settings.helmetId} onChange={(e) => update("helmetId", e.target.value)} /></label>
              <label className="settings-field"><span>PHONE NUMBER</span><input value={settings.phone} onChange={(e) => update("phone", e.target.value)} /></label>
              <label className="settings-field"><span>EMERGENCY GROUP</span><select value={settings.emergencyGroup} onChange={(e) => update("emergencyGroup", e.target.value)}><option>Family</option><option>Friends</option><option>Personal</option></select></label>
            </div>
          </section>

          <section className="settings-card">
            <div className="settings-card-heading"><div className="settings-heading-icon green"><ShieldCheck size={18} /></div><div><h4>Safety & Alerts</h4><span>Configure the software safety response</span></div></div>
            <div className="settings-list">
              <SettingToggle label="Emergency alerts" description="Show an alert when an accident or SOS event is detected." enabled={settings.alertsEnabled} onChange={(v) => update("alertsEnabled", v)} />
              <SettingToggle label="Automatic emergency SMS" description="Keep the software setting ready for emergency messaging." enabled={settings.autoSms} onChange={(v) => update("autoSms", v)} />
              <SettingToggle label="Pre-alert buzzer" description="Enable the countdown warning in the emergency simulator." enabled={settings.buzzerEnabled} onChange={(v) => update("buzzerEnabled", v)} />
            </div>
            <div className="countdown-setting"><div><strong>Cancellation countdown</strong><span>Time available to cancel a false emergency alert.</span></div><select value={settings.countdown} onChange={(e) => update("countdown", e.target.value)}><option value="5">5 seconds</option><option value="10">10 seconds</option><option value="15">15 seconds</option><option value="20">20 seconds</option></select></div>
          </section>

          <section className="settings-card">
            <div className="settings-card-heading"><div className="settings-heading-icon purple"><MapPin size={18} /></div><div><h4>Location & GPS</h4><span>Control how location is shown inside the prototype</span></div></div>
            <div className="settings-list"><SettingToggle label="Location sharing" description="Allow the application to use the current demo GPS position for safety features." enabled={settings.locationSharing} onChange={(v) => update("locationSharing", v)} /></div>
            <div className="gps-info-box"><div className="gps-info-item"><Satellite size={16} /><div><span>GPS SOURCE</span><strong>Demo GPS</strong></div></div><div className="gps-info-item"><MapPin size={16} /><div><span>UPDATE MODE</span><strong>Periodic</strong></div></div><div className="gps-info-item"><Activity size={16} /><div><span>STATUS</span><strong className="online-text">Ready</strong></div></div></div>
          </section>

          <section className="settings-card">
            <div className="settings-card-heading"><div className="settings-heading-icon orange"><Phone size={18} /></div><div><h4>Emergency Contacts</h4><span>People shown in the emergency simulator</span></div></div>
            <div className="contact-setting-list"><div className="contact-setting"><div className="contact-avatar">01</div><div><strong>Primary Contact</strong><span>+91 XXXXX XXXXX</span></div><span className="primary-contact-badge">PRIMARY</span></div><div className="contact-setting"><div className="contact-avatar">02</div><div><strong>Family Contact</strong><span>+91 XXXXX XXXXX</span></div><button type="button" className="contact-edit-button" onClick={() => alert("Contact editing is available in the software prototype.")}>Edit</button></div></div>
          </section>
        </div>

        <aside className="settings-side">
          <section className="settings-card helmet-settings-card">
            <div className="settings-card-heading"><div className="settings-heading-icon dark"><ShieldAlert size={18} /></div><div><h4>Helmet Profile</h4><span>Software simulation</span></div></div>
            <div className="helmet-connection"><div className="helmet-status-icon"><ShieldCheck size={24} /></div><strong>{settings.helmetId}</strong><span><i></i> Software Ready</span></div>
            <div className="connection-details"><div><span>PROFILE</span><strong>{settings.riderName}</strong></div><div><span>MODE</span><strong>Prototype</strong></div><div><span>STATUS</span><strong>Ready</strong></div></div>
            <button type="button" className="connection-button" onClick={() => alert("Software prototype is working correctly.")}><CheckCircle2 size={15} />Test Software</button>
          </section>

          <section className="settings-card preferences-card">
            <div className="settings-card-heading"><div className="settings-heading-icon blue"><Settings size={18} /></div><div><h4>App Preferences</h4><span>Interface behaviour</span></div></div>
            <label className="settings-field compact"><span>MAP TYPE</span><select value={settings.mapType} onChange={(e) => update("mapType", e.target.value)}><option>Street</option><option>Satellite</option></select></label>
            <label className="settings-field compact"><span>UNITS</span><select value={settings.units} onChange={(e) => update("units", e.target.value)}><option>Metric (km / km/h)</option><option>Imperial (mi / mph)</option></select></label>
            <label className="settings-field compact"><span>LANGUAGE</span><select value={settings.language} onChange={(e) => update("language", e.target.value)}><option>English</option><option>Tamil</option></select></label>
          </section>

          <section className="settings-software-note"><Activity size={17} /><div><strong>Software-only mode</strong><span>All settings on this page are saved locally in your browser. No physical helmet connection is required.</span></div></section>
        </aside>
      </div>

      <div className="settings-actions"><button type="button" className="settings-reset-button" onClick={resetSettings}>Reset</button><button type="button" className="settings-save-button" onClick={saveSettings}><CheckCircle2 size={16} />Save Settings</button></div>
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
                No emergency event was recorded. Your Smart Helmet remains active and ready.
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


function HelpPage() {
  const [openFaq, setOpenFaq] = useState(0);
  const faqs = [
    ["How does accident detection work?", "The prototype simulates the accident-detection flow and starts a cancellation countdown before an emergency event is recorded."],
    ["Can I plan a route?", "Yes. Navigation uses a live map, place search and public routing services to calculate a driving route."],
    ["Does SOS send a real SMS?", "Not in this software-only version. The emergency page demonstrates the alert flow without sending a real message."],
    ["Where are my settings stored?", "Your rider settings are stored locally in this browser using localStorage."],
  ];
  return (
    <div className="help-page page-enter">
      <div className="help-hero"><div><p className="eyebrow">HELMETRA SUPPORT</p><h3>Help & Support</h3><p>Everything you need to understand and use the Smart Helmet software prototype.</p></div><div className="help-hero-icon"><HelpCircle size={38} /></div></div>
      <div className="help-grid">
        <section className="help-card"><div className="help-card-heading"><div className="help-icon blue"><ShieldCheck size={19} /></div><div><h4>Using Helmetra</h4><span>Quick software guide</span></div></div><div className="help-steps"><div><b>01</b><strong>Dashboard</strong><span>See your ride status, GPS, battery and protection overview.</span></div><div><b>02</b><strong>Navigation</strong><span>Search a destination and calculate a route from the demo GPS position.</span></div><div><b>03</b><strong>Emergency</strong><span>Run an SOS or accident simulation with a 10-second cancellation window.</span></div><div><b>04</b><strong>Routes</strong><span>Review the active route and recent ride history.</span></div></div></section>
        <section className="help-card"><div className="help-card-heading"><div className="help-icon purple"><MessageSquare size={19} /></div><div><h4>Frequently Asked Questions</h4><span>Common prototype questions</span></div></div><div className="faq-list">{faqs.map(([q,a], i) => <div className={`faq-item ${openFaq === i ? "open" : ""}`} key={q}><button type="button" onClick={() => setOpenFaq(openFaq === i ? -1 : i)}><span>{q}</span><span>{openFaq === i ? "−" : "+"}</span></button>{openFaq === i && <p>{a}</p>}</div>)}</div></section>
      </div>
      <div className="help-contact-grid"><div className="help-contact-card"><Phone size={21} /><div><strong>Emergency support</strong><span>Use the Emergency page for the SOS and accident response simulator.</span></div></div><div className="help-contact-card"><Settings size={21} /><div><strong>Need to change something?</strong><span>Open Settings to update your rider profile and software preferences.</span></div></div><div className="help-contact-card"><Activity size={21} /><div><strong>Prototype status</strong><span>Software-only demonstration. Hardware merging is not required for this version.</span></div></div></div>
    </div>
  );
}


function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    if (mode === "signup" && !form.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    // Prototype-only authentication. Replace with backend auth later.
    localStorage.setItem("helmetra_authenticated", "true");
    localStorage.setItem("helmetra_user", form.name.trim() || "Rider");
    onAuthenticated();
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setShowPassword(false);
  };

  return (
    <div className="auth-shell">
      <div className="auth-aurora auth-aurora-one"></div>
      <div className="auth-aurora auth-aurora-two"></div>
      <div className="auth-grid"></div>
      <div className="auth-stars">
        <span></span><span></span><span></span><span></span><span></span><span></span>
      </div>

      <div className="auth-brand">
        <div className="auth-brand-icon"><ShieldCheck size={27} /></div>
        <div>
          <strong>Helmetra</strong>
          <span>SMART SAFETY</span>
        </div>
      </div>

      <div className="auth-layout">
        <section className="auth-showcase">
          <div className="auth-kicker">SMART HELMET SYSTEM</div>
          <h1>Ride smart.<br /><span>Stay protected.</span></h1>
          <p>
            Your connected safety companion for live tracking, accident detection,
            emergency alerts and safer navigation.
          </p>

          <div className="auth-feature-row">
            <div><ShieldCheck size={17} /><span>Accident detection</span></div>
            <div><MapPin size={17} /><span>Live GPS tracking</span></div>
            <div><Siren size={17} /><span>Emergency response</span></div>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-card-top">
            <div className="auth-card-icon">
              {mode === "login" ? <LogIn size={21} /> : <UserPlus size={21} />}
            </div>
            <div>
              <span className="auth-mini-label">HELMETRA ACCOUNT</span>
              <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
              <p>
                {mode === "login"
                  ? "Sign in to access your safety dashboard."
                  : "Set up your rider profile to get started."}
              </p>
            </div>
          </div>

          <div className="auth-tabs">
            <button className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")} type="button">
              Sign In
            </button>
            <button className={mode === "signup" ? "active" : ""} onClick={() => switchMode("signup")} type="button">
              Sign Up
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <label>
                <span>Rider name</span>
                <div className="auth-input-wrap">
                  <UserRound size={18} />
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter your name"
                    autoComplete="name"
                  />
                </div>
              </label>
            )}

            <label>
              <span>Email address</span>
              <div className="auth-input-wrap">
                <Mail size={18} />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </label>

            <label>
              <span>Password</span>
              <div className="auth-input-wrap">
                <Lock size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter your password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  className="auth-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {mode === "login" && (
              <div className="auth-form-options">
                <label className="auth-check">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <button type="button" className="auth-link">Forgot password?</button>
              </div>
            )}

            {error && <div className="auth-error">{error}</div>}

            <button className="auth-submit" type="submit">
              <span>{mode === "login" ? "Sign in to Helmetra" : "Create Helmetra account"}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>

          <button
            className="auth-demo"
            type="button"
            onClick={() => {
              localStorage.setItem("helmetra_authenticated", "true");
              localStorage.setItem("helmetra_user", "Demo Rider");
              onAuthenticated();
            }}
          >
            <ShieldCheck size={18} />
            Continue with demo rider
          </button>

          <p className="auth-legal">
            Prototype authentication • Your account is stored locally for this demo.
          </p>
        </section>
      </div>

      <div className="auth-footer">HELMETRA • SMART SAFETY • CONNECTED RIDING</div>
    </div>
  );
}

function App() {

  const [authenticated, setAuthenticated] = useState(() =>
    localStorage.getItem("helmetra_authenticated") === "true"
  );

  const [activePage, setActivePage] =
    useState("Dashboard");

  const [mobileMenu, setMobileMenu] =
    useState(false);

  const [profileOpen, setProfileOpen] = useState(false);

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
    setProfileOpen(false);

  };


  if (!authenticated) {
    return <AuthPage onAuthenticated={() => setAuthenticated(true)} />;
  }


  return (

    <div className="app">


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


        <div className="sidebar-footer-wrap">
          <button type="button" className="sidebar-footer" onClick={() => setProfileOpen((v) => !v)} aria-expanded={profileOpen}>
            <div className="user-avatar">{(localStorage.getItem("helmetra_user") || "R").charAt(0).toUpperCase()}</div>
            <div><strong>{localStorage.getItem("helmetra_user") || "Rider"}</strong><small>Smart Helmet H001</small></div>
            <span className="profile-chevron">⌃</span>
          </button>
          {profileOpen && (
            <div className="profile-menu">
              <div className="profile-menu-head"><div className="user-avatar">{(localStorage.getItem("helmetra_user") || "R").charAt(0).toUpperCase()}</div><div><strong>{localStorage.getItem("helmetra_user") || "Rider"}</strong><small>Smart Helmet H001</small></div></div>
              <button type="button" onClick={() => { setActivePage("Settings"); setProfileOpen(false); }}><Settings size={16} />Settings</button>
              <button type="button" onClick={() => { setActivePage("Help & Support"); setProfileOpen(false); }}><HelpCircle size={16} />Help & Support</button>
              <button type="button" className="logout-item" onClick={() => { localStorage.removeItem("helmetra_authenticated"); setAuthenticated(false); setProfileOpen(false); }}><LogOut size={16} />Log out</button>
            </div>
          )}
        </div>

      </aside>



      {/* MAIN */}

      <main className="main">


        {/* TOP BAR */}

        <div className="topbar">

          <div>

            {activePage === "Dashboard" && (
              <>
                <p className="eyebrow">SMART HELMET SYSTEM</p>
                <h2>Dashboard</h2>
              </>
            )}

          </div>


          <div className="top-actions">

            <div className="live-status">

              <span className="status-dot"></span>

              {telemetry.apiOnline ? "Live" : "Offline"}

            </div>




          </div>

        </div>



        {/* ================= DASHBOARD ================= */}

        {activePage === "Dashboard" && (
          <div className="dashboard-home">

            <section className="dashboard-welcome-card dashboard-command-hero">
              <div className="dashboard-welcome-copy">
                <p className="dashboard-kicker">SMART HELMET SYSTEM</p>
                <h1>Ride safer. Stay connected.</h1>
                <p>
                  Your safety command center keeps GPS, accident detection, navigation and emergency protection visible at a glance.
                </p>
                <div className="command-hero-actions">
                  <button type="button" onClick={() => handleNavigation("Live Tracking")}><MapPin size={16} />View live location</button>
                  <button type="button" onClick={() => handleNavigation("Emergency")}><Siren size={16} />Emergency controls</button>
                </div>
              </div>

              <div className="dashboard-command-panel">
                <div className="dashboard-command-header">
                  <div>
                    <span>SAFETY COMMAND CENTER</span>
                    <strong>{telemetry.accidentDetected ? "Attention Required" : "Protection Active"}</strong>
                  </div>
                  <div className={`dashboard-command-status ${telemetry.accidentDetected ? "alert" : "safe"}`}><i></i>{telemetry.accidentDetected ? "ALERT" : "SYSTEM READY"}</div>
                </div>
                <div className="dashboard-command-grid">
                  <div className="dashboard-command-item"><div className="command-icon blue"><MapPin size={17} /></div><div><span>GPS</span><strong>{telemetry.gpsStatus}</strong><small>{telemetry.satellites} satellites</small></div></div>
                  <div className="dashboard-command-item"><div className="command-icon green"><Activity size={17} /></div><div><span>ACCIDENT DETECTION</span><strong>{telemetry.accidentDetected ? "Detected" : "Armed"}</strong><small>MPU6050 monitoring</small></div></div>
                  <div className="dashboard-command-item"><div className="command-icon purple"><Navigation size={17} /></div><div><span>NAVIGATION</span><strong>Ready</strong><small>Route planning available</small></div></div>
                  <div className="dashboard-command-item"><div className="command-icon orange"><BatteryMedium size={17} /></div><div><span>BATTERY</span><strong>{telemetry.battery}%</strong><small>{telemetry.battery > 20 ? "Healthy level" : "Charge soon"}</small></div></div>
                </div>
                <div className="dashboard-command-footer"><ShieldCheck size={16} /><span>Continuous protection monitoring is active</span><i></i></div>
              </div>
            </section>

            <section className="dashboard-summary-grid">
              <div className="dashboard-summary-card">
                <div className="dashboard-summary-icon blue"><MapPin size={20} /></div>
                <div><span>GPS</span><strong>{telemetry.gpsStatus}</strong><small>{telemetry.satellites} satellites</small></div>
              </div>
              <div className="dashboard-summary-card">
                <div className="dashboard-summary-icon green"><Gauge size={20} /></div>
                <div><span>SPEED</span><strong>{telemetry.speed} km/h</strong><small>Current riding speed</small></div>
              </div>
              <div className="dashboard-summary-card">
                <div className="dashboard-summary-icon orange"><BatteryMedium size={20} /></div>
                <div><span>BATTERY</span><strong>{telemetry.battery}%</strong><small>Helmet battery</small></div>
              </div>
              <div className="dashboard-summary-card">
                <div className="dashboard-summary-icon purple"><Wifi size={20} /></div>
                <div><span>CONNECTION</span><strong>{telemetry.connection}</strong><small>Helmet data link</small></div>
              </div>
            </section>

            <section className="dashboard-features-section">
              <div className="dashboard-section-heading">
                <div>
                  <p className="dashboard-kicker">CONTROL CENTER</p>
                  <h2>Smart Helmet Features</h2>
                </div>
                <span>Tap a card to open the feature</span>
              </div>

              <div className="dashboard-feature-grid">
                <button className="dashboard-feature-card feature-blue" onClick={() => handleNavigation("Live Tracking")}>
                  <div className="feature-card-icon"><Map size={23} /></div>
                  <div className="feature-card-content">
                    <span className="feature-card-label">01 · LOCATION</span>
                    <h3>Live Tracking</h3>
                    <p>View the rider's live GPS position and current ride data on the map.</p>
                    <div className="feature-card-status"><i></i>{telemetry.gpsStatus} GPS</div>
                  </div>
                  <ArrowRight size={20} className="feature-arrow" />
                </button>

                <button className="dashboard-feature-card feature-purple" onClick={() => handleNavigation("Navigation")}>
                  <div className="feature-card-icon"><Navigation size={23} /></div>
                  <div className="feature-card-content">
                    <span className="feature-card-label">02 · ROUTING</span>
                    <h3>Navigation</h3>
                    <p>Search a destination, calculate a route and view distance and ETA.</p>
                    <div className="feature-card-status"><i></i>Route planning ready</div>
                  </div>
                  <ArrowRight size={20} className="feature-arrow" />
                </button>

                <button className="dashboard-feature-card feature-red" onClick={() => handleNavigation("Emergency")}>
                  <div className="feature-card-icon"><Siren size={23} /></div>
                  <div className="feature-card-content">
                    <span className="feature-card-label">03 · SAFETY</span>
                    <h3>Emergency</h3>
                    <p>Trigger SOS, handle accident alerts and share the latest location.</p>
                    <div className="feature-card-status"><i></i>Emergency protection</div>
                  </div>
                  <ArrowRight size={20} className="feature-arrow" />
                </button>

                <button className="dashboard-feature-card feature-cyan" onClick={() => handleNavigation("Routes")}>
                  <div className="feature-card-icon"><Route size={23} /></div>
                  <div className="feature-card-content">
                    <span className="feature-card-label">04 · HISTORY</span>
                    <h3>Routes</h3>
                    <p>Review current route information and your recent ride history.</p>
                    <div className="feature-card-status"><i></i>Ride history available</div>
                  </div>
                  <ArrowRight size={20} className="feature-arrow" />
                </button>

                <button className="dashboard-feature-card feature-green" onClick={() => handleNavigation("System Status")}>
                  <div className="feature-card-icon"><Activity size={23} /></div>
                  <div className="feature-card-content">
                    <span className="feature-card-label">05 · HARDWARE</span>
                    <h3>System Status</h3>
                    <p>Check ESP32, MPU6050, NEO-6M, SIM800L, buzzer and battery status.</p>
                    <div className="feature-card-status"><i></i>Component monitoring</div>
                  </div>
                  <ArrowRight size={20} className="feature-arrow" />
                </button>

                <button className="dashboard-feature-card feature-orange" onClick={() => handleNavigation("Settings")}>
                  <div className="feature-card-icon"><Settings size={23} /></div>
                  <div className="feature-card-content">
                    <span className="feature-card-label">06 · CONTROL</span>
                    <h3>Settings</h3>
                    <p>Manage rider details, emergency contacts and Smart Helmet preferences.</p>
                    <div className="feature-card-status"><i></i>Configuration</div>
                  </div>
                  <ArrowRight size={20} className="feature-arrow" />
                </button>
              </div>
            </section>

            <section className="dashboard-bottom-grid">
              <button className="dashboard-quick-card" onClick={() => handleNavigation("Emergency")}>
                <div className="quick-card-icon emergency"><AlertTriangle size={22} /></div>
                <div>
                  <span>EMERGENCY ACCESS</span>
                  <strong>Need immediate help?</strong>
                  <small>Open SOS and emergency controls</small>
                </div>
                <ArrowRight size={18} />
              </button>

              <button className="dashboard-quick-card" onClick={() => handleNavigation("System Status")}>
                <div className="quick-card-icon system"><Activity size={22} /></div>
                <div>
                  <span>SYSTEM HEALTH</span>
                  <strong>{telemetry.accidentDetected ? "Attention required" : "All systems normal"}</strong>
                  <small>Open component diagnostics</small>
                </div>
                <ArrowRight size={18} />
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
                          🪖 Smart Helmet
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

        {activePage === "Routes" && <RoutesPage telemetry={telemetry} />}

        {/* ================= SETTINGS ================= */}

        {activePage === "Settings" && <SettingsPage />}

        {/* ================= SYSTEM STATUS ================= */}

        {activePage === "System Status" && <SystemStatusPage telemetry={telemetry} />}


        {/* ================= EMERGENCY ================= */}

        {activePage === "Emergency" && <EmergencyPage telemetry={telemetry} />}

        {activePage === "Help & Support" && <HelpPage />}


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
          activePage !== "Emergency" && (

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
                and connected to the Smart
                Helmet hardware in the next
                stages.
              </p>

            </section>

          )}

      </main>

    </div>

  );
}

export default App;