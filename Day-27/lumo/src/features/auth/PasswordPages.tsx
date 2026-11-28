import { MailCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { BootScreen } from '../../components/motion/Motion';
import { Button, Field, buttonClasses } from '../../components/ui';
import { requestPasswordReset, updatePassword } from '../../lib/api/auth';
import { toAppError } from '../../lib/errors';
import { homeFor } from '../../routes/home';
import { useToast } from '../toast/useToast';
import { AuthLayout, PasswordToggle, ServerMessage, StrengthMeter } from './AuthPages';
import { passwordStrength } from './validation';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Step 1: ask for a reset link. The answer is the same whether or not the email has an account. */
export function ForgotPasswordPage() {
  const location = useLocation();
  const [email, setEmail] = useState((location.state as { email?: string } | null)?.email ?? '');
  const [fieldError, setFieldError] = useState<string>();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!EMAIL.test(email.trim())) {
      setFieldError('Enter an email like name@example.com.');
      return;
    }
    setFieldError(undefined);
    setError(null);
    setBusy(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (e) {
      setError(toAppError(e).message);
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout title="Check your inbox" intro="Wisp sent a lantern your way.">
        <div role="status" className="flex animate-pop flex-col items-center gap-4 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-lagoon-soft text-lagoon">
            <MailCheck aria-hidden="true" className="h-10 w-10" />
          </span>
          <p className="m-0">
            If <b>{email.trim()}</b> has a Lumo account, a link to choose a new password is on its
            way. It works once and expires in an hour.
          </p>
        </div>
        <p className="m-0 text-center text-dusk">
          Remembered it?{' '}
          <Link to="/login" className="font-extrabold text-violet-ink">
            Sign in
          </Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot your password?" intro="It happens to the best explorers.">
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <ServerMessage error={error} notice={null} />
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          error={fieldError}
          hint="We’ll email you a link to choose a new one."
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" size="lg" fullWidth loading={busy} loadingText="Sending…">
          Send me a reset link
        </Button>
      </form>
      <p className="m-0 text-center text-dusk">
        <Link to="/login" className="font-extrabold text-violet-ink">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

/**
 * Step 2: the emailed link signs the person in for this one purpose (Supabase reads it from the URL), then they
 * choose a new password here.
 */
export function ResetPasswordPage() {
  const { status, profile } = useAppSelector((s) => s.auth);
  const navigate = useNavigate();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [shown, setShown] = useState(false);
  const [fieldError, setFieldError] = useState<string>();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === 'checking') return <BootScreen label="Opening your reset link…" />;
  if (status !== 'signedIn' || !profile) {
    return (
      <AuthLayout title="This link has expired" intro="Reset links work once, for an hour.">
        <p className="m-0">Ask for a fresh one and it’ll be in your inbox in a moment.</p>
        <Link
          to="/forgot-password"
          className={buttonClasses({ variant: 'glow', size: 'lg', fullWidth: true })}
        >
          Send a new link
        </Link>
      </AuthLayout>
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (passwordStrength(password).score === 0) {
      setFieldError('Use at least 8 characters.');
      return;
    }
    setFieldError(undefined);
    setError(null);
    setBusy(true);
    try {
      await updatePassword(password);
      toast.success('Password changed. Welcome back!');
      navigate(homeFor(profile.role), { replace: true });
    } catch (e) {
      setError(toAppError(e).message);
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Choose a new password" intro={`For ${profile.display_name}.`}>
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <ServerMessage error={error} notice={null} />
        <Field
          label="New password"
          type={shown ? 'text' : 'password'}
          autoComplete="new-password"
          value={password}
          error={fieldError}
          onChange={(e) => setPassword(e.target.value)}
          rightSlot={<PasswordToggle shown={shown} onToggle={() => setShown(!shown)} />}
        />
        <StrengthMeter password={password} />
        <Button type="submit" size="lg" fullWidth loading={busy} loadingText="Saving…">
          Save my new password
        </Button>
      </form>
    </AuthLayout>
  );
}
