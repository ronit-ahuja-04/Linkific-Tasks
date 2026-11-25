import { useEffect, useId, useRef, useState } from 'react';
import { Link, matchPath, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FlaskConical, FolderOpen, LayoutDashboard, LogOut, Menu, MessagesSquare, NotebookPen, Palette, UserRound, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSidebarRooms } from '../hooks/useSidebarRooms';
import Avatar from './Avatar';
import NotificationBell from './NotificationBell';
import SidebarRooms from './SidebarRooms';
import ThemeToggle from './ThemeToggle';
import '../styles/shell.css';

const PRIMARY = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/chat', label: 'Chat', icon: MessagesSquare },
  { to: '/notes', label: 'Notes', icon: NotebookPen },
  { to: '/files', label: 'Files', icon: FolderOpen },
];

/**
 * THE APP SHELL. One DOM, two layouts (shell.css):
 *  - 960px and wider: a sticky sidebar (brand, bell and theme on top; pages; my rooms; developer tools; me).
 *  - narrower: one 56px top bar, and the same <nav> becomes a disclosure panel behind a "Menu" button.
 * Landmarks: header (banner), nav "Main", main. A skip link jumps past all of it.
 * On every page change focus moves to the new page's h1, so a screen reader announces where you are and a
 * keyboard user continues from the content, not from the link they pressed.
 */
export default function AppLayout() {
  const { client, profile, user, signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const sidebarRef = useRef(null);
  const menuButtonRef = useRef(null);
  const mainRef = useRef(null);
  const lastPath = useRef(location.pathname);
  const roomsLabel = useId();
  const devLabel = useId();
  const rooms = useSidebarRooms(client, user?.id, location.pathname);
  const openRoomId = matchPath('/chat/:roomId', location.pathname)?.params.roomId;

  // The phone menu closes on Escape (focus back on the button) and on a tap outside it
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };
    const onPointer = (event) => {
      if (!sidebarRef.current?.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [menuOpen]);

  // ...and when keyboard focus leaves it, so the open panel can never hide the element that has focus (WCAG 2.4.11)
  const onSidebarBlur = (event) => {
    if (menuOpen && event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setMenuOpen(false);
  };

  // Choosing a page closes the menu
  const onNavClick = (event) => {
    if (event.target.closest('a')) setMenuOpen(false);
  };

  // A new page: move focus to its h1, unless the page already put focus somewhere inside itself
  useEffect(() => {
    if (lastPath.current === location.pathname) return undefined;
    lastPath.current = location.pathname;
    const frame = requestAnimationFrame(() => {
      const main = mainRef.current;
      if (!main) return;
      const active = document.activeElement;
      if (active && active !== document.body && active !== main && main.contains(active)) return;
      const heading = main.querySelector('h1');
      if (!heading) {
        main.focus();
        return;
      }
      if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
      heading.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    toast.info('Signed out');
    navigate('/login', { replace: true });
  };

  const name = profile?.full_name || profile?.username || user?.email;

  return (
    <div className="shell">
      <a className="skip-link" href="#main">Skip to content</a>

      <div className="shell-sidebar" ref={sidebarRef} onBlur={onSidebarBlur}>
        <header className="shell-bar">
          <button
            ref={menuButtonRef}
            type="button"
            className="icon-btn shell-menu-btn"
            aria-label="Menu"
            aria-expanded={menuOpen}
            aria-controls="shell-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
          <Link to="/" className="brand"><span className="brand-mark" aria-hidden="true">H</span>Huddle</Link>
          <span className="header-spacer" />
          <NotificationBell />
          <ThemeToggle />
        </header>

        <nav id="shell-menu" className="shell-side" aria-label="Main" data-open={menuOpen ? '' : undefined} onClick={onNavClick}>
          <ul className="shell-list">
            {PRIMARY.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                {/* "page" on the page itself; "true" on Chat while a room inside it is open */}
                <NavLink to={to} end={end} className="shell-link" aria-current={location.pathname === to ? 'page' : 'true'}>
                  <Icon size={18} aria-hidden="true" />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          <SidebarRooms rooms={rooms} openRoomId={openRoomId} labelId={roomsLabel} />

          <div className="shell-group">
            <p id={devLabel} className="shell-group-label">Developer</p>
            <ul className="shell-list" aria-labelledby={devLabel}>
              <li>
                <NavLink to="/lab" className="shell-link"><FlaskConical size={18} aria-hidden="true" /><span>Query lab</span></NavLink>
              </li>
              <li>
                <Link to="/styleguide" className="shell-link"><Palette size={18} aria-hidden="true" /><span>Design system</span></Link>
              </li>
            </ul>
          </div>

          <div className="shell-account">
            <div className="shell-identity">
              <Avatar profile={profile} size={32} />
              <span className="shell-identity-text">
                <span className="shell-identity-name">{name}</span>
                {profile?.username ? <span className="shell-identity-handle">@{profile.username}</span> : null}
              </span>
            </div>
            <ul className="shell-list">
              <li>
                <NavLink to="/profile" className="shell-link"><UserRound size={18} aria-hidden="true" /><span>Profile</span></NavLink>
              </li>
              <li>
                <button type="button" className="shell-link" onClick={handleSignOut}><LogOut size={18} aria-hidden="true" /><span>Sign out</span></button>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      <main id="main" ref={mainRef} className="shell-main" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
