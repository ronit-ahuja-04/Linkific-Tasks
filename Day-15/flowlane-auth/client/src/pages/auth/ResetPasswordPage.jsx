import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../../api/authApi';
import AuthLayout from '../../components/auth/AuthLayout';
import FormAlert from '../../components/auth/FormAlert';
import PasswordField from '../../components/auth/PasswordField';
import PasswordStrength from '../../components/auth/PasswordStrength';
import useDocumentTitle from '../../components/auth/useDocumentTitle';
import { focusFirstInvalid, toFormErrors } from '../../components/auth/authErrors';
import { validateReset } from '../../lib/validators';

const FIELDS = ['password', 'confirmPassword'];

export default function ResetPasswordPage() {
  useDocumentTitle('Reset password');
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (busy) return;
    setFormError(null);
    const found = validateReset({ password, confirmPassword });
    setErrors(found);
    if (Object.keys(found).length > 0) {
      focusFirstInvalid(found, FIELDS, form);
      return;
    }
    setBusy(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (error) {
      // A bad, used or expired token comes back as fields.token: it is not an input here, so it lands in the alert.
      const mapped = toFormErrors(error, FIELDS);
      setErrors(mapped.fields);
      setFormError(mapped.formError);
      focusFirstInvalid(mapped.fields, FIELDS, form);
    } finally {
      setBusy(false);
    }
  }

  const requestNew = <Link to="/forgot-password">Request a new reset link</Link>;

  if (!token) {
    return (
      <AuthLayout title="Reset your password" footer={<Link to="/login">Back to sign in</Link>}>
        <FormAlert>This reset link is missing its token. Open the link from your email again, or request a new one.</FormAlert>
        <p>{requestNew}</p>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout title="Password updated">
        <FormAlert kind="success" role="status">
          Your password was changed. For your safety we signed you out of every device, so sign in again with the new password.
        </FormAlert>
        <Link className="btn btn-primary btn-block" to="/login">
          Sign in
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="Pick a strong password you do not use anywhere else." footer={<Link to="/login">Back to sign in</Link>}>
      {formError ? (
        <FormAlert>
          {formError} {requestNew}
        </FormAlert>
      ) : null}
      <form className="form" onSubmit={handleSubmit} noValidate>
        {/* Browsers and password managers expect an account name next to a password field. The link does not tell us
            the email, so this empty hidden field only satisfies that expectation (and stops a console hint). */}
        <input type="text" name="username" autoComplete="username" defaultValue="" hidden readOnly />
        <PasswordField id="reset-password" label="New password" name="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} describedBy="reset-strength" />
        <PasswordStrength id="reset-strength" password={password} />
        <PasswordField id="reset-confirm" label="Confirm new password" name="confirmPassword" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={errors.confirmPassword} />
        <button type="submit" className="btn btn-primary btn-block" disabled={busy} aria-busy={busy}>
          {busy ? 'Saving…' : 'Reset password'}
        </button>
      </form>
    </AuthLayout>
  );
}
