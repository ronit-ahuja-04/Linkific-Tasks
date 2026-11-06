import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useToast, useToasts } from '../context/ToastContext';

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };
const EXIT_MS = 220; // matches the CSS exit animation

function ToastItem({ toast, onDismiss }) {
  const { t } = useLanguage();
  const [paused, setPaused] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const remaining = useRef(toast.duration);
  const Icon = ICONS[toast.type] ?? Info;

  // Auto-dismiss. Hovering or focusing the toast pauses the countdown, and it resumes with the
  // time that was left (the cleanup subtracts the time already used).
  useEffect(() => {
    if (paused || leaving || toast.duration === 0) return undefined;
    const startedAt = Date.now();
    const timer = setTimeout(() => setLeaving(true), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - startedAt;
    };
  }, [paused, leaving, toast.duration]);

  // Play the exit animation, then remove the toast
  useEffect(() => {
    if (!leaving) return undefined;
    const timer = setTimeout(onDismiss, EXIT_MS);
    return () => clearTimeout(timer);
  }, [leaving, onDismiss]);

  return (
    <div
      className={`snack snack--${toast.type}${leaving ? ' snack--leaving' : ''}`}
      // errors interrupt a screen reader (alert); everything else waits its turn (status)
      role={toast.type === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Icon size={18} className="snack-icon" aria-hidden="true" />
      <p className="snack-message">{toast.message}</p>
      <button type="button" className="snack-close" onClick={() => setLeaving(true)} aria-label={t('ui.toast.close')}>
        <X size={14} aria-hidden="true" />
      </button>
      {toast.duration > 0 && (
        <span
          className="snack-bar"
          aria-hidden="true"
          style={{ animationDuration: `${toast.duration}ms`, animationPlayState: paused || leaving ? 'paused' : 'running' }}
        />
      )}
    </div>
  );
}

/** Draws the stack of toasts, top centre. The only component that reads the toast list. */
export default function ToastViewport() {
  const toasts = useToasts();
  const { dismiss } = useToast();
  const { t } = useLanguage();
  return (
    <div className="snack-viewport" role="region" aria-label={t('ui.toast.region')}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
      ))}
    </div>
  );
}
