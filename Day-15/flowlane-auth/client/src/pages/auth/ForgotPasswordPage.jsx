import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../api/authApi';
import AuthLayout from '../../components/auth/AuthLayout';
import FormAlert from '../../components/auth/FormAlert';
import TextField from '../../components/auth/TextField';
import useDocumentTitle from '../../components/auth/useDocumentTitle';
import { focusFirstInvalid, toFormErrors } from '../../components/auth/authErrors';
import { validateForgot } from '../../lib/validators';

export default function ForgotPasswordPage() {
  useDocumentTitle('Forgot password');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (busy) return;
    setFormError(null);
    const found = validateForgot({ email });
    setErrors(found);
    if (found.email) {
      focusFirstInvalid(found, ['email'], form);
      return;
    }
    setBusy(true);
    try {
      await forgotPassword(email.trim());
      // The same message whether or not the account exists: otherwise this form would let anyone
      // test which emails are registered (account enumeration).
      setSent(true);
    } catch (error) {
      setFormError(toFormErrors(error, ['email']).formError ?? 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const backLink = <Link to="/login">Back to sign in</Link>;
  return (
    <AuthLayout title="Forgot your password?" subtitle={sent ? null : 'Enter your email and we will send you a link to reset it.'} footer={sent ? null : backLink}>
      {sent ? (
        <>
          <FormAlert kind="success" role="status">
            If an account exists for that email, we sent a reset link.
          </FormAlert>
          <p className="muted">The link works for 30 minutes and can be used once.</p>
          <p>{backLink}</p>
        </>
      ) : (
        <>
          {formError ? <FormAlert>{formError}</FormAlert> : null}
          <form className="form" onSubmit={handleSubmit} noValidate>
            <TextField id="forgot-email" label="Email" type="email" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
            <button type="submit" className="btn btn-primary btn-block" disabled={busy} aria-busy={busy}>
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
