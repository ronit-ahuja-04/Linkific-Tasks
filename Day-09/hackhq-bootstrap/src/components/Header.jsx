import { Link, useNavigate } from 'react-router-dom';
import { Zap, Activity, Moon, Sun, Search, LogIn, LogOut, Menu } from 'lucide-react';
import { Kbd, cx } from './ui.jsx';

const PILL =
  'inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-medium text-ink transition hover:bg-surface-2';

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
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur-xl sm:px-6">
      <button
        type="button"
        onClick={onOpenNav}
        className={cx(PILL, 'w-10 justify-center px-0 lg:hidden')}
        aria-label="Open navigation"
      >
        <Menu size={18} aria-hidden="true" />
      </button>

      <Link to="/" className="flex items-center gap-2.5" aria-label="HackHQ mission control home">
        <span
          className="grid size-9 place-items-center rounded-xl bg-brand text-on-brand shadow-sm"
          aria-hidden="true"
        >
          <Zap size={18} strokeWidth={2.5} />
        </span>
        <span className="leading-none">
          <span className="block font-display text-lg font-bold tracking-tight">HackHQ</span>
          <span className="hidden font-mono text-[0.6rem] tracking-[0.2em] text-muted sm:block">
            DAY-OF CONTROL ROOM
          </span>
        </span>
      </Link>

      <div className="ml-auto flex items-center gap-2">
        {/* W5: Command palette trigger (also ⌘K / Ctrl+K) */}
        <button
          type="button"
          onClick={onOpenPalette}
          className={cx(PILL, 'text-muted sm:min-w-52')}
          aria-label="Open command palette"
          aria-keyshortcuts="Meta+K Control+K"
        >
          <Search size={15} aria-hidden="true" />
          <span className="hidden flex-1 text-left sm:inline">Jump to…</span>
          <Kbd className="hidden sm:inline">⌘K</Kbd>
        </button>

        {/* Organizer session (M4): log in link or log out button */}
        {isOrganizer ? (
          <button
            type="button"
            className={cx(PILL, 'border-good/40 bg-good-soft text-good')}
            onClick={handleLogout}
          >
            <span className="size-2 rounded-full bg-good" aria-hidden="true" />
            <span className="hidden sm:inline">Organizer</span>
            <LogOut size={15} aria-hidden="true" />
            <span className="sr-only">Log out</span>
          </button>
        ) : (
          <Link to="/login" className={PILL}>
            <LogIn size={15} aria-hidden="true" />
            <span className="hidden sm:inline">Log in</span>
          </Link>
        )}

        {/* State X-ray Toggle Pill */}
        <button
          type="button"
          onClick={onToggleXray}
          className={cx(
            PILL,
            'max-md:hidden',
            xrayOn && 'border-accent/40 bg-accent-soft text-accent'
          )}
          aria-pressed={xrayOn}
          title="Toggle live State X-ray inspector"
        >
          <Activity size={15} aria-hidden="true" />
          <span>State X-ray</span>
          <span
            className={cx('size-2 rounded-full', xrayOn ? 'bg-accent' : 'bg-line')}
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          role="switch"
          aria-checked={theme === 'dark'}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          onClick={onToggleTheme}
          onKeyDown={handleSwitchKeyDown}
          className={cx(PILL, 'w-10 justify-center px-0')}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun size={18} aria-hidden="true" />
          ) : (
            <Moon size={18} aria-hidden="true" />
          )}
        </button>
      </div>
    </header>
  );
}
