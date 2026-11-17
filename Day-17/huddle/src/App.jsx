import { Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from './auth/RouteGuards';
import { isSupabaseConfigured } from './lib/supabase';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import AuthCallbackPage from './pages/auth/AuthCallbackPage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import NotesPage from './pages/NotesPage';
import FilesPage from './pages/FilesPage';
import LabPage from './pages/LabPage';
import ProfilePage from './pages/ProfilePage';

function NotFound() {
  return <main className="centered-page"><div className="card"><h1>Page not found</h1><p className="muted">There is nothing at this address.</p><a href="/">Back to Huddle</a></div></main>;
}

export default function App() {
  if (!isSupabaseConfigured) {
    return (
      <main className="centered-page">
        <div className="card" style={{ maxWidth: 520 }}>
          <h1>Supabase is not configured</h1>
          <p className="muted" style={{ marginTop: 8 }}>
            Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env</code>. For the local stack run <code>npm run db:start</code> then <code>npm run env:local</code>; see the README.
          </p>
        </div>
      </main>
    );
  }
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>
      {/* public: the page a magic link, a confirmation email, an OAuth sign-in or a password-reset email returns to */}
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/auth/reset" element={<ResetPasswordPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/chat/:roomId?" element={<ChatPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="/lab" element={<LabPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
