import { useState, useId } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle, KeyRound, LockKeyhole, ShieldAlert } from 'lucide-react';
import { DEMO_PASSCODE, isValidPasscode } from '../lib/auth.js';

export default function Login({ isOrganizer, onLogin }) {
  const navigate = useNavigate();
  const inputId = useId();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  // Already signed in: redirect during render instead of showing the form
  if (isOrganizer) {
    return <Navigate to="/organizer" replace />;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!isValidPasscode(passcode)) {
      setError('That passcode did not open the door.');
      return;
    }
    onLogin();
    // replace: Back from the organizer area should not return to the login form
    navigate('/organizer', { replace: true });
  };

  return (
    <div className="station-view login-view">
      <section className="login-card" aria-labelledby="login-title">
        <span className="login-lock" aria-hidden="true">
          <LockKeyhole size={30} />
        </span>
        <h1 id="login-title" className="login-title">
          Organizer access
        </h1>
        <p className="login-copy">
          Check-in and the State lab are behind a route guard. Enter the passcode to continue.
        </p>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor={inputId} className="form-label">
            Passcode
          </label>
          <div className="login-input-row">
            <KeyRound size={18} aria-hidden="true" className="login-input-icon" />
            <input
              id={inputId}
              type="password"
              autoComplete="off"
              className={`form-input login-input ${error ? 'input-error' : ''}`}
              value={passcode}
              onChange={(event) => {
                setPasscode(event.target.value);
                setError('');
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${inputId}-err` : `${inputId}-hint`}
            />
          </div>
          {error ? (
            <p id={`${inputId}-err`} className="field-error-text" role="alert">
              <AlertCircle size={14} aria-hidden="true" />
              <span>{error}</span>
            </p>
          ) : (
            <p id={`${inputId}-hint`} className="login-hint">
              Demo passcode: <code>{DEMO_PASSCODE}</code>
            </p>
          )}
          <button type="submit" className="btn btn-primary login-submit">
            Unlock organizer area
          </button>
        </form>

        <p className="login-warning">
          <ShieldAlert size={16} aria-hidden="true" />
          <span>
            Demo guard only. Anything in client JavaScript is public; real auth must be enforced by
            the server.
          </span>
        </p>
      </section>
    </div>
  );
}
