import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Password input with a show/hide button. The button keeps the SAME name and flips aria-pressed
// (the standard toggle-button pattern), so screen readers hear "Show password, pressed".
export default function PasswordField({ id, label, error, describedBy, inputRef, ...inputProps }) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;
  const ids = [error ? errorId : null, describedBy].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="password-wrap">
        <input id={id} ref={inputRef} className="input" type={visible ? 'text' : 'password'} aria-invalid={error ? 'true' : undefined} aria-describedby={ids} {...inputProps} />
        <button type="button" className="password-toggle" aria-pressed={visible} aria-label="Show password" aria-controls={id} onClick={() => setVisible((v) => !v)}>
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
      {error ? (
        <p id={errorId} className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
