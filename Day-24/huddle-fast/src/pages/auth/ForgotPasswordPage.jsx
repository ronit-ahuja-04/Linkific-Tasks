import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import AuthShell from '../../components/auth/AuthShell';
import { friendlyAuthError, validateEmail } from '../../lib/profiles';

/**
 * FORGOT PASSWORD: resetPasswordForEmail(email, { redirectTo }) emails a recovery link that opens /auth/reset.
 * We show the SAME confirmation whether or not the address has an account, so nobody can use this form to
 * find out who is registered (the Auth server also answers the same way).
 */
export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    if (busy) return; // the button stays focusable while busy (A-4), so guard against a second submit here
    const problem = validateEmail(email);
    setError(problem);
    if (problem) return;
    setBusy(true);
    const { error: authError } = await resetPassword(email.trim());
    setBusy(false);
    // rate limits are worth telling; anything else is hidden behind the same message
    if (authError && (authError.status === 429 || /rate/i.test(authError.code ?? ''))) return setError(friendlyAuthError(authError));
    setDone(true);
  }

  return (
    <AuthShell title="Reset your password" subtitle={done ? undefined : 'Enter your email and we will send you a link.'} footer={<Link to="/login">Back to sign in</Link>}>
      {done ? (
        <p role="status" className="alert alert-success">If an account exists for <strong>{email.trim()}</strong>, a reset link is on its way. Check your inbox.</p>
      ) : (
        <form className="form" onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="forgot-email">Email</label>
            <input id="forgot-email" type="email" className="input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={error ? 'true' : undefined} aria-describedby={error ? 'forgot-email-error' : undefined} required />
            {error && <p id="forgot-email-error" className="field-error" role="alert">{error}</p>}
          </div>
          <button type="submit" className="btn btn-primary btn-block" aria-disabled={busy || undefined}>{busy ? 'Sending…' : 'Send reset link'}</button>
        </form>
      )}
    </AuthShell>
  );
}
