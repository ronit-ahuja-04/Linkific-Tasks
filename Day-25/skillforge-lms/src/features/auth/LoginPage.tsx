import { useState, type FormEvent } from 'react';
import { Sparkles } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { Pip } from '../../components/pip/Pip';
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
  const { status, error } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const liveSupabase = isSupabaseConfigured();

  const redirectTo =
    (location.state as { from?: string } | null)?.from &&
    typeof (location.state as { from?: string } | null)?.from === 'string'
      ? (location.state as { from: string }).from
      : '/dashboard';

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = await dispatch(signInUser({ email, password }));
    if (signInUser.fulfilled.match(result)) {
      navigate(redirectTo, { replace: true });
    }
  }

  async function handleDemoLogin(demoEmail: string) {
    setEmail(demoEmail);
    setPassword('demo-password-123');
    const result = await dispatch(signInUser({ email: demoEmail, password: 'demo-password-123' }));
    if (signInUser.fulfilled.match(result)) {
      navigate(redirectTo, { replace: true });
    }
  }

  return (
    <section className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[1fr_1.1fr]">
      <div className="rpg-card flex flex-col items-center justify-center bg-surface-2/60 p-6 text-center">
        <Pip stage="sprout" mood="happy" tint={4} accessory={4} className="h-auto w-44" />
        <h2 className="mt-4 text-xl font-bold">Pip kept your seat warm!</h2>
        <p className="mt-2 text-sm text-muted">
          Sign in to resume your Course Realms, collect XP on first clears, and climb the Guild Hall
          leaderboard.
        </p>

        {!liveSupabase && (
          <div className="mt-6 w-full rounded-xl border border-line bg-surface p-4 text-left">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Local Demo Quick-Switch</span>
            </p>
            <p className="mt-1 text-xs text-muted">
              Supabase `.env` is not configured yet. Jump straight into any seeded role:
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map((acct) => (
                <button
                  key={acct.email}
                  type="button"
                  onClick={() => void handleDemoLogin(acct.email)}
                  className="rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs font-bold hover:border-brand"
                >
                  {acct.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rpg-card p-6 sm:p-8">
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

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm font-medium text-danger"
          >
            {error.message}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-bold">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="maya@skillforge.local"
              className="mt-1 w-full rounded-xl border-2 border-line bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-bold">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-xl border-2 border-line bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="rpg-btn-primary w-full rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-60"
          >
            {status === 'loading' ? 'Entering Realm...' : 'Enter SkillForge'}
          </button>
        </form>

        <div className="mt-5 border-t border-line pt-4">
          <button
            type="button"
            onClick={() => void dispatch(signInGithub())}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-line bg-surface px-4 py-2.5 text-sm font-bold hover:bg-surface-2"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
              <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.7.82.58A12 12 0 0 0 12 .5Z" />
            </svg>
            <span>Continue with GitHub</span>
          </button>
        </div>
      </div>
    </section>
  );
}
