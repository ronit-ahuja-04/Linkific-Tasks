import { useState, useId } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle, KeyRound, LockKeyhole, ShieldAlert } from 'lucide-react';
import {
  Card,
  buttonClass,
  cx,
  errorClass,
  hintClass,
  inputClass,
  labelClass,
} from '../components/ui.jsx';
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
    <div className="flex min-h-[60vh] items-center justify-center py-4">
      <Card
        as="section"
        className="w-full max-w-md animate-rise p-6 sm:p-8"
        aria-labelledby="login-title"
      >
        <span
          className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-brand text-on-brand"
          aria-hidden="true"
        >
          <LockKeyhole size={30} />
        </span>
        <h1 id="login-title" className="text-2xl font-bold tracking-tight">
          Organizer access
        </h1>
        <p className="mt-2 text-sm text-muted">
          Check-in and the State lab are behind a route guard. Enter the passcode to continue.
        </p>

        <form className="mt-6 space-y-1" onSubmit={handleSubmit} noValidate>
          <label htmlFor={inputId} className={labelClass}>
            Passcode
          </label>
          <div className="relative">
            <KeyRound
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              id={inputId}
              type="password"
              autoComplete="off"
              className={cx(inputClass, 'pl-10')}
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
            <p
              id={`${inputId}-err`}
              className={cx(errorClass, 'flex items-center gap-1.5')}
              role="alert"
            >
              <AlertCircle size={14} aria-hidden="true" />
              <span>{error}</span>
            </p>
          ) : (
            <p id={`${inputId}-hint`} className={hintClass}>
              Demo passcode: <code className="font-mono text-ink">{DEMO_PASSCODE}</code>
            </p>
          )}
          <button
            type="submit"
            className={buttonClass({ variant: 'primary', className: 'mt-4 w-full' })}
          >
            Unlock organizer area
          </button>
        </form>

        <p className="mt-6 flex items-start gap-2 rounded-xl bg-warn-soft p-3 text-xs text-warn [&>svg]:mt-0.5 [&>svg]:shrink-0">
          <ShieldAlert size={16} aria-hidden="true" />
          <span>
            Demo guard only. Anything in client JavaScript is public; real auth must be enforced by
            the server.
          </span>
        </p>
      </Card>
    </div>
  );
}
