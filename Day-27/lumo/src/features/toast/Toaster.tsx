import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { toastDismissed, type Toast } from './toastSlice';

const TONE = {
  success: { icon: CheckCircle2, className: 'bg-lagoon text-white', ms: 4000 },
  info: { icon: Info, className: 'bg-night text-white', ms: 4000 },
  // Errors stay longer: people need time to read what went wrong.
  error: { icon: TriangleAlert, className: 'bg-ember text-white', ms: 8000 },
} as const;

function ToastItem({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch();
  const tone = TONE[toast.tone];
  useEffect(() => {
    const timer = window.setTimeout(() => dispatch(toastDismissed(toast.id)), tone.ms);
    return () => window.clearTimeout(timer);
  }, [dispatch, toast.id, tone.ms]);
  const Icon = tone.icon;
  return (
    <li
      className={`pointer-events-auto flex items-start gap-3 rounded-2xl px-4 py-3 font-bold shadow-lg ${tone.className}`}
    >
      <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => dispatch(toastDismissed(toast.id))}
        className="-m-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-white/15"
      >
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
    </li>
  );
}

/** One live region for the whole app. Errors are announced assertively, everything else politely. */
export function Toaster() {
  const toasts = useAppSelector((s) => s.toast);
  const errors = toasts.filter((t) => t.tone === 'error');
  const others = toasts.filter((t) => t.tone !== 'error');
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 md:bottom-6">
      <div className="flex w-full max-w-md flex-col gap-2">
        <ul role="alert" aria-live="assertive" className="m-0 flex list-none flex-col gap-2 p-0">
          {errors.map((t) => (
            <ToastItem key={t.id} toast={t} />
          ))}
        </ul>
        <ul role="status" aria-live="polite" className="m-0 flex list-none flex-col gap-2 p-0">
          {others.map((t) => (
            <ToastItem key={t.id} toast={t} />
          ))}
        </ul>
      </div>
    </div>
  );
}
