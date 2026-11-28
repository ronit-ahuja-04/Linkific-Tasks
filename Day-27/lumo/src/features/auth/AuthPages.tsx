import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { Wisp } from '../../components/characters';
import { Button, Field } from '../../components/ui';
import { homeFor } from '../../routes/home';
import { clearAuthError, signIn, signUp } from './authSlice';
import { validateSignIn, validateSignUp, type FieldErrors } from './validation';

const LOCAL = String(import.meta.env.VITE_SUPABASE_URL ?? '').includes('127.0.0.1');

function AuthLayout({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main
      id="main"
      className="flex min-h-dvh items-start justify-center bg-paper px-5 py-10 md:items-center"
    >
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex items-center gap-3">
          <Wisp size={64} mood="happy" glow={false} decorative />
          <div className="flex flex-col">
            <h1 className="m-0 text-3xl font-bold">{title}</h1>
            <p className="m-0 text-dusk">{intro}</p>
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}

function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? 'Hide password' : 'Show password'}
      aria-pressed={shown}
      className="flex h-10 w-10 items-center justify-center rounded-xl text-dusk hover:bg-mist"
    >
      {shown ? (
        <EyeOff aria-hidden="true" className="h-5 w-5" />
      ) : (
        <Eye aria-hidden="true" className="h-5 w-5" />
      )}
    </button>
  );
}

function ServerMessage({ error, notice }: { error: string | null; notice: string | null }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (error) ref.current?.focus();
  }, [error]);
  if (error) {
    return (
      <div
        ref={ref}
        tabIndex={-1}
        role="alert"
        className="rounded-2xl border-2 border-ember bg-ember-soft px-4 py-3 font-bold text-ember-ink"
      >
        {error}
      </div>
    );
  }
  if (notice)
    return (
      <div role="status" className="rounded-2xl bg-lagoon-soft px-4 py-3 font-bold text-lagoon-ink">
        {notice}
      </div>
    );
  return null;
}

function useSignedInRedirect() {
  const { status, profile } = useAppSelector((s) => s.auth);
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  if (status === 'signedIn' && profile)
    return from && from !== '/login' ? from : homeFor(profile.role);
  return null;
}

export function LoginPage() {
  const dispatch = useAppDispatch();
  const { busy, error, notice } = useAppSelector((s) => s.auth);
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<FieldErrors<'email' | 'password'>>({});
  const [shown, setShown] = useState(false);
  const target = useSignedInRedirect();
  useEffect(() => () => void dispatch(clearAuthError()), [dispatch]);
  if (target) return <Navigate to={target} replace />;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateSignIn(values);
    setErrors(found);
    if (Object.keys(found).length === 0) void dispatch(signIn(values));
  };

  return (
    <AuthLayout title="Welcome back" intro="Your lanterns missed you.">
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <ServerMessage error={error} notice={notice} />
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          value={values.email}
          error={errors.email}
          onChange={(e) => setValues({ ...values, email: e.target.value })}
        />
        <Field
          label="Password"
          type={shown ? 'text' : 'password'}
          autoComplete="current-password"
          value={values.password}
          error={errors.password}
          onChange={(e) => setValues({ ...values, password: e.target.value })}
          rightSlot={<PasswordToggle shown={shown} onToggle={() => setShown(!shown)} />}
        />
        <Button type="submit" size="lg" fullWidth loading={busy} loadingText="Signing in…">
          Sign in
        </Button>
      </form>
      <p className="m-0 text-center text-dusk">
        New here?{' '}
        <Link to="/register" className="font-extrabold text-violet-ink">
          Start your adventure
        </Link>
      </p>
      {LOCAL && (
        <p className="m-0 rounded-2xl bg-mist px-4 py-3 text-sm text-dusk">
          Local demo accounts (password <code>lumo-demo-123</code>): maya@lumo.local (learner),
          riya@lumo.local (instructor), admin@lumo.local (admin).
        </p>
      )}
    </AuthLayout>
  );
}

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const { busy, error, notice } = useAppSelector((s) => s.auth);
  const [values, setValues] = useState({ displayName: '', handle: '', email: '', password: '' });
  const [errors, setErrors] = useState<
    FieldErrors<'displayName' | 'handle' | 'email' | 'password'>
  >({});
  const [shown, setShown] = useState(false);
  const target = useSignedInRedirect();
  useEffect(() => () => void dispatch(clearAuthError()), [dispatch]);
  if (target) return <Navigate to={target} replace />;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateSignUp(values);
    setErrors(found);
    if (Object.keys(found).length === 0) {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      void dispatch(signUp({ ...values, timezone }));
    }
  };

  return (
    <AuthLayout title="Start your adventure" intro="Wisp will learn how you learn.">
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <ServerMessage error={error} notice={notice} />
        <Field
          label="What should Wisp call you?"
          autoComplete="name"
          value={values.displayName}
          error={errors.displayName}
          onChange={(e) => setValues({ ...values, displayName: e.target.value })}
        />
        <Field
          label="Handle"
          hint="Shown in leagues, e.g. maya_codes"
          autoComplete="username"
          value={values.handle}
          error={errors.handle}
          onChange={(e) => setValues({ ...values, handle: e.target.value.toLowerCase() })}
        />
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          value={values.email}
          error={errors.email}
          onChange={(e) => setValues({ ...values, email: e.target.value })}
        />
        <Field
          label="Password"
          hint="At least 8 characters"
          type={shown ? 'text' : 'password'}
          autoComplete="new-password"
          value={values.password}
          error={errors.password}
          onChange={(e) => setValues({ ...values, password: e.target.value })}
          rightSlot={<PasswordToggle shown={shown} onToggle={() => setShown(!shown)} />}
        />
        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={busy}
          loadingText="Creating your account…"
        >
          Create my account
        </Button>
      </form>
      <p className="m-0 text-center text-dusk">
        Already have one?{' '}
        <Link to="/login" className="font-extrabold text-violet-ink">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
