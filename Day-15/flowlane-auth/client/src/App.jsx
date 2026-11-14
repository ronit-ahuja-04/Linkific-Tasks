import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute, { PublicOnlyRoute, RequireRole } from './auth/ProtectedRoute';
import AppLayout from './components/app/AppLayout';
import NotFoundPage from './pages/NotFoundPage';
import AdminPage from './pages/app/AdminPage';
import DashboardPage from './pages/app/DashboardPage';
import SecurityPage from './pages/app/SecurityPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import LoginPage from './pages/auth/LoginPage';
import OAuthCallbackPage from './pages/auth/OAuthCallbackPage';
import RegisterPage from './pages/auth/RegisterPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Reachable signed in or out: an emailed link or the OAuth return trip */}
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route element={<RequireRole role="admin" />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
