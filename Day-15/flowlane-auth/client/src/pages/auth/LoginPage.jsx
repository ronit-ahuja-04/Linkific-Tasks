import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import AuthLayout from '../../components/auth/AuthLayout';
import FormAlert from '../../components/auth/FormAlert';
import GithubButton from '../../components/auth/GithubButton';
import PasswordField from '../../components/auth/PasswordField';
import TextField from '../../components/auth/TextField';
import useDocumentTitle from '../../components/auth/useDocumentTitle';
import { focusFirstInvalid, toFormErrors } from '../../components/auth/authErrors';
import { validateLogin } from '../../lib/validators';

const FIELDS = ['email', 'password'];

export default function LoginPage() {
  useDocumentTitle('Sign in');
  const auth = useAuth();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [oauthDismissed, setOauthDismissed] = useState(false);
  const oauthFailed = params.get('error') === 'oauth_failed' && !oauthDismissed;

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (busy) return;
    auth.clearNotice();
    setOauthDismissed(true);
    setFormError(null);
    const found = validateLogin({ email, password });
    setErrors(found);
    if (Object.keys(found).length > 0) {
      focusFirstInvalid(found, FIELDS, form);
      return;
    }
    setBusy(true);
    try {
      // On success PublicOnlyRoute notices we are authenticated and redirects away from this page.
      await auth.login({ email: email.trim(), password, remember });
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
      title="Sign in"
      subtitle="Welcome back to FlowLane."
      footer={
        <span>
          New to FlowLane? <Link to="/register">Create an account</Link>
        </span>
      }
    >
      {auth.notice ? (
        <FormAlert kind="warning" onDismiss={auth.clearNotice}>
          {auth.notice.message}
        </FormAlert>
      ) : null}
      {oauthFailed ? (
        <FormAlert onDismiss={() => setOauthDismissed(true)}>GitHub sign-in failed. Please try again.</FormAlert>
      ) : null}
      {formError ? <FormAlert>{formError}</FormAlert> : null}
      <form className="form" onSubmit={handleSubmit} noValidate>
        <TextField id="login-email" label="Email" type="email" name="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <PasswordField id="login-password" label="Password" name="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
        <div className="auth-row">
          <label className="checkbox">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Remember me
          </label>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={busy} aria-busy={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <GithubButton onClick={auth.beginGithubLogin} disabled={busy} />
    </AuthLayout>
  );
}
