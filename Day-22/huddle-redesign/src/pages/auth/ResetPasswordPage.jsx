import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import AuthShell from '../../components/auth/AuthShell';
import PasswordField from '../../components/auth/PasswordField';
import { urlAuthError } from '../../lib/authUrl';
import { friendlyAuthError, validatePassword } from '../../lib/profiles';

export const RECOVERY_WAIT_MS = 3000;

/**
 * RESET PASSWORD. The email link opens /auth/reset?code=...; supabase-js exchanges the code for a temporary
 * "recovery" session (event PASSWORD_RECOVERY). With that session the user may call updateUser({ password }).
 * No session after a short wait (or an error in the URL) means the link is invalid or expired.
 */
export default function ResetPasswordPage() {
  const { client, updatePassword, user } = useAuth();
  const urlError = urlAuthError(window.location.search, window.location.hash);
  const [state, setState] = useState(urlError ? 'invalid' : 'checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (urlError) return undefined;
    let active = true;
    const ready = (session) => active && session && setState((s) => (s === 'checking' ? 'ready' : s));
    client.auth.getSession().then(({ data }) => ready(data?.session));
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => ready(session));
    // give supabase-js a moment to finish the code exchange before calling the link invalid
    const timer = setTimeout(() => active && setState((s) => (s === 'checking' ? 'invalid' : s)), RECOVERY_WAIT_MS);
    return () => {
      active = false;
      clearTimeout(timer);
      listener.subscription.unsubscribe();
    };
  }, [client, urlError]);

  async function onSubmit(event) {
    event.preventDefault();
    const next = { password: validatePassword(password), confirm: password !== confirm ? 'The passwords do not match.' : '' };
    setErrors(next);
    setError('');
    if (next.password || next.confirm) return;
    setBusy(true);
    const { error: authError } = await updatePassword(password);
    setBusy(false);
    if (authError) setError(friendlyAuthError(authError));
    else setState('done');
  }

  if (state === 'checking') return <AuthShell title="Reset your password"><p role="status" className="muted">Checking your link…</p></AuthShell>;
  if (state === 'invalid') {
    return (
      <AuthShell title="Reset your password" footer={<Link to="/login">Back to sign in</Link>}>
        <p className="alert alert-error" role="alert">This link is invalid or expired.</p>
        <p><Link to="/forgot-password">Request a new link</Link></p>
      </AuthShell>
    );
  }
  if (state === 'done') {
    return (
      <AuthShell title="Password updated">
        <p role="status" className="alert alert-success">Your password was changed. You are signed in.</p>
        <Link to="/" className="btn btn-primary btn-block">Go to Huddle</Link>
      </AuthShell>
    );
  }
  return (
    <AuthShell title="Choose a new password" subtitle="Pick something you have not used before.">
      <form className="form" onSubmit={onSubmit} noValidate>
        {/* Browsers and password managers expect the account name beside a new-password field */}
        <input type="text" name="username" autoComplete="username" value={user?.email ?? ''} readOnly hidden />
        <PasswordField label="New password" name="new-password" value={password} onChange={setPassword} autoComplete="new-password" error={errors.password} showStrength />
        <PasswordField label="Confirm new password" name="confirm-password" value={confirm} onChange={setConfirm} autoComplete="new-password" error={errors.confirm} />
        {error && <p className="alert alert-error" role="alert">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</button>
      </form>
    </AuthShell>
  );
}
