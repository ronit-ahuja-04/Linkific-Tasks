import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Wisp } from '../characters';

/** A night sky of twinkling stars (decorative). Positions come from a fixed seed, so it never jumps between renders. */
export function StarField({ count = 40, className = '' }: { count?: number; className?: string }) {
  let seed = 7;
  const next = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const stars = Array.from({ length: count }, () => ({
    left: next() * 100,
    top: next() * 85,
    size: 1.5 + next() * 2.5,
    delay: next() * 3,
  }));
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute animate-twinkle rounded-full bg-moon"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Pages fade and rise in when the route changes. Keyed by the path only, so changing a filter or query string
 * doesn't replay it.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="animate-page">
      {children}
    </div>
  );
}

/** A thin glowing bar across the top while the next screen loads. */
export function TopProgress() {
  return (
    <div
      role="progressbar"
      aria-label="Loading the next screen"
      className="fixed inset-x-0 top-0 z-[60] h-1 overflow-hidden bg-glow/20"
    >
      <div className="h-full w-2/5 animate-progress rounded-full bg-glow shadow-[0_0_12px_var(--color-glow)]" />
    </div>
  );
}

/** Shown only if something takes longer than `ms`, so quick loads don't flash a spinner. */
export function Delayed({ ms = 250, children }: { ms?: number; children: ReactNode }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setShown(true), ms);
    return () => window.clearTimeout(timer);
  }, [ms]);
  return shown ? <>{children}</> : null;
}

/** While a lazy screen downloads: the bar at once, then Wisp if it's taking a moment. */
export function RouteLoading({ dark = false }: { dark?: boolean }) {
  return (
    <>
      <TopProgress />
      <Delayed ms={400}>
        <div
          role="status"
          className={`flex flex-col items-center justify-center gap-3 py-24 font-bold ${dark ? 'text-moon' : 'text-dusk'}`}
        >
          <div className="animate-float">
            <Wisp size={64} mood="think" decorative glow={false} />
          </div>
          Loading…
        </div>
      </Delayed>
    </>
  );
}

/**
 * The first screen while Lumo checks who you are. It matches the static shell in index.html (same night sky and
 * wordmark), so the handover from HTML to React is seamless.
 */
export function BootScreen({ label = 'Lighting the lanterns…' }: { label?: string }) {
  return (
    <div
      role="status"
      className="relative flex min-h-dvh flex-col items-center justify-center gap-5 overflow-hidden bg-night text-white"
    >
      <StarField count={30} />
      <div className="animate-float">
        <Wisp size={96} mood="happy" decorative />
      </div>
      <span className="animate-enter font-display text-5xl font-bold text-glow">lumo</span>
      <Delayed ms={300}>
        <span className="animate-enter font-bold text-moon">{label}</span>
      </Delayed>
    </div>
  );
}
