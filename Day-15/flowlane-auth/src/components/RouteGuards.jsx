import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { returnPath } from '../lib/session';

/**
 * PROTECTED ROUTE: only for signed-in users. Anonymous visitors go to /auth, and we pass the page
 * they wanted in the router `state` (not the URL) so the Auth page can send them back afterwards.
 * (The 'loading' splash is shown by App before any route renders.)
 */
export function ProtectedRoute({ children }) {
  const { user, signedOutByUser } = useAuth();
  const location = useLocation();
  // After the user's own sign-out there is nothing to return to: the next person to sign in starts at the dashboard
  if (!user) return <Navigate to="/auth" replace state={signedOutByUser ? null : { from: location }} />;
  return children;
}

/** PUBLIC-ONLY ROUTE: sign-in pages make no sense when already signed in, so bounce back */
export function PublicOnlyRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (user) return <Navigate to={returnPath(location.state)} replace />;
  return children;
}
