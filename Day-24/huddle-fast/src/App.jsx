import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import PageLoading from './components/ui/PageLoading';
import { ProtectedRoute, PublicOnlyRoute } from './auth/RouteGuards';
import { isSupabaseConfigured } from './lib/supabase';
import { pages } from './routes';

// Every page is a lazy chunk (src/routes.js). The signed-in pages show their fallback INSIDE the app shell
// (AppLayout wraps its <Outlet> in Suspense), so the sidebar stays while a page loads; the rest use this one.
const {
  LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage, AuthCallbackPage,
  DashboardPage, ChatPage, NotesPage, FilesPage, LabPage, ProfilePage, StyleguidePage,
} = pages;

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
    <Suspense fallback={<PageLoading fullPage />}>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>
        {/* public: the page a magic link, a confirmation email, an OAuth sign-in or a password-reset email returns to */}
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/auth/reset" element={<ResetPasswordPage />} />
        <Route path="/styleguide" element={<StyleguidePage />} />
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
    </Suspense>
  );
}
