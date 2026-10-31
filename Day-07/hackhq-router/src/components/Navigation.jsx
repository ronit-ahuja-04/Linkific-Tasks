import { NavLink } from 'react-router-dom';
import { STATIONS } from '../data/stations.js';

// CONCEPT: NavLink - knows whether its `to` matches the current URL and sets aria-current="page"
export default function Navigation() {
  return (
    <nav className="hackhq-nav" aria-label="Control room stations">
      <div className="nav-container">
        <div className="nav-section-label">STATIONS</div>
        <ul className="nav-list">
          {STATIONS.map((station) => {
            const Icon = station.icon;

            return (
              <li key={station.id} className="nav-item">
                <NavLink
                  to={station.path}
                  // `end` stops "/" from matching every URL that starts with "/"
                  end={station.path === '/'}
                  className={({ isActive }) => `nav-button ${isActive ? 'active' : ''}`}
                >
                  {({ isActive }) => (
                    <>
                      <span className="nav-icon-box" aria-hidden="true">
                        <Icon size={18} />
                      </span>
                      <span className="nav-name">{station.name}</span>
                      {isActive && <span className="nav-accent-bar" aria-hidden="true" />}
                    </>
                  )}
                </NavLink>
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
          <span className="sidebar-date-text">Saturday · 31 Oct 2026</span>
        </div>
      </div>
    </nav>
  );
}
