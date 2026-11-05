import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { selectIsLoggedIn } from '../store/slices/authSlice.js';

export default function ProtectedRoute() {
  // REDUX: useSelector reads from the store and re-renders this component only when the value changes
  const loggedIn = useSelector(selectIsLoggedIn);
  const location = useLocation();
  return loggedIn ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}
