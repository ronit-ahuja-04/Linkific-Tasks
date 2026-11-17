import { Moon, Sun } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useThemeActions, useThemeState } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import Avatar from './Avatar';
import NotificationBell from './NotificationBell';

const LINKS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/chat', label: 'Chat' },
  { to: '/notes', label: 'Notes' },
  { to: '/files', label: 'Files' },
  { to: '/lab', label: 'Query lab' },
  { to: '/profile', label: 'Profile' },
];

export default function AppLayout() {
  const { profile, user, signOut } = useAuth();
  const { isDark } = useThemeState();
  const { toggleTheme } = useThemeActions();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.info('Signed out');
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="app-header">
        <NavLink to="/" className="brand"><span className="brand-mark" aria-hidden="true">H</span>Huddle</NavLink>
        <nav className="app-nav" aria-label="Main">
          {LINKS.map((link) => <NavLink key={link.to} to={link.to} end={link.end}>{link.label}</NavLink>)}
        </nav>
        <span className="header-spacer" />
        <div className="header-actions">
          <NotificationBell />
          <button type="button" className="icon-btn" onClick={toggleTheme} aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}>
            {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button>
          <Avatar profile={profile} />
          <span className="muted" style={{ fontSize: 14 }}>{profile?.username ?? user?.email}</span>
          <button type="button" className="btn btn-sm" onClick={handleSignOut}>Sign out</button>
        </div>
      </header>
      <main id="main" className="app-main" tabIndex={-1}><Outlet /></main>
    </div>
  );
}
