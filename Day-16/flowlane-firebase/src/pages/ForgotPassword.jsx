import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { errorKeyFor } from '../lib/authErrors';
import Logo from '../components/Logo';
import '../index.css';
import '../styles/account.css';

/**
 * "Forgot password": Firebase emails a link that opens /auth/action?mode=resetPassword.
 * The answer is always the same sentence ("if an account exists..."), so nobody can use this page
 * to find out which emails are registered.
 */
export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState(null);
  const { sendPasswordReset, busy, error, errorCode, clearError } = useAuth();
  const { t } = useLanguage();

  const errorKey = errorKeyFor(errorCode);
  const errorText = error ? (errorKey ? t(errorKey) : error) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    if (await sendPasswordReset(email.trim())) setSentTo(email.trim());
  };

  return (
    <div className="auth-container">
      <div className="auth-right">
        <div className="auth-box">
          <div className="auth-brand" style={{ marginBottom: 24 }}>
            <Logo size={32} />
            <h2 style={{ margin: 0 }}>FlowLane</h2>
          </div>
          {sentTo ? (
            <>
              <h2>{t('account.forgot.sentTitle')}</h2>
              <p className="auth-info" role="status">{t('account.forgot.sent', { email: sentTo })}</p>
            </>
          ) : (
            <>
              <h2>{t('account.forgot.title')}</h2>
              <p className="auth-subtitle">{t('account.forgot.subtitle')}</p>
              {errorText && <div className="auth-error" role="alert">{errorText}</div>}
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="forgot-email">{t('auth.email.label')}</label>
                  <input
                    id="forgot-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder={t('auth.email.placeholder')}
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearError(); }}
                    required
                  />
                </div>
                <button type="submit" className="submit-btn" disabled={busy}>{t('account.forgot.submit')}</button>
              </form>
            </>
          )}
          <p className="auth-switch"><Link className="auth-link" to="/auth">{t('account.forgot.back')}</Link></p>
        </div>
      </div>
    </div>
  );
}
