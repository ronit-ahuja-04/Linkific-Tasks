import { Link, Navigate } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { Wisp } from '../../components/characters';
import { buttonClasses } from '../../components/ui';
import { homeFor } from '../../routes/home';

/** First open: the dark archipelago, Wisp the only light. No sign-up wall before the pitch. */
export function WelcomePage() {
  const { status, profile } = useAppSelector((s) => s.auth);
  if (status === 'signedIn' && profile) return <Navigate to={homeFor(profile.role)} replace />;
  return (
    <main
      id="main"
      className="relative flex min-h-dvh flex-col items-center justify-center gap-6 overflow-hidden bg-night px-6 py-12 text-center text-white"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[radial-gradient(ellipse_at_bottom,#2e2766_0%,transparent_70%)]"
      />
      <Wisp size={200} mood="happy" />
      <p className="m-0 max-w-sm rounded-[var(--radius-card)] bg-white px-5 py-3 font-bold text-ink shadow-[0_4px_0_var(--color-night-line)]">
        Psst. The isles went dark, and I'm the last light left. Want to bring them back with me?
      </p>
      <h1 className="m-0 text-6xl font-bold tracking-tight text-glow">lumo</h1>
      <p className="m-0 font-display text-2xl font-semibold">Learn a little. Light up a lot.</p>
      <div className="flex w-full max-w-sm flex-col gap-3">
        <Link
          to="/register"
          className={buttonClasses({ variant: 'glow', size: 'lg', fullWidth: true })}
        >
          Start my adventure
        </Link>
        <Link
          to="/login"
          className={buttonClasses({ variant: 'dark', size: 'md', fullWidth: true })}
        >
          I already have an account
        </Link>
      </div>
    </main>
  );
}
