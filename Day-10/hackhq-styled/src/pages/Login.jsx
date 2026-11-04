import { useState, useId } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { AlertCircle, KeyRound, LockKeyhole, ShieldAlert } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  ErrorText,
  FormGroup,
  Hint,
  Input,
  Label,
} from '../components/ui.jsx';
import { animateRise } from '../styles/animations.js';
import { DEMO_PASSCODE, isValidPasscode } from '../lib/auth.js';

const Center = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 0;
  min-height: 60vh;
`;
const Panel = styled(Card).attrs({ as: 'section' })`
  width: 100%;
  max-width: 28rem;
  padding: 1.5rem;
  ${animateRise}
  ${({ theme }) => theme.media.up('sm')} {
    padding: 3rem;
  }
  h1 {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 700;
  }
`;
const LockBox = styled.span`
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.brand};
  color: ${({ theme }) => theme.colors.onBrand};
`;
const Intro = styled.p`
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.muted};
`;
const Form = styled.form`
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;
const Group = styled.div`
  display: flex;
  align-items: stretch;
`;
const Addon = styled.span`
  display: flex;
  align-items: center;
  padding: 0 0.75rem;
  background: ${({ theme }) => theme.colors.surface2};
  color: ${({ theme }) => theme.colors.muted};
  border: 1px solid ${({ theme, $invalid }) => ($invalid ? theme.colors.bad : theme.colors.line)};
  border-right: 0;
  border-radius: ${({ theme }) => theme.radii.md} 0 0 ${({ theme }) => theme.radii.md};
`;
const Field = styled(Input)`
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  flex: 1;
`;
const Err = styled(ErrorText)`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;
const Warning = styled(Alert)`
  margin-top: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.875rem;
  svg {
    flex-shrink: 0;
    margin-top: 0.25rem;
  }
`;

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
    <Center>
      <Panel aria-labelledby="login-title">
        <LockBox aria-hidden="true">
          <LockKeyhole size={30} />
        </LockBox>
        <h1 id="login-title">Organizer access</h1>
        <Intro>
          Check-in and the State lab are behind a route guard. Enter the passcode to continue.
        </Intro>

        <Form onSubmit={handleSubmit} noValidate>
          <FormGroup>
            <Label htmlFor={inputId}>Passcode</Label>
            {/* CONCEPT: input group - icon addon fused to the control */}
            <Group>
              <Addon aria-hidden="true" $invalid={Boolean(error)}>
                <KeyRound size={18} />
              </Addon>
              <Field
                id={inputId}
                type="password"
                autoComplete="off"
                value={passcode}
                onChange={(event) => {
                  setPasscode(event.target.value);
                  setError('');
                }}
                $invalid={Boolean(error)}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${inputId}-err` : `${inputId}-hint`}
              />
            </Group>
            {error && (
              <Err id={`${inputId}-err`} role="alert">
                <AlertCircle size={14} aria-hidden="true" />
                <span>{error}</span>
              </Err>
            )}
            {!error && (
              <Hint id={`${inputId}-hint`}>
                Demo passcode: <code>{DEMO_PASSCODE}</code>
              </Hint>
            )}
          </FormGroup>
          <Button type="submit" $block>
            Unlock organizer area
          </Button>
        </Form>

        <Warning $tone="warn">
          <ShieldAlert size={16} aria-hidden="true" />
          <span>
            Demo guard only. Anything in client JavaScript is public; real auth must be enforced by
            the server.
          </span>
        </Warning>
      </Panel>
    </Center>
  );
}
