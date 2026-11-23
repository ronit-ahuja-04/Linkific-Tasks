import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import UnderTheHood from '../../components/ui/UnderTheHood';
import AuthShell from '../../components/auth/AuthShell';
import OAuthButtons from '../../components/auth/OAuthButtons';
import PasswordField from '../../components/auth/PasswordField';
import { friendlyAuthError, validateEmail, validatePassword, validateUsername } from '../../lib/profiles';

/**
 * REGISTER. supabase.auth.signUp({ email, password, options: { data } }) creates the row in auth.users; the
 * `data` object becomes raw_user_meta_data, which the handle_new_user trigger reads to create the profile row.
 * Locally email confirmation is OFF, so the response already holds a session and the guard moves us on. When
 * confirmation is ON, `data.session` is null and the user must click the link we emailed.
 */
export default function RegisterPage() {
  const { signUp } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', username: '', fullName: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  async function onSubmit(event) {
    event.preventDefault();
    if (busy) return; // the button stays focusable while busy (A-4), so guard against a second submit here
    const next = {
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      username: validateUsername(form.username),
    };
    setErrors(next);
    setError('');
    if (Object.values(next).some(Boolean)) return;
    setBusy(true);
    const { data, error: authError } = await signUp({ email: form.email.trim(), password: form.password, username: form.username.trim().toLowerCase(), fullName: form.fullName.trim() });
    setBusy(false);
    if (authError) return setError(friendlyAuthError(authError));
    // no session = the project requires email confirmation first
    if (!data?.session) setConfirmEmail(form.email.trim());
  }

  if (confirmEmail) {
    return (
      <AuthShell title="Check your email" footer={<Link to="/login">Back to sign in</Link>}>
        <p role="status" className="alert alert-success">We sent a confirmation link to <strong>{confirmEmail}</strong>. Open it to finish creating your account.</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account" subtitle="Join your team on Huddle." footer={<p className="muted">Already have an account? <Link to="/login">Sign in</Link></p>}>
      <OAuthButtons onError={setError} />
      <form className="form" onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="reg-email">Email</label>
          <input id="reg-email" name="email" type="email" className="input" autoComplete="email" value={form.email} onChange={(e) => set('email')(e.target.value)} aria-invalid={errors.email ? 'true' : undefined} aria-describedby={errors.email ? 'reg-email-error' : undefined} required />
          {errors.email && <p id="reg-email-error" className="field-error" role="alert">{errors.email}</p>}
        </div>
        <PasswordField value={form.password} onChange={set('password')} autoComplete="new-password" error={errors.password} showStrength />
        <div className="field">
          <label htmlFor="reg-username">Username <span className="muted">(optional)</span></label>
          <input id="reg-username" name="username" className="input" autoComplete="username" autoCapitalize="none" value={form.username} onChange={(e) => set('username')(e.target.value)} aria-invalid={errors.username ? 'true' : undefined} aria-describedby="reg-username-hint" />
          <p id="reg-username-hint" className={errors.username ? 'field-error' : 'field-hint'} role={errors.username ? 'alert' : undefined}>{errors.username || '3 to 24 characters: a-z, 0-9 and _. Left empty, we use the part of your email before the @.'}</p>
        </div>
        <div className="field">
          <label htmlFor="reg-name">Full name <span className="muted">(optional)</span></label>
          <input id="reg-name" name="fullName" className="input" autoComplete="name" maxLength={80} value={form.fullName} onChange={(e) => set('fullName')(e.target.value)} />
        </div>
        {error && <p className="alert alert-error" role="alert">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block" aria-disabled={busy || undefined}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
      <UnderTheHood>
        <ul>
          <li><code>supabase.auth.signUp({'{ email, password, options: { data: { username } } }'})</code> inserts a row in <code>auth.users</code>.</li>
          <li>A database trigger (<code>handle_new_user</code>) then creates your <code>profiles</code> row with the same id.</li>
          <li>Passwords are stored as bcrypt hashes by Supabase Auth; the app never sees them again.</li>
        </ul>
      </UnderTheHood>
    </AuthShell>
  );
}
