import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useToast, useToasts } from '../context/ToastContext';

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };
const EXIT_MS = 220; // matches the CSS exit animation

function ToastItem({ toast, onDismiss }) {
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
      <button type="button" className="snack-close" onClick={() => setLeaving(true)} aria-label="Dismiss notification">
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

/** Draws the stack of toasts, bottom right. The only component that reads the toast list. */
export default function ToastViewport() {
  const toasts = useToasts();
  const { dismiss } = useToast();
  const ref = useRef(null);

  // Publish the stack's height as a CSS variable. The older notification toasts (invitations,
  // assignments) live in the same corner and use it to sit above this stack instead of under it.
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return undefined;
    const root = document.documentElement;
    const publish = () => {
      const height = element.getBoundingClientRect().height;
      root.style.setProperty('--snack-offset', height > 0 ? `${Math.ceil(height) + 12}px` : '0px');
    };
    const observer = new ResizeObserver(publish);
    observer.observe(element);
    publish();
    return () => {
      observer.disconnect();
      root.style.removeProperty('--snack-offset');
    };
  }, []);

  return (
    <div ref={ref} className="snack-viewport" role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
      ))}
    </div>
  );
}
