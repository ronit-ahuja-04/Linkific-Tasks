import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resendVerification, verifyEmail } from '../../api/authApi';
import { useAuth } from '../../auth/AuthContext';
import AuthLayout from '../../components/auth/AuthLayout';
import FormAlert from '../../components/auth/FormAlert';
import useDocumentTitle from '../../components/auth/useDocumentTitle';
import { describeError } from '../../components/auth/authErrors';

export default function VerifyEmailPage() {
  useDocumentTitle('Verify email');
  const auth = useAuth();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [result, setResult] = useState({ status: token ? 'verifying' : 'error', message: token ? '' : 'This verification link is missing its token.' });
  const [resend, setResend] = useState({ busy: false, message: null, failed: false });
  const request = useRef(null);
  const authRef = useRef(auth);
  useEffect(() => {
    authRef.current = auth;
  });

  useEffect(() => {
    if (!token) return undefined;
    // Verification tokens are single use. StrictMode runs effects twice in development, so the request
    // is remembered in a ref (refs survive that double run) and both runs share ONE call.
    if (request.current?.token !== token) request.current = { token, promise: verifyEmail(token) };
    let cancelled = false;
    request.current.promise.then(
      (data) => {
        if (cancelled) return;
        // If you are signed in, refresh the stored user so the "unverified" banner disappears.
        if (authRef.current.isAuthenticated && data?.user) authRef.current.setUser(data.user);
        setResult({ status: 'success', message: '' });
      },
      (error) => {
        if (cancelled) return;
        const { fields, message } = describeError(error);
        setResult({ status: 'error', message: fields?.token || message || 'We could not verify your email.' });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleResend() {
    setResend({ busy: true, message: null, failed: false });
    try {
      await resendVerification();
      setResend({ busy: false, message: 'A new verification email is on its way.', failed: false });
    } catch (error) {
      setResend({ busy: false, message: describeError(error).message || 'Could not send the email. Try again.', failed: true });
    }
  }

  return (
    <AuthLayout title="Verify your email">
      {result.status === 'verifying' ? (
        <p className="auth-status" role="status">
          <span className="auth-spinner" aria-hidden="true" />
          Verifying your email…
        </p>
      ) : null}
      {result.status === 'success' ? (
        <>
          <FormAlert kind="success" role="status">
            Your email is verified. Thank you!
          </FormAlert>
          <Link className="btn btn-primary btn-block" to={auth.isAuthenticated ? '/dashboard' : '/login'}>
            {auth.isAuthenticated ? 'Go to dashboard' : 'Sign in'}
          </Link>
        </>
      ) : null}
      {result.status === 'error' ? (
        <>
          <FormAlert>{result.message}</FormAlert>
          {auth.isAuthenticated ? (
            <button type="button" className="btn btn-primary btn-block" onClick={handleResend} disabled={resend.busy} aria-busy={resend.busy}>
              {resend.busy ? 'Sending…' : 'Resend verification email'}
            </button>
          ) : (
            <p className="muted">Sign in to request a new verification email.</p>
          )}
          {resend.message ? (
            <FormAlert kind={resend.failed ? 'error' : 'success'} role={resend.failed ? 'alert' : 'status'}>
              {resend.message}
            </FormAlert>
          ) : null}
          <Link to={auth.isAuthenticated ? '/dashboard' : '/login'}>{auth.isAuthenticated ? 'Go to dashboard' : 'Go to sign in'}</Link>
        </>
      ) : null}
    </AuthLayout>
  );
}
