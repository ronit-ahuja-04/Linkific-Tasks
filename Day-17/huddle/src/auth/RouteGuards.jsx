import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

/** Only for signed-in users. Anonymous visitors go to /login and are sent back to the page they wanted. */
export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <p className="centered-page muted" role="status">Checking your session…</p>;
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

/** Sign-in pages make no sense when you are already in: bounce back to where you were going */
export function PublicOnlyRoute() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <p className="centered-page muted" role="status">Checking your session…</p>;
  if (status === 'authenticated') {
    const from = location.state?.from;
    return <Navigate to={from?.pathname ? `${from.pathname}${from.search ?? ''}` : '/'} replace />;
  }
  return <Outlet />;
}
