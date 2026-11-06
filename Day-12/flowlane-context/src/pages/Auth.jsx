import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { useLanguage } from '../context/LanguageContext';
import '../index.css';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // CONTEXT: sign-in state and actions come from the AuthContext through the useAuth() hook
  const { signIn, signUp, signInWithGoogle, busy, error, clearError } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Each action resolves true on success; on failure the message is in `error`
  const run = async (action) => {
    if (await action()) navigate('/');
  };

  const handleGoogleSignIn = () => run(signInWithGoogle);

  const handleSubmit = (e) => {
    e.preventDefault();
    clearError();
    run(() => (isLogin ? signIn : signUp)({ email, password }));
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

          <div className="auth-divider">
            <span>{t('auth.divider')}</span>
          </div>

          {error && <div className="auth-error">{error}</div>}

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
              <input 
                id="auth-password"
                name="password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                type="password" 
                placeholder={t('auth.password.placeholder')} 
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError(); }}
                required
              />
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
