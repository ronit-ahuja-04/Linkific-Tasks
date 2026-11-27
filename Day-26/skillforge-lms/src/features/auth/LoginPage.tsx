import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { Pip } from '../../components/pip/Pip';
import { Badge, Button, Card, ErrorState, Input, buttonClasses } from '../../components/ui';
import { isSupabaseConfigured } from '../../lib/supabase';
import { clearAuthError, signInGithub, signInUser } from './authSlice';

const DEMO_ACCOUNTS = [
  { label: 'Student (@maya)', email: 'maya@skillforge.local' },
  { label: 'Instructor (@dev)', email: 'dev@skillforge.local' },
  { label: 'Admin (@alex)', email: 'admin@skillforge.local' },
] as const;

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error, profile } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<{ email?: string; password?: string }>({});
  const liveSupabase = isSupabaseConfigured();

  const redirectTo =
    (location.state as { from?: string } | null)?.from &&
    typeof (location.state as { from?: string } | null)?.from === 'string'
      ? (location.state as { from: string }).from
      : '/dashboard';

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: { email?: string; password?: string } = {};
    if (!email.trim() || !email.includes('@')) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (password.length < 4) {
      nextErrors.password = 'Password must be at least 4 characters.';
    }
    if (nextErrors.email || nextErrors.password) {
      setValidationError(nextErrors);
      return;
    }

    setValidationError({});
    const result = await dispatch(signInUser({ email, password, rememberMe }));
    if (signInUser.fulfilled.match(result)) {
      navigate(redirectTo, { replace: true });
    }
  }

  async function handleDemoLogin(demoEmail: string) {
    setValidationError({});
    setEmail(demoEmail);
    setPassword('demo-password-123');
    const result = await dispatch(
      signInUser({ email: demoEmail, password: 'demo-password-123', rememberMe }),
    );
    if (signInUser.fulfilled.match(result)) {
      navigate(redirectTo, { replace: true });
    }
  }

  return (
    <section className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[1fr_1.1fr]">
      <Card
        variant="muted"
        padding="md"
        className="flex flex-col items-center justify-center text-center"
      >
        <Pip stage="sprout" mood="happy" tint={4} accessory={4} className="h-auto w-44" />
        <h2 className="mt-4 text-xl font-bold">Pip kept your seat warm!</h2>
        <p className="mt-2 text-sm text-muted">
          Sign in to resume your Course Realms, collect XP on first clears, and climb the Guild Hall
          leaderboard.
        </p>

        {!liveSupabase && (
          <div className="mt-6 w-full rounded-xl border border-line bg-surface p-4 text-left">
            <Badge
              tone="brand"
              size="sm"
              icon={<Sparkles className="h-3.5 w-3.5" />}
              className="uppercase tracking-wider"
            >
              Local Demo Quick-Switch
            </Badge>
            <p className="mt-2 text-xs text-muted">
              Supabase `.env` is not configured yet. Jump straight into any seeded role:
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map((acct) => (
                <Button
                  key={acct.email}
                  size="sm"
                  variant="secondary"
                  onClick={() => void handleDemoLogin(acct.email)}
                >
                  {acct.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card padding="lg">
        <h1 className="text-2xl font-bold">Sign In to SkillForge</h1>
        <p className="mt-1 text-sm text-muted">
          New hero?{' '}
          <Link
            to="/register"
            onClick={() => dispatch(clearAuthError())}
            className="font-bold text-brand underline"
          >
            Create your character
          </Link>
        </p>

        {profile && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand/30 bg-brand/10 p-3 text-xs font-semibold">
            <span>
              Signed in as <strong>@{profile.handle}</strong> ({profile.role})
            </span>
            <Link to="/dashboard" className={buttonClasses({ variant: 'primary', size: 'sm' })}>
              Go to Dashboard
            </Link>
          </div>
        )}

        {error && <ErrorState code={error.code} message={error.message} className="mt-4" />}

        <form noValidate onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4">
          <Input
            id="login-email"
            type="email"
            label="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={validationError.email}
            placeholder="maya@skillforge.local"
          />

          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            label="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={validationError.password}
            placeholder="••••••••"
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="rounded-lg p-1 text-muted hover:text-ink"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            }
          />

          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-muted">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-line accent-brand"
            />
            <span>Keep me signed in across browser restarts</span>
          </label>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={status === 'loading'}
            loadingText="Entering Realm..."
          >
            Enter SkillForge
          </Button>
        </form>

        <div className="mt-5 border-t border-line pt-4">
          <Button
            variant="outline"
            fullWidth
            onClick={() => void dispatch(signInGithub())}
            leftIcon={
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.7.82.58A12 12 0 0 0 12 .5Z" />
              </svg>
            }
          >
            Continue with GitHub
          </Button>
        </div>
      </Card>
    </section>
  );
}
