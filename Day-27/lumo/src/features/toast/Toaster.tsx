import { CheckCircle2, Info, TriangleAlert, WifiOff, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { toastDismissed, type Toast } from './toastSlice';
import { useToast } from './useToast';

const TONE = {
  success: { icon: CheckCircle2, className: 'bg-lagoon text-white', bar: 'bg-white/45', ms: 4000 },
  info: { icon: Info, className: 'bg-night text-white', bar: 'bg-glow', ms: 4000 },
  // Errors stay longer: people need time to read what went wrong.
  error: { icon: TriangleAlert, className: 'bg-ember text-white', bar: 'bg-white/45', ms: 8000 },
} as const;

const EXIT_MS = 220;

/**
 * One notification: slides in, counts down (the bar along the bottom), and pauses while the pointer or keyboard
 * focus is on it, so nobody loses a message mid-read. Then it slides out.
 */
function ToastItem({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch();
  const tone = TONE[toast.tone];
  const [paused, setPaused] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const remaining = useRef<number>(tone.ms);

  useEffect(() => {
    if (paused || leaving) return;
    const started = Date.now();
    const timer = window.setTimeout(() => setLeaving(true), remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (Date.now() - started));
    };
  }, [paused, leaving]);

  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => dispatch(toastDismissed(toast.id)), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [leaving, dispatch, toast.id]);

  const Icon = tone.icon;
  return (
    <li
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl font-bold shadow-lg ${tone.className} ${leaving ? 'animate-toast-out' : 'animate-toast-in'}`}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
        <span className="flex-1">{toast.message}</span>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => setLeaving(true)}
          className="-m-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-white/15"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 bottom-0 h-1 origin-left ${tone.bar}`}
        style={{
          animation: `toast-timer ${tone.ms}ms linear forwards`,
          animationPlayState: paused || leaving ? 'paused' : 'running',
        }}
      />
    </li>
  );
}

/** One live region for the whole app. Errors are announced assertively, everything else politely. */
export function Toaster() {
  const toasts = useAppSelector((s) => s.toast);
  const errors = toasts.filter((t) => t.tone === 'error');
  const others = toasts.filter((t) => t.tone !== 'error');
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="flex w-full max-w-md flex-col gap-2">
        <div role="alert" aria-live="assertive">
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {errors.map((t) => (
              <ToastItem key={t.id} toast={t} />
            ))}
          </ul>
        </div>
        <div role="status" aria-live="polite">
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {others.map((t) => (
              <ToastItem key={t.id} toast={t} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Lumo needs the server for every answer, so going offline is worth saying plainly: a banner while it lasts, and a
 * short note when the connection comes back.
 */
export function ConnectionBanner() {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const toast = useToast();
  useEffect(() => {
    const up = () => {
      setOnline(true);
      toast.success('Back online. Carry on!');
    };
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, [toast]);
  if (online) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-20 z-50 flex animate-enter justify-center px-4 md:bottom-6"
    >
      <p className="m-0 flex items-center gap-3 rounded-2xl bg-night px-4 py-3 font-bold text-white shadow-lg">
        <WifiOff aria-hidden="true" className="h-5 w-5 shrink-0 text-glow" />
        You’re offline. Answers can’t be checked until you’re back.
      </p>
    </div>
  );
}
