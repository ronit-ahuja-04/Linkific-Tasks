import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { ErrorState, LoadingState, buttonClasses } from '../../components/ui';
import { hydrateAuth } from './authSlice';

export function AuthCallbackPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userId, status, error } = useAppSelector((state) => state.auth);

  const oauthError = searchParams.get('error_description') ?? searchParams.get('error');

  useEffect(() => {
    if (oauthError) return;
    void dispatch(hydrateAuth());
  }, [dispatch, oauthError]);

  useEffect(() => {
    if (!oauthError && userId && status === 'ready') {
      navigate('/dashboard', { replace: true });
    }
  }, [oauthError, userId, status, navigate]);

  if (oauthError) {
    return (
      <ErrorState
        variant="panel"
        code="OAUTH_CALLBACK_ERROR"
        title="GitHub Sign-In Cancelled"
        message={oauthError}
        actionSlot={
          <Link to="/login" className={buttonClasses({ variant: 'primary', size: 'md' })}>
            Back to Sign In
          </Link>
        }
      />
    );
  }

  if (status === 'error' || (status === 'ready' && !userId)) {
    return (
      <ErrorState
        variant="panel"
        code={error?.code ?? 'SESSION_NOT_FOUND'}
        title="Could Not Complete Sign-In"
        message={
          error?.message ??
          'No active OAuth session was found. Please sign in with email or demo quick-switch.'
        }
        actionSlot={
          <Link to="/login" className={buttonClasses({ variant: 'primary', size: 'md' })}>
            Return to Sign In
          </Link>
        }
      />
    );
  }

  return (
    <section className="mx-auto max-w-lg">
      <LoadingState label="Completing GitHub Guild sign-in..." />
    </section>
  );
}
