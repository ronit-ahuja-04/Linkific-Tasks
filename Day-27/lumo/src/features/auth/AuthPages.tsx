import { Eye, EyeOff, Flame, Sparkles, Wand2 } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { Byte, Nova, Wisp } from '../../components/characters';
import { StarField } from '../../components/motion/Motion';
import { Button, Field } from '../../components/ui';
import { homeFor } from '../../routes/home';
import { clearAuthError, signIn, signUp } from './authSlice';
import {
  passwordStrength,
  suggestHandle,
  validateSignIn,
  validateSignUp,
  type FieldErrors,
} from './validation';

const LOCAL = String(import.meta.env.VITE_SUPABASE_URL ?? '').includes('127.0.0.1');

const PROMISES = [
  { icon: Sparkles, text: 'Lessons in 90-second bites, with Wisp beside you' },
  { icon: Flame, text: 'A daily flame that forgives a missed day' },
  { icon: Wand2, text: 'Fog shows what you’re forgetting, and a quick review clears it' },
];

/**
 * Sign-in screens: the night isles on the left (on wide screens) and the form on the right. On a phone, the form
 * comes first under a small Wisp, with nothing to scroll past.
 */
export function AuthLayout({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main id="main" className="grid min-h-dvh bg-paper md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-night p-10 text-white md:flex">
        <StarField count={36} />
        <Link
          to="/"
          className="relative w-fit font-display text-4xl font-bold text-glow no-underline"
        >
          lumo
        </Link>
        <div className="relative flex flex-col items-start gap-8">
          <div className="flex items-end gap-4">
            <span className="animate-float">
              <Wisp size={150} mood="happy" decorative />
            </span>
            <span className="animate-float [animation-delay:-1.3s]">
              <Byte size={72} decorative />
            </span>
            <span className="animate-float [animation-delay:-2.6s]">
              <Nova size={72} decorative />
            </span>
          </div>
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {PROMISES.map(({ icon: Icon, text }, i) => (
              <li
                key={text}
                className="stagger flex animate-enter items-center gap-3 font-bold text-moon"
                style={{ '--i': i + 2 } as React.CSSProperties}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-night-3 text-glow">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative m-0 text-sm text-moon">Free to learn. No card, no ads.</p>
      </aside>
      <div className="flex items-start justify-center px-5 py-10 md:items-center md:px-10">
        <div className="flex w-full max-w-md animate-enter flex-col gap-6">
          <div className="flex items-center gap-3">
            <span className="md:hidden">
              <Wisp size={64} mood="happy" glow={false} decorative />
            </span>
            <div className="flex flex-col">
              <h1 className="m-0 text-3xl font-bold">{title}</h1>
              <p className="m-0 text-dusk">{intro}</p>
            </div>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}

export function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
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

export function ServerMessage({ error, notice }: { error: string | null; notice: string | null }) {
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
        className="animate-enter rounded-2xl border-2 border-ember bg-ember-soft px-4 py-3 font-bold text-ember-ink"
      >
        {error}
      </div>
    );
  }
  if (notice)
    return (
      <div
        role="status"
        className="animate-enter rounded-2xl bg-lagoon-soft px-4 py-3 font-bold text-lagoon-ink"
      >
        {notice}
      </div>
    );
  return null;
}

const METER = ['bg-ember', 'bg-ember', 'bg-glow', 'bg-lagoon', 'bg-lagoon'];

/** Four bars and a word, announced politely as it changes. */
export function StrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const { score, label, tip } = passwordStrength(password);
  return (
    <div className="-mt-2 flex flex-col gap-1.5">
      <div aria-hidden="true" className="grid grid-cols-4 gap-1.5">
        {[1, 2, 3, 4].map((bar) => (
          <span
            key={bar}
            className={`h-1.5 rounded-full transition-colors duration-300 ${bar <= Math.max(score, 1) ? METER[score] : 'bg-line'}`}
          />
        ))}
      </div>
      <p aria-live="polite" className="m-0 text-sm text-dusk">
        <b className="text-ink">Password strength: {label}.</b> {tip}
      </p>
    </div>
  );
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
        <Link
          to="/forgot-password"
          state={{ email: values.email }}
          className="-mt-2 self-end text-sm font-extrabold text-violet-ink"
        >
          Forgot your password?
        </Link>
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

type SignUpField = 'displayName' | 'handle' | 'email' | 'password';

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const { busy, error, notice } = useAppSelector((s) => s.auth);
  const [values, setValues] = useState({ displayName: '', handle: '', email: '', password: '' });
  const [errors, setErrors] = useState<FieldErrors<SignUpField>>({});
  // The handle follows the name until the person edits it themselves.
  const [handleEdited, setHandleEdited] = useState(false);
  const [shown, setShown] = useState(false);
  const target = useSignedInRedirect();
  useEffect(() => () => void dispatch(clearAuthError()), [dispatch]);
  if (target) return <Navigate to={target} replace />;

  /** Check one field when the person leaves it (only if they typed something), so errors don't nag early. */
  const checkField = (field: SignUpField) => {
    if (!values[field]) return;
    const found = validateSignUp(values);
    setErrors((prev) => ({ ...prev, [field]: found[field] }));
  };

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
          onBlur={() => checkField('displayName')}
          onChange={(e) => {
            const displayName = e.target.value;
            setValues((v) => ({
              ...v,
              displayName,
              handle: handleEdited ? v.handle : suggestHandle(displayName),
            }));
          }}
        />
        <Field
          label="Handle"
          hint={
            values.handle
              ? `Others will see you as @${values.handle}`
              : 'Shown in leagues, e.g. maya_codes'
          }
          autoComplete="username"
          value={values.handle}
          error={errors.handle}
          onBlur={() => checkField('handle')}
          onChange={(e) => {
            setHandleEdited(true);
            setValues({ ...values, handle: e.target.value.toLowerCase() });
          }}
        />
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          value={values.email}
          error={errors.email}
          onBlur={() => checkField('email')}
          onChange={(e) => setValues({ ...values, email: e.target.value })}
        />
        <Field
          label="Password"
          type={shown ? 'text' : 'password'}
          autoComplete="new-password"
          value={values.password}
          error={errors.password}
          onBlur={() => checkField('password')}
          onChange={(e) => setValues({ ...values, password: e.target.value })}
          rightSlot={<PasswordToggle shown={shown} onToggle={() => setShown(!shown)} />}
        />
        <StrengthMeter password={values.password} />
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
