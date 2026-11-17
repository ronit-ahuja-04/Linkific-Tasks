import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import AuthShell from '../../components/auth/AuthShell';
import { urlAuthError } from '../../lib/authUrl';

export const CALLBACK_TIMEOUT_MS = 8000;

/**
 * AUTH CALLBACK: magic links, confirmation emails and OAuth all return here with ?code=... (PKCE flow).
 * supabase-js notices the code in the URL by itself when the client starts, swaps it for a session and fires
 * onAuthStateChange(SIGNED_IN). We only WAIT for that: getSession() resolves once that exchange is done, and
 * the listener catches a session that arrives later. Cleanup removes the listener and timer (StrictMode runs
 * effects twice in development).
 */
export default function AuthCallbackPage() {
  const { client } = useAuth();
  const urlError = urlAuthError(window.location.search, window.location.hash);
  const [state, setState] = useState(urlError ? 'error' : 'waiting');

  useEffect(() => {
    if (urlError) return undefined;
    let active = true;
    const ok = (session) => active && session && setState('done');
    client.auth.getSession().then(({ data }) => ok(data?.session));
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => ok(session));
    const timer = setTimeout(() => active && setState((s) => (s === 'waiting' ? 'timeout' : s)), CALLBACK_TIMEOUT_MS);
    return () => {
      active = false;
      clearTimeout(timer);
      listener.subscription.unsubscribe();
    };
  }, [client, urlError]);

  if (state === 'done') return <Navigate to="/" replace />;
  if (state === 'error') {
    return (
      <AuthShell title="Sign-in failed" footer={<Link to="/login">Back to sign in</Link>}>
        <p className="alert alert-error" role="alert">{urlError}</p>
      </AuthShell>
    );
  }
  if (state === 'timeout') {
    return (
      <AuthShell title="Still waiting…" footer={<Link to="/login">Back to sign in</Link>}>
        <p className="alert alert-warning" role="alert">We could not complete the sign-in. The link may have expired or already been used. Please request a new one.</p>
      </AuthShell>
    );
  }
  return (
    <AuthShell title="Signing you in…">
      <p role="status" className="muted">One moment, we are confirming your link.</p>
    </AuthShell>
  );
}
