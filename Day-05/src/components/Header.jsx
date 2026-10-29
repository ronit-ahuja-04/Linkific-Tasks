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

        {/* Accessible Dark Mode Switch (TH-1, TH-2) */}
        <div className="theme-switch-wrapper">
          <span id="theme-switch-label" className="theme-label sr-only">
            Dark theme toggle
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={theme === 'dark'}
            aria-labelledby="theme-switch-label"
            onClick={onToggleTheme}
            onKeyDown={handleSwitchKeyDown}
            className={`theme-switch ${theme === 'dark' ? 'is-dark' : 'is-light'}`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <span className="switch-thumb">
              {theme === 'dark' ? (
                <Moon size={13} className="switch-icon" aria-hidden="true" />
              ) : (
                <Sun size={13} className="switch-icon" aria-hidden="true" />
              )}
            </span>
            <span className="theme-mode-text" aria-hidden="true">
              {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

