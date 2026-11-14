import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * ROUTE GUARDS. Note: these only decide what the UI SHOWS. The real protection is the server,
 * which checks the token and the role on every API call. Hiding a page is a courtesy, not security.
 */

function CheckingSession() {
  return (
    <div className="session-check" role="status" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
      <p className="muted">Checking your session…</p>
    </div>
  );
}

/** Signed-in users only. Remembers where they wanted to go in `state.from`, so login can send them back. */
export default function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <CheckingSession />;
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
export { ProtectedRoute as PrivateRoute };

/** Login/register pages: a signed-in user is bounced to where they came from (or the dashboard) */
export function PublicOnlyRoute() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <CheckingSession />;
  if (status === 'authenticated') return <Navigate to={location.state?.from?.pathname ?? '/dashboard'} replace />;
  return <Outlet />;
}

/** Authorization (what may you do) on top of authentication (who are you): e.g. role="admin" */
export function RequireRole({ role }) {
  const { user } = useAuth();
  if (user?.role !== role) {
    return (
      <div className="card" style={{ maxWidth: 480, margin: '48px auto', padding: 24, textAlign: 'center' }}>
        <h1>403</h1>
        <p>You do not have access to this page.</p>
        <Link className="btn btn-primary" to="/dashboard">Back to the dashboard</Link>
      </div>
    );
  }
  return <Outlet />;
}
