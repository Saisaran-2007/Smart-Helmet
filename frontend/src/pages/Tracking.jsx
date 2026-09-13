import {
  MapPin,
  Navigation,
  Gauge,
  Satellite,
  Clock3,
} from "lucide-react";

function Tracking() {
  return (
    <div className="tracking-page">

      <div className="tracking-header">
        <div>
          <p className="eyebrow">GPS MONITORING</p>
          <h3>Live Tracking</h3>
          <p className="page-description">
            Monitor your helmet location and ride information in real time.
          </p>
        </div>

        <div className="gps-live">
          <span className="status-dot"></span>
          GPS LIVE
        </div>
      </div>

      <div className="tracking-layout">

        {/* MAP */}
        <div className="tracking-map-card">
          <div className="tracking-map">

            <div className="map-grid"></div>

            <div className="tracking-road road-a"></div>
            <div className="tracking-road road-b"></div>
            <div className="tracking-road road-c"></div>

            <div className="live-marker">
              <div className="marker-pulse"></div>
              <MapPin size={27} />
            </div>

            <div className="map-label">
              <strong>Smart Helmet</strong>
              <span>Live location</span>
            </div>

          </div>
        </div>

        {/* INFORMATION */}
        <div className="tracking-info">

          <div className="info-card">
            <div className="info-icon blue">
              <MapPin size={20} />
            </div>

            <div>
              <span>CURRENT LOCATION</span>
              <strong>13.0827° N, 80.2707° E</strong>
              <small>GPS coordinates</small>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon green">
              <Gauge size={20} />
            </div>

            <div>
              <span>CURRENT SPEED</span>
              <strong>42 km/h</strong>
              <small>Normal riding speed</small>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon purple">
              <Satellite size={20} />
            </div>

            <div>
              <span>GPS SIGNAL</span>
              <strong>Strong</strong>
              <small>8 satellites connected</small>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon orange">
              <Clock3 size={20} />
            </div>

            <div>
              <span>LAST UPDATED</span>
              <strong>Just now</strong>
              <small>Location updating automatically</small>
            </div>
          </div>

          <button className="navigation-button">
            <Navigation size={18} />
            Start Navigation
          </button>

        </div>

      </div>
    </div>
  );
}

export default Tracking;