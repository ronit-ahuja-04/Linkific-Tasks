import { ArrowLeft, Compass, RotateCcw } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { Gloom, Wisp } from '../../components/characters';
import { StarField } from '../../components/motion/Motion';
import { buttonClasses } from '../../components/ui';
import { homeFor } from '../../routes/home';

function NightScreen({ children }: { children: ReactNode }) {
  return (
    <main
      id="main"
      className="relative flex min-h-dvh flex-col items-center justify-center gap-5 overflow-hidden bg-night px-6 py-12 text-center text-white"
    >
      <StarField />
      {/* Fog banks drifting along the bottom. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-20 bottom-0 h-56 animate-drift bg-[radial-gradient(ellipse_at_bottom,rgb(201_195_238/0.28)_0%,transparent_65%)]"
      />
      <div className="relative flex max-w-md flex-col items-center gap-5">{children}</div>
    </main>
  );
}

/** 404: Wisp lost in the fog, with a way home that fits who you are. */
export function NotFoundPage() {
  const { profile } = useAppSelector((s) => s.auth);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const home = profile ? homeFor(profile.role) : '/';
  return (
    <NightScreen>
      <div className="flex items-end gap-2" aria-hidden="true">
        <span className="animate-enter font-display text-8xl font-bold text-glow">4</span>
        <span className="animate-pop [animation-delay:60ms]">
          <span className="block animate-float">
            <Wisp size={92} mood="think" decorative />
          </span>
        </span>
        <span className="animate-enter font-display text-8xl font-bold text-glow [animation-delay:120ms]">
          4
        </span>
      </div>
      <h1 className="m-0 animate-enter text-3xl font-bold [animation-delay:160ms]">
        This island isn’t on the map
      </h1>
      <p className="m-0 animate-enter text-moon [animation-delay:220ms]">
        Even Wisp couldn’t find <code className="break-all text-white">{pathname}</code>. The fog
        may have swallowed it, or the link has a typo.
      </p>
      <div className="flex w-full animate-enter flex-col gap-3 [animation-delay:280ms] sm:flex-row sm:justify-center">
        <Link to={home} className={buttonClasses({ variant: 'glow', size: 'lg' })}>
          <Compass aria-hidden="true" className="h-5 w-5" />
          {profile ? 'Back to my map' : 'Back to the isles'}
        </Link>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={buttonClasses({ variant: 'dark', size: 'lg' })}
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
          Go back
        </button>
      </div>
    </NightScreen>
  );
}

/** What a crash looks like: Gloom got into the gears. Nothing the learner did is lost; reload or go home. */
export function CrashScreen({ onReset }: { onReset: () => void }) {
  return (
    <NightScreen>
      <div className="animate-pop">
        <Gloom size={140} decorative />
      </div>
      <h1 className="m-0 animate-enter text-3xl font-bold">Gloom got into the gears</h1>
      <p className="m-0 animate-enter text-moon [animation-delay:80ms]">
        Something broke on this screen. Your Light, flame and progress are saved on the server, so
        nothing is lost.
      </p>
      <div className="flex w-full animate-enter flex-col gap-3 [animation-delay:160ms] sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className={buttonClasses({ variant: 'glow', size: 'lg' })}
        >
          <RotateCcw aria-hidden="true" className="h-5 w-5" />
          Reload
        </button>
        <a href="/" onClick={onReset} className={buttonClasses({ variant: 'dark', size: 'lg' })}>
          Back to the start
        </a>
      </div>
    </NightScreen>
  );
}

/**
 * Catches render errors anywhere below it and shows the crash screen instead of a blank page. It resets when the
 * route changes, so navigating away recovers without a reload.
 */
export class ErrorBoundary extends Component<
  { resetKey: string; children: ReactNode },
  { failed: boolean; key: string }
> {
  override state = { failed: false, key: this.props.resetKey };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  /** A new route clears the crash, so navigating away recovers without a reload. */
  static getDerivedStateFromProps(props: { resetKey: string }, state: { key: string }) {
    return props.resetKey === state.key ? null : { failed: false, key: props.resetKey };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Lumo crashed:', error, info.componentStack);
  }

  override render() {
    if (this.state.failed) return <CrashScreen onReset={() => this.setState({ failed: false })} />;
    return this.props.children;
  }
}
