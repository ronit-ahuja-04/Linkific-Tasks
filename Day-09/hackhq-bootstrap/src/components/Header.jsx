import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Button } from 'react-bootstrap';
import { Zap, Activity, Moon, Sun, Search, LogIn, LogOut, Menu } from 'lucide-react';
import { Kbd, cx } from './ui.jsx';

const PILL = 'd-inline-flex align-items-center justify-content-center gap-2';

export default function Header({
  theme,
  onToggleTheme,
  xrayOn,
  onToggleXray,
  onOpenPalette,
  onOpenNav,
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
    <Navbar
      as="header"
      sticky="top"
      expand="lg"
      className="app-header flex-nowrap gap-2 border-bottom px-3 px-sm-4 py-0"
    >
      <Button
        variant="outline-secondary"
        onClick={onOpenNav}
        className={cx(PILL, 'd-lg-none px-0')}
        style={{ width: '2.5rem' }}
        aria-label="Open navigation"
      >
        <Menu size={18} aria-hidden="true" />
      </Button>

      <Navbar.Brand
        as={Link}
        to="/"
        className="d-flex align-items-center gap-2 me-0"
        aria-label="HackHQ mission control home"
      >
        <span
          className="bg-brand d-grid place-items-center rounded-3 shadow-sm"
          style={{ width: '2.25rem', height: '2.25rem', placeItems: 'center' }}
          aria-hidden="true"
        >
          <Zap size={18} strokeWidth={2.5} />
        </span>
        <span className="lh-1">
          <span className="d-block fs-5 fw-bold">HackHQ</span>
          <span
            className="d-none d-sm-block font-monospace text-body-secondary ls-wider"
            style={{ fontSize: '0.6rem' }}
          >
            DAY-OF CONTROL ROOM
          </span>
        </span>
      </Navbar.Brand>

      <div className="ms-auto d-flex align-items-center gap-2">
        {/* W5: Command palette trigger (also ⌘K / Ctrl+K) */}
        <Button
          variant="outline-secondary"
          onClick={onOpenPalette}
          className={cx(PILL, 'palette-trigger text-body-secondary')}
          aria-label="Open command palette"
          aria-keyshortcuts="Meta+K Control+K"
        >
          <Search size={15} aria-hidden="true" />
          <span className="d-none d-sm-inline flex-grow-1 text-start">Jump to…</span>
          <Kbd className="d-none d-sm-inline">⌘K</Kbd>
        </Button>

        {/* Organizer session (M4): log in link or log out button */}
        {isOrganizer ? (
          <Button variant="outline-success" className={PILL} onClick={handleLogout}>
            <span className="pulse-dot rounded-circle bg-success" aria-hidden="true" />
            <span className="d-none d-sm-inline">Organizer</span>
            <LogOut size={15} aria-hidden="true" />
            <span className="visually-hidden">Log out</span>
          </Button>
        ) : (
          <Button as={Link} to="/login" variant="outline-secondary" className={PILL}>
            <LogIn size={15} aria-hidden="true" />
            <span className="d-none d-sm-inline">Log in</span>
          </Button>
        )}

        {/* State X-ray Toggle Pill */}
        <Button
          variant={xrayOn ? 'outline-primary' : 'outline-secondary'}
          active={xrayOn}
          onClick={onToggleXray}
          className={cx(PILL, 'd-none d-md-inline-flex')}
          aria-pressed={xrayOn}
          title="Toggle live State X-ray inspector"
        >
          <Activity size={15} aria-hidden="true" />
          <span>State X-ray</span>
          <span
            className={cx(
              'pulse-dot rounded-circle',
              xrayOn ? 'bg-primary' : 'bg-secondary-subtle'
            )}
            aria-hidden="true"
          />
        </Button>

        <Button
          variant="outline-secondary"
          role="switch"
          aria-checked={theme === 'dark'}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          onClick={onToggleTheme}
          onKeyDown={handleSwitchKeyDown}
          className={cx(PILL, 'px-0')}
          style={{ width: '2.5rem' }}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun size={18} aria-hidden="true" />
          ) : (
            <Moon size={18} aria-hidden="true" />
          )}
        </Button>
      </div>
    </Navbar>
  );
}
