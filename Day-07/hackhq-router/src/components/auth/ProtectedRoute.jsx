import { Navigate, Outlet } from 'react-router-dom';

/**
 * CONCEPT: Route guard as a pathless layout route. Every child route inherits the check.
 * Allowed → render the matched child via <Outlet />. Not allowed → redirect during render.
 * `replace` stops Back from bouncing into the guarded URL and redirecting again.
 */
export default function ProtectedRoute({ isAllowed, redirectTo = '/login' }) {
  return isAllowed ? <Outlet /> : <Navigate to={redirectTo} replace />;
}
