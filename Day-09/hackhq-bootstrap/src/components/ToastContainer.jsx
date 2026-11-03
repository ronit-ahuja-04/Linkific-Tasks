import { Toast, ToastContainer as BsToastContainer } from 'react-bootstrap';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Button } from './ui.jsx';

const TONES = {
  success: { icon: CheckCircle2, color: 'text-success', border: 'border-success' },
  warning: { icon: AlertCircle, color: 'text-warning', border: 'border-warning' },
  error: { icon: AlertCircle, color: 'text-danger', border: 'border-danger' },
  info: { icon: Info, color: 'text-primary', border: 'border-primary' },
};

export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div role="region" aria-label="Notifications" aria-live="polite">
      <BsToastContainer
        position="bottom-end"
        className="position-fixed p-3"
        style={{ zIndex: 1090 }}
      >
        {toasts.map((toast) => {
          const tone = TONES[toast.type] ?? TONES.info;
          const Icon = tone.icon;

          return (
            <Toast
              key={toast.id}
              show
              onClose={() => onDismiss(toast.id)}
              role="status"
              aria-live="polite"
              className={`border-start border-4 ${tone.border} animate-toast`}
            >
              <Toast.Header closeButton closeLabel="Dismiss notification">
                <Icon size={18} aria-hidden="true" className={`me-2 flex-shrink-0 ${tone.color}`} />
                <span className="me-auto fw-medium text-body">{toast.message}</span>
              </Toast.Header>
              {toast.action && (
                <Toast.Body className="pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      toast.action.onClick();
                      onDismiss(toast.id);
                    }}
                  >
                    {toast.action.label}
                  </Button>
                </Toast.Body>
              )}
            </Toast>
          );
        })}
      </BsToastContainer>
    </div>
  );
}
