import { STATIONS } from '../data/stations.js';

export default function Navigation({ activeStation, onSelectStation }) {
  return (
    <nav className="hackhq-nav" aria-label="Control room stations">
      <div className="nav-container">
        <div className="nav-header sr-only">HackHQ Stations</div>
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
                  <span className="nav-badge" aria-hidden="true">
                    {station.badge}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
