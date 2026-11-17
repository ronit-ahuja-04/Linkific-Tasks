import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { passwordStrength } from '../../lib/profiles';

/** Password input with a show/hide button and (optionally) a strength hint */
export default function PasswordField({ label = 'Password', value, onChange, error, autoComplete, showStrength = false, hint, required = true, name = 'password' }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const strength = passwordStrength(value);
  const describedBy = [error ? `${id}-error` : null, showStrength || hint ? `${id}-hint` : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-password">
        <input
          id={id}
          name={name}
          className="input"
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
        />
        <button type="button" className="icon-btn auth-eye" onClick={() => setVisible((v) => !v)} aria-pressed={visible} aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}>
          {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      </div>
      {error && <p id={`${id}-error`} className="field-error" role="alert">{error}</p>}
      {(showStrength || hint) && (
        <div id={`${id}-hint`} className="field-hint">
          {showStrength && (
            <>
              <span className="auth-meter" aria-hidden="true">
                {[1, 2, 3, 4].map((n) => <span key={n} className={`auth-meter-bar${strength.score >= n ? ` is-on auth-meter-${strength.score}` : ''}`} />)}
              </span>
              <span>{strength.label ? `Strength: ${strength.label}. ` : ''}At least 6 characters.</span>
            </>
          )}
          {hint}
        </div>
      )}
    </div>
  );
}
