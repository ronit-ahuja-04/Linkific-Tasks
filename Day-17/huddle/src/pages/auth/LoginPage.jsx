import { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import AuthShell from '../../components/auth/AuthShell';
import OAuthButtons from '../../components/auth/OAuthButtons';
import PasswordField from '../../components/auth/PasswordField';
import { friendlyAuthError, validateEmail } from '../../lib/profiles';

/**
 * LOGIN. Three ways in:
 *  1. signInWithPassword({ email, password })  -> POST /auth/v1/token?grant_type=password
 *  2. signInWithOtp({ email })                 -> emails a one-time "magic link" (no password at all)
 *  3. signInWithOAuth({ provider })            -> GitHub/Google (only when the server has them switched on)
 * On success supabase-js stores the session; AuthContext hears it through onAuthStateChange and the
 * PublicOnlyRoute guard sends the user on to the page they wanted.
 */
export default function LoginPage() {
  const { signIn, signInWithMagicLink } = useAuth();
  const location = useLocation();
  const [params] = useSearchParams();
  const urlError = params.get('error_description') || params.get('error');
  const redirected = Boolean(location.state?.from);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState('');

  async function onSubmit(event) {
    event.preventDefault();
    const problem = validateEmail(email);
    setEmailError(problem);
    setError('');
    if (problem) return;
    if (!password) return setError('Enter your password, or ask for a magic link.');
    setBusy(true);
    const { error: authError } = await signIn({ email: email.trim(), password });
    setBusy(false);
    if (authError) setError(friendlyAuthError(authError));
  }

  async function onMagicLink() {
    const problem = validateEmail(email);
    setEmailError(problem);
    setError('');
    if (problem) return;
    setBusy(true);
    const { error: authError } = await signInWithMagicLink(email.trim());
    setBusy(false);
    if (authError) setError(friendlyAuthError(authError));
    else setSentTo(email.trim());
  }

  if (sentTo) {
    return (
      <AuthShell title="Check your email" footer={<button type="button" className="btn btn-sm" onClick={() => setSentTo('')}>Use a different method</button>}>
        <p role="status" className="alert alert-success">We sent a sign-in link to <strong>{sentTo}</strong>. Open it on this device to sign in. The link works once.</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Sign in" subtitle="Welcome back to Huddle." footer={<p className="muted">New here? <Link to="/register">Create an account</Link></p>}>
      {redirected && <p className="alert alert-info" role="status">Please sign in to continue.</p>}
      {urlError && <p className="alert alert-error" role="alert">{urlError}</p>}
      <OAuthButtons onError={setError} />
      <form className="form" onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input id="login-email" name="email" type="email" className="input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={emailError ? 'true' : undefined} aria-describedby={emailError ? 'login-email-error' : undefined} required />
          {emailError && <p id="login-email-error" className="field-error" role="alert">{emailError}</p>}
        </div>
        <PasswordField value={password} onChange={setPassword} autoComplete="current-password" required={false} />
        <p className="auth-forgot"><Link to="/forgot-password">Forgot your password?</Link></p>
        {error && <p className="alert alert-error" role="alert">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <button type="button" className="btn btn-block" onClick={onMagicLink} disabled={busy}>Email me a magic link</button>
      </form>
      <details className="auth-how">
        <summary>How this works</summary>
        <ul>
          <li><code>supabase.auth.signInWithPassword({'{ email, password }'})</code> checks the password hash in <code>auth.users</code> and returns a session (a JWT valid for 1 hour plus a refresh token).</li>
          <li><code>supabase.auth.signInWithOtp({'{ email }'})</code> emails a one-time link. Locally the email lands in Mailpit (port 54324).</li>
          <li>The JWT is sent with every request; Row Level Security reads the user id from it as <code>auth.uid()</code>.</li>
        </ul>
      </details>
    </AuthShell>
  );
}
