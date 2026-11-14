import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import PasswordField from '../components/PasswordField';
import PasswordStrength from '../components/PasswordStrength';
import { returnPath } from '../lib/session';
import { errorKeyFor } from '../lib/authErrors';
import { useLanguage } from '../context/LanguageContext';
import '../index.css';
import '../styles/account.css';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // CONTEXT: sign-in state and actions come from the AuthContext through the useAuth() hook
  const [remember, setRemember] = useState(true);
  const { signIn, signUp, signInWithGoogle, signInWithGithub, busy, error, errorCode, notice, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  // A known Firebase error code gets a translated, friendly sentence; anything else shows `error`
  const errorKey = errorKeyFor(errorCode);
  const errorText = error ? (errorKey ? t(errorKey) : error) : null;

  // Each action resolves true on success; on failure the message is in `error`.
  // After signing in we return to the page the visitor first asked for (see RouteGuards).
  const run = async (action) => {
    if (await action()) navigate(returnPath(location.state), { replace: true });
  };

  const handleGoogleSignIn = () => run(() => signInWithGoogle({ remember }));
  const handleGithubSignIn = () => run(() => signInWithGithub({ remember }));

  const handleSubmit = (e) => {
    e.preventDefault();
    clearError();
    run(() => (isLogin ? signIn : signUp)({ email, password, remember }));
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-brand">
          <Logo size={42} />
          <h2>FlowLane</h2>
        </div>
        
        <div className="auth-hero-graphic">
          <img src="/auth-hero.jpg" alt={t('auth.hero.alt')} />
        </div>

        <div className="auth-hero-text">
          <h1>{t('auth.hero.title')}</h1>
          <p>{t('auth.hero.subtitle')}</p>
        </div>
      </div>
      
      <div className="auth-right">
        <div className="auth-box">
          <h2>{isLogin ? t('auth.login.title') : t('auth.signup.title')}</h2>
          <p className="auth-subtitle">
            {isLogin ? t('auth.login.subtitle') : t('auth.signup.subtitle')}
          </p>

          <button onClick={handleGoogleSignIn} className="google-btn" disabled={busy}>
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {isLogin ? t('auth.google.signIn') : t('auth.google.signUp')}
          </button>

          <button onClick={handleGithubSignIn} className="google-btn github-btn" disabled={busy}>
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path fill="currentColor" d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.1c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/>
            </svg>
            {t('account.github.signIn')}
          </button>

          <div className="auth-divider">
            <span>{t('auth.divider')}</span>
          </div>

          {notice && (
            <div className="auth-notice" role="status">
              {t(notice.type === 'idle' ? 'account.notice.idle' : 'account.notice.expired')}
            </div>
          )}

          {errorText && <div className="auth-error" role="alert">{errorText}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="auth-email">{t('auth.email.label')}</label>
              <input 
                id="auth-email"
                name="email"
                autoComplete="email"
                type="email" 
                placeholder={t('auth.email.placeholder')} 
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError(); }}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="auth-password">{t('auth.password.label')}</label>
              <PasswordField
                id="auth-password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                placeholder={t('auth.password.placeholder')}
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError(); }}
              />
            </div>

            {!isLogin && <PasswordStrength password={password} email={email} />}

            <div className="auth-options">
              <label className="auth-check">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                {t('account.remember')}
              </label>
              {isLogin && <Link className="auth-link" to="/forgot-password">{t('account.forgot.link')}</Link>}
            </div>

            <button type="submit" className="submit-btn" disabled={busy}>
              {isLogin ? t('auth.submit.signIn') : t('auth.submit.signUp')}
            </button>
          </form>

          <p className="auth-switch">
            {isLogin ? t('auth.switch.toSignUpPrompt') : t('auth.switch.toSignInPrompt')}
            <span onClick={() => { setIsLogin(!isLogin); clearError(); }}>
              {isLogin ? t('auth.switch.signUp') : t('auth.switch.signIn')}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
