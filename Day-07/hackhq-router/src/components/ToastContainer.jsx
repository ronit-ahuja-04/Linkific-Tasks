import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      className="hackhq-toast-region"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      <div className="toast-stack">
        {toasts.map((toast) => {
          const type = toast.type || 'info';

          return (
            <div key={toast.id} className={`hackhq-toast toast-${type}`} role="status">
              <div className="toast-icon-wrap" aria-hidden="true">
                {type === 'success' && <CheckCircle2 size={18} className="toast-icon-mint" />}
                {type === 'warning' && <AlertCircle size={18} className="toast-icon-tape" />}
                {type === 'error' && <AlertCircle size={18} className="toast-icon-signal" />}
                {type === 'info' && <Info size={18} className="toast-icon-lanyard" />}
              </div>

              <div className="toast-message">{toast.message}</div>

              {toast.action && (
                <button
                  type="button"
                  className="toast-action-btn"
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
                className="toast-close-btn"
                aria-label="Dismiss notification"
                onClick={() => onDismiss(toast.id)}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
