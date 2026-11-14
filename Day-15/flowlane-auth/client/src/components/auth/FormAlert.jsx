import { X } from 'lucide-react';

// A message box. role="alert" makes screen readers announce it as soon as it appears.
export default function FormAlert({ kind = 'error', children, onDismiss, role = 'alert' }) {
  return (
    <div className={`alert alert-${kind} auth-alert`} role={role}>
      <div className="auth-alert-body">{children}</div>
      {onDismiss ? (
        <button type="button" className="auth-alert-close" aria-label="Dismiss message" onClick={onDismiss}>
          <X size={16} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
