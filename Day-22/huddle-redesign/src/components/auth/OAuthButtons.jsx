import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { friendlyAuthError } from '../../lib/profiles';

const LABELS = { github: 'GitHub', google: 'Google' };

/**
 * "Continue with GitHub / Google": rendered ONLY for providers the Auth server reports as enabled
 * (AuthContext asks GET /auth/v1/settings). signInWithOAuth() redirects the whole page to the provider, which
 * sends the user back to /auth/callback with a ?code= that supabase-js exchanges for a session (PKCE flow).
 */
export default function OAuthButtons({ onError }) {
  const { providers, signInWithProvider } = useAuth();
  const [busy, setBusy] = useState(null);
  const enabled = Object.keys(LABELS).filter((name) => providers?.[name]);
  if (enabled.length === 0) return null;

  async function start(name) {
    setBusy(name);
    const { error } = await signInWithProvider(name);
    if (error) {
      setBusy(null);
      onError?.(friendlyAuthError(error));
    }
  }
  return (
    <div className="auth-oauth" role="group" aria-label="Sign in with another service">
      {enabled.map((name) => (
        <button key={name} type="button" className="btn btn-block" onClick={() => start(name)} disabled={busy !== null}>
          {busy === name ? 'Redirecting…' : `Continue with ${LABELS[name]}`}
        </button>
      ))}
      <p className="auth-or muted" aria-hidden="true">or</p>
    </div>
  );
}
