import { Radio, Moon, Sun, Terminal } from 'lucide-react';

export default function Header({
  activeStation,
  stationNames,
  theme,
  onToggleTheme,
  xrayOn,
  onToggleXray,
}) {
  const currentStationTitle = stationNames[activeStation] || 'Control Room';

  const handleSwitchKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onToggleTheme();
    }
  };

  return (
    <header className="hackhq-header">
      <div className="header-brand">
        <div className="brand-logo-badge" aria-hidden="true">
          <Radio size={18} className="brand-pulse-icon" />
        </div>
        <div className="brand-text">
          <span className="brand-title">HackHQ</span>
          <span className="brand-subtitle">Control Room</span>
        </div>
        <div className="station-active-pill" aria-label={`Current station: ${currentStationTitle}`}>
          <span className="pill-dot" aria-hidden="true"></span>
          <span className="pill-text">{currentStationTitle}</span>
        </div>
      </div>

      <div className="header-actions">
        {/* State X-ray Toggle Button */}
        <button
          type="button"
          onClick={onToggleXray}
          className={`xray-toggle-btn ${xrayOn ? 'active' : ''}`}
          aria-pressed={xrayOn}
          title="Toggle live State X-ray inspector"
        >
          <Terminal size={16} aria-hidden="true" />
          <span className="btn-label">State X-ray</span>
          <span className={`status-indicator ${xrayOn ? 'on' : 'off'}`} aria-hidden="true">
            {xrayOn ? 'LIVE' : 'OFF'}
          </span>
        </button>

        {/* Premium Animated Theme Switch (TH-1, TH-2) */}
        <div className="theme-toggle-group">
          <button
            type="button"
            role="switch"
            aria-checked={theme === 'dark'}
            aria-label={`Toggle dark mode, current mode is ${theme}`}
            onClick={onToggleTheme}
            onKeyDown={handleSwitchKeyDown}
            className={`theme-toggle-pill ${theme === 'dark' ? 'is-dark' : 'is-light'}`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {/* Celestial stationary background icons */}
            <span className="toggle-track-bg">
              <span className="celestial-icon sun-track-icon" aria-hidden="true">
                <Sun size={13} />
              </span>
              <span className="celestial-icon moon-track-icon" aria-hidden="true">
                <Moon size={13} />
              </span>
            </span>

            {/* Spring-animated sliding thumb with rotating icon */}
            <span className="toggle-slider-thumb" aria-hidden="true">
              <span className="slider-icon-core" key={theme}>
                {theme === 'dark' ? (
                  <Moon size={14} className="slider-icon moon-icon" />
                ) : (
                  <Sun size={14} className="slider-icon sun-icon" />
                )}
              </span>
            </span>
          </button>

          <span className="theme-status-pill tabular-nums" aria-hidden="true">
            {theme === 'dark' ? 'Dark' : 'Light'}
          </span>
        </div>
      </div>
    </header>
  );
}
