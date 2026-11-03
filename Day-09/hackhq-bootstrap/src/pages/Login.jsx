import { useState, useId } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Alert, Form, InputGroup } from 'react-bootstrap';
import { AlertCircle, KeyRound, LockKeyhole, ShieldAlert } from 'lucide-react';
import { Card, buttonClass } from '../components/ui.jsx';
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
    <div
      className="d-flex align-items-center justify-content-center py-3"
      style={{ minHeight: '60vh' }}
    >
      <Card
        as="section"
        className="w-100 animate-rise p-4 p-sm-5"
        style={{ maxWidth: '28rem' }}
        aria-labelledby="login-title"
      >
        <span
          className="mb-4 d-flex align-items-center justify-content-center rounded-4 bg-brand"
          style={{ width: '3.5rem', height: '3.5rem' }}
          aria-hidden="true"
        >
          <LockKeyhole size={30} />
        </span>
        <h1 id="login-title" className="fs-3 fw-bold">
          Organizer access
        </h1>
        <p className="mt-2 mb-0 small text-body-secondary">
          Check-in and the State lab are behind a route guard. Enter the passcode to continue.
        </p>

        <Form className="mt-4" onSubmit={handleSubmit} noValidate>
          <Form.Group>
            <Form.Label htmlFor={inputId} className="fw-medium">
              Passcode
            </Form.Label>
            {/* CONCEPT: InputGroup - icon addon fused to the control */}
            <InputGroup hasValidation>
              <InputGroup.Text aria-hidden="true">
                <KeyRound size={18} />
              </InputGroup.Text>
              <Form.Control
                id={inputId}
                type="password"
                autoComplete="off"
                value={passcode}
                onChange={(event) => {
                  setPasscode(event.target.value);
                  setError('');
                }}
                isInvalid={Boolean(error)}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${inputId}-err` : `${inputId}-hint`}
              />
              <Form.Control.Feedback type="invalid" id={`${inputId}-err`} role="alert">
                <AlertCircle size={14} aria-hidden="true" className="me-1" />
                <span>{error}</span>
              </Form.Control.Feedback>
            </InputGroup>
            {!error && (
              <Form.Text id={`${inputId}-hint`} muted>
                Demo passcode: <code>{DEMO_PASSCODE}</code>
              </Form.Text>
            )}
          </Form.Group>
          <button
            type="submit"
            className={buttonClass({ variant: 'primary', className: 'mt-4 w-100' })}
          >
            Unlock organizer area
          </button>
        </Form>

        <Alert variant="warning" className="mt-4 mb-0 d-flex align-items-start gap-2 small p-3">
          <ShieldAlert size={16} aria-hidden="true" className="flex-shrink-0 mt-1" />
          <span>
            Demo guard only. Anything in client JavaScript is public; real auth must be enforced by
            the server.
          </span>
        </Alert>
      </Card>
    </div>
  );
}
