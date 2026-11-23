import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../context/ToastContext';
import { friendlyAuthError, validatePassword } from '../../lib/profiles';
import PasswordField from './PasswordField';

/** supabase.auth.updateUser({ password }) changes the password of the signed-in user */
export default function ChangePasswordForm() {
  const { updatePassword, user } = useAuth();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    if (busy) return; // the button stays focusable while busy (A-4), so guard against a second submit here
    setError('');
    const next = { password: validatePassword(password), confirm: password !== confirm ? 'The passwords do not match.' : '' };
    setErrors(next);
    if (next.password || next.confirm) return;
    setBusy(true);
    const { error: authError } = await updatePassword(password);
    setBusy(false);
    if (authError) return setError(friendlyAuthError(authError));
    setPassword('');
    setConfirm('');
    toast.success('Password changed');
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate aria-labelledby="profile-password-title">
        {/* Browsers and password managers expect the account name beside a new-password field */}
        <input type="text" name="username" autoComplete="username" value={user?.email ?? ''} readOnly hidden />
      <h2 id="profile-password-title" className="profile-h2">Change password</h2>
      <PasswordField label="New password" name="new-password" value={password} onChange={setPassword} autoComplete="new-password" error={errors.password} showStrength />
      <PasswordField label="Confirm new password" name="confirm-password" value={confirm} onChange={setConfirm} autoComplete="new-password" error={errors.confirm} />
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <div><button type="submit" className="btn" aria-disabled={busy || undefined}>{busy ? 'Saving…' : 'Change password'}</button></div>
    </form>
  );
}
