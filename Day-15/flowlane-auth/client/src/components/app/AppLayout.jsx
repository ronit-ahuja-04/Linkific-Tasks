import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useThemeActions, useThemeState } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { resendVerification } from '../../api/authApi';
import '../../styles/app.css';

// The shell of the signed-in app. It is rendered only below ProtectedRoute, so `user` exists.
export default function AppLayout() {
  const auth = useAuth();
  const { user } = auth;
  const { isDark } = useThemeState();
  const { toggleTheme } = useThemeActions();
  const toast = useToast();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      // logout() always ends anonymous (memory token dropped, cookie revoked server side)
      await auth.logout();
    } catch {
      // the user is signed out locally either way
    } finally {
      setLoggingOut(false);
      toast.info('Signed out');
      navigate('/login');
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await resendVerification();
      toast.success('Verification email sent. Check your inbox.');
    } catch (error) {
      toast.error(error?.message || 'Could not send the email. Try again.');
    } finally {
      setResending(false);
    }
  }

  const name = user?.name ?? '';
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="app-header">
        <div className="app-header-inner">
          <NavLink to="/dashboard" className="app-logo" aria-label="FlowLane home">
            <span className="app-logo-mark" aria-hidden="true">F</span>
            <span>FlowLane</span>
          </NavLink>
          <nav className="app-nav" aria-label="Main">
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/security">Security</NavLink>
            {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
          </nav>
          <div className="app-user">
            <span className="app-avatar" aria-hidden="true">{initial}</span>
            <span className="app-user-name">{name}</span>
            <span className={`badge${user?.role === 'admin' ? ' badge-admin' : ''}`}>{user?.role}</span>
            <button type="button" className="icon-btn" onClick={toggleTheme} aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}>
              {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
            </button>
            <button type="button" className="btn btn-sm" onClick={handleLogout} disabled={loggingOut}>
              <LogOut size={16} aria-hidden="true" /> Logout
            </button>
          </div>
        </div>
      </header>
      {user && !user.emailVerified && (
        <div className="alert alert-warning app-banner" role="status">
          <span>Verify your email to secure your account.</span>
          <button type="button" className="btn btn-sm" onClick={handleResend} disabled={resending}>
            {resending ? 'Sending…' : 'Resend email'}
          </button>
        </div>
      )}
      <main id="main" className="app-main" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
