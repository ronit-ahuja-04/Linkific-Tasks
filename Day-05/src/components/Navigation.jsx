import { STATIONS } from '../data/stations.js';

export default function Navigation({ activeStation, onSelectStation }) {
  return (
    <nav className="hackhq-nav" aria-label="Control room stations">
      <div className="nav-container">
        <div className="nav-section-label">STATIONS</div>
        <ul className="nav-list" role="tablist">
          {STATIONS.map((station) => {
            const Icon = station.icon;
            const isActive = activeStation === station.id;

            return (
              <li key={station.id} className="nav-item" role="presentation">
                <button
                  type="button"
                  role="tab"
                  id={`tab-${station.id}`}
                  aria-selected={isActive}
                  aria-controls={`panel-${station.id}`}
                  aria-current={isActive ? 'page' : undefined}
                  className={`nav-button ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectStation(station.id)}
                >
                  <span className="nav-icon-box" aria-hidden="true">
                    <Icon size={18} />
                  </span>
                  <span className="nav-name">{station.name}</span>
                  {isActive && <span className="nav-accent-bar" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Sidebar Footer Indicator */}
        <div className="sidebar-footer-card">
          <div className="sidebar-live-tag">
            <span className="pulse-dot" aria-hidden="true" />
            <span>Live workspace</span>
          </div>
          <span className="sidebar-date-text">Thursday · 29 Oct 2026</span>
        </div>
      </div>
    </nav>
  );
}
