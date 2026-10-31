import { Link } from 'react-router-dom';
import { Zap, Activity, Moon, Sun } from 'lucide-react';

export default function Header({ theme, onToggleTheme, xrayOn, onToggleXray }) {
  const handleSwitchKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onToggleTheme();
    }
  };

  return (
    <header className="hackhq-header">
      <Link to="/" className="header-brand" aria-label="HackHQ mission control home">
        <div className="brand-logo-badge" aria-hidden="true">
          <Zap size={20} className="brand-zap-icon" />
        </div>
        <div className="brand-text">
          <span className="brand-title">HackHQ</span>
          <span className="brand-subtitle">DAY-OF CONTROL ROOM</span>
        </div>
      </Link>

      <div className="header-actions">
        {/* State X-ray Toggle Pill */}
        <button
          type="button"
          onClick={onToggleXray}
          className={`xray-toggle-pill ${xrayOn ? 'active' : ''}`}
          aria-pressed={xrayOn}
          title="Toggle live State X-ray inspector"
        >
          <Activity size={15} className="xray-pill-icon" aria-hidden="true" />
          <span className="xray-pill-label">State X-ray</span>
          <span className={`xray-live-dot ${xrayOn ? 'on' : 'off'}`} aria-hidden="true" />
        </button>

        {/* Squircle Theme Toggle Button */}
        <button
          type="button"
          role="switch"
          aria-checked={theme === 'dark'}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          onClick={onToggleTheme}
          onKeyDown={handleSwitchKeyDown}
          className="theme-toggle-btn"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun size={18} className="theme-btn-icon sun-icon" />
          ) : (
            <Moon size={18} className="theme-btn-icon moon-icon" />
          )}
        </button>
      </div>
    </header>
  );
}
