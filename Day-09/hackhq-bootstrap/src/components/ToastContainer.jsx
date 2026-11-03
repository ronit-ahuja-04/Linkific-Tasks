import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cx } from './ui.jsx';

const TONES = {
  success: { icon: CheckCircle2, color: 'text-good', bar: 'bg-good' },
  warning: { icon: AlertCircle, color: 'text-warn', bar: 'bg-warn' },
  error: { icon: AlertCircle, color: 'text-bad', bar: 'bg-bad' },
  info: { icon: Info, color: 'text-accent', bar: 'bg-accent' },
};

export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-96"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      <div className="flex flex-col gap-2.5">
        {toasts.map((toast) => {
          const tone = TONES[toast.type] ?? TONES.info;
          const Icon = tone.icon;

          return (
            <div
              key={toast.id}
              role="status"
              className="pointer-events-auto relative flex animate-toast items-center gap-3 overflow-hidden rounded-2xl border border-line bg-surface py-3 pr-3 pl-5 shadow-pop"
            >
              <span
                className={cx('absolute inset-y-0 left-0 w-1.5', tone.bar)}
                aria-hidden="true"
              />
              <Icon size={18} aria-hidden="true" className={cx('shrink-0', tone.color)} />

              <p className="min-w-0 flex-1 text-sm font-medium">{toast.message}</p>

              {toast.action && (
                <button
                  type="button"
                  className="shrink-0 rounded-lg bg-surface-2 px-2.5 py-1 text-xs font-semibold hover:bg-line"
                  onClick={() => {
                    toast.action.onClick();
                    onDismiss(toast.id);
                  }}
                >
                  {toast.action.label}
                </button>
              )}

              <button
                type="button"
                className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink"
                aria-label="Dismiss notification"
                onClick={() => onDismiss(toast.id)}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
