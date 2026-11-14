import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import AuthLayout from '../../components/auth/AuthLayout';
import useDocumentTitle from '../../components/auth/useDocumentTitle';

// The server finished the GitHub dance and redirected here with the refresh cookie already set.
// No token is in the URL: we ask the server for an access token with that cookie (completeOAuth).
export default function OAuthCallbackPage() {
  useDocumentTitle('Signing in');
  const auth = useAuth();
  const navigate = useNavigate();
  const started = useRef(null);
  const authRef = useRef(auth);
  useEffect(() => {
    authRef.current = auth;
  });

  useEffect(() => {
    // Refresh cookies rotate: calling twice would make the second call fail and look like theft.
    // StrictMode double-runs effects, so the single promise is kept in a ref and shared.
    if (!started.current) started.current = authRef.current.completeOAuth();
    let cancelled = false;
    started.current.then(
      () => !cancelled && navigate('/dashboard', { replace: true }),
      () => !cancelled && navigate('/login?error=oauth_failed', { replace: true })
    );
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <AuthLayout title="GitHub sign-in">
      <p className="auth-status" role="status">
        <span className="auth-spinner" aria-hidden="true" />
        Finishing sign-in…
      </p>
    </AuthLayout>
  );
}
