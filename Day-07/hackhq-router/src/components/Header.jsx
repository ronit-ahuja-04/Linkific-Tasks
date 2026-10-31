import { Link, useNavigate } from 'react-router-dom';
import { Zap, Activity, Moon, Sun, Search, LogIn, LogOut } from 'lucide-react';

export default function Header({
  theme,
  onToggleTheme,
  xrayOn,
  onToggleXray,
  onOpenPalette,
  isOrganizer,
  onLogout,
}) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/', { replace: true });
  };

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
        {/* W5: Command palette trigger (also ⌘K / Ctrl+K) */}
        <button
          type="button"
          onClick={onOpenPalette}
          className="cmdk-trigger"
          aria-label="Open command palette"
          aria-keyshortcuts="Meta+K Control+K"
        >
          <Search size={15} aria-hidden="true" />
          <span className="cmdk-trigger-label">Jump to…</span>
          <kbd className="cmdk-kbd">⌘K</kbd>
        </button>

        {/* Organizer session (M4): log in link or log out button */}
        {isOrganizer ? (
          <button type="button" className="auth-pill signed-in" onClick={handleLogout}>
            <span className="auth-dot" aria-hidden="true" />
            <span className="auth-pill-label">Organizer</span>
            <LogOut size={15} aria-hidden="true" />
            <span className="sr-only">Log out</span>
          </button>
        ) : (
          <Link to="/login" className="auth-pill">
            <LogIn size={15} aria-hidden="true" />
            <span className="auth-pill-label">Log in</span>
          </Link>
        )}

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
