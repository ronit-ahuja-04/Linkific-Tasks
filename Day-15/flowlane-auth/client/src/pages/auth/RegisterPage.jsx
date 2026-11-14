import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import AuthLayout from '../../components/auth/AuthLayout';
import FormAlert from '../../components/auth/FormAlert';
import GithubButton from '../../components/auth/GithubButton';
import PasswordField from '../../components/auth/PasswordField';
import PasswordStrength from '../../components/auth/PasswordStrength';
import TextField from '../../components/auth/TextField';
import useDocumentTitle from '../../components/auth/useDocumentTitle';
import { focusFirstInvalid, toFormErrors } from '../../components/auth/authErrors';
import { validateRegister } from '../../lib/validators';

const FIELDS = ['name', 'email', 'password', 'confirmPassword'];

export default function RegisterPage() {
  useDocumentTitle('Create account');
  const auth = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (busy) return;
    setFormError(null);
    const found = validateRegister({ name, email, password, confirmPassword });
    setErrors(found);
    if (Object.keys(found).length > 0) {
      focusFirstInvalid(found, FIELDS, form);
      return;
    }
    setBusy(true);
    try {
      // Registering also signs you in (the server sets the refresh cookie); PublicOnlyRoute then redirects.
      await auth.register({ name: name.trim(), email: email.trim(), password });
    } catch (error) {
      const mapped = toFormErrors(error, FIELDS);
      setErrors(mapped.fields);
      setFormError(mapped.formError);
      focusFirstInvalid(mapped.fields, FIELDS, form);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start organising your projects with FlowLane."
      footer={
        <span>
          Already have an account? <Link to="/login">Sign in</Link>
        </span>
      }
    >
      {formError ? <FormAlert>{formError}</FormAlert> : null}
      <form className="form" onSubmit={handleSubmit} noValidate>
        <TextField id="register-name" label="Name" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
        <TextField id="register-email" label="Email" type="email" name="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <PasswordField id="register-password" label="Password" name="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} describedBy="register-strength" />
        <PasswordStrength id="register-strength" password={password} email={email} name={name} />
        <PasswordField id="register-confirm" label="Confirm password" name="confirmPassword" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={errors.confirmPassword} />
        <button type="submit" className="btn btn-primary btn-block" disabled={busy} aria-busy={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <GithubButton onClick={auth.beginGithubLogin} disabled={busy} />
    </AuthLayout>
  );
}
