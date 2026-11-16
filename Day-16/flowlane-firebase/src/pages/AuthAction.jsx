import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { applyActionCode, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { passwordStrength } from '../lib/password';
import { errorKeyFor } from '../lib/authErrors';
import Logo from '../components/Logo';
import PasswordField from '../components/PasswordField';
import PasswordStrength from '../components/PasswordStrength';
import '../index.css';
import '../styles/account.css';

/**
 * The page behind the links in Firebase emails: /auth/action?mode=...&oobCode=...
 * An "oobCode" (out-of-band code) is a one-time code that proves the person can read that mailbox.
 * It can be used ONCE, so each effect below runs once, even under React StrictMode (which mounts
 * effects twice in development): a ref remembers that we already started.
 */
function Shell({ title, children }) {
  return (
    <div className="auth-container">
      <div className="auth-right">
        <div className="auth-box">
          <div className="auth-brand" style={{ marginBottom: 24 }}>
            <Logo size={32} />
            <h2 style={{ margin: 0 }}>FlowLane</h2>
          </div>
          <h2>{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}

function VerifyEmail({ oobCode }) {
  const { t } = useLanguage();
  const { user, refreshUser } = useAuth();
  const [state, setState] = useState('working'); // 'working' | 'success' | 'error'
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        await applyActionCode(auth, oobCode);
      } catch {
        setState('error');
        return;
      }
      // If the person is signed in here, refresh the cached user so the banner disappears
      try {
        await refreshUser();
      } catch {
        /* the code was applied; a failed refresh only delays the banner going away */
      }
      setState('success');
    })();
  }, [oobCode, refreshUser]);

  const continueTo = user ? '/' : '/auth';
  const continueLabel = user ? t('account.action.continue') : t('account.action.toSignIn');

  if (state === 'working') {
    return <Shell title={t('account.action.checking')}><p className="auth-info" role="status">{t('account.action.checking')}</p></Shell>;
  }
  if (state === 'error') {
    return (
      <Shell title={t('account.action.verifyFailTitle')}>
        <p className="auth-info" role="alert">{t('account.action.verifyFailBody')}</p>
        <div className="auth-actions"><Link className="submit-btn" to={continueTo}>{continueLabel}</Link></div>
      </Shell>
    );
  }
  return (
    <Shell title={t('account.action.verifiedTitle')}>
      <p className="auth-info" role="status">{t('account.action.verifiedBody')}</p>
      <div className="auth-actions"><Link className="submit-btn" to={continueTo}>{continueLabel}</Link></div>
    </Shell>
  );
}

function ResetPassword({ oobCode }) {
  const { t } = useLanguage();
  const [phase, setPhase] = useState('checking'); // 'checking' | 'ready' | 'invalid' | 'done'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [problem, setProblem] = useState(null);
  const [saving, setSaving] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    verifyPasswordResetCode(auth, oobCode).then(
      (account) => {
        setEmail(account);
        setPhase('ready');
      },
      () => setPhase('invalid')
    );
  }, [oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setProblem(t('account.error.mismatch'));
    if (passwordStrength(password, { email }).score < 2) return setProblem(t('account.error.weakChosen'));
    setProblem(null);
    setSaving(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setPhase('done');
    } catch (err) {
      if (err?.code === 'auth/expired-action-code' || err?.code === 'auth/invalid-action-code') setPhase('invalid');
      else setProblem(t(errorKeyFor(err?.code) ?? 'account.error.generic'));
    } finally {
      setSaving(false);
    }
  };

  if (phase === 'checking') {
    return <Shell title={t('account.action.checking')}><p className="auth-info" role="status">{t('account.action.checking')}</p></Shell>;
  }
  if (phase === 'invalid') {
    return (
      <Shell title={t('account.action.invalidTitle')}>
        <p className="auth-info" role="alert">{t('account.action.invalidBody')}</p>
        <p className="auth-switch"><Link className="auth-link" to="/forgot-password">{t('account.forgot.title')}</Link></p>
      </Shell>
    );
  }
  if (phase === 'done') {
    return (
      <Shell title={t('account.action.resetDoneTitle')}>
        <p className="auth-info" role="status">{t('account.action.resetDoneBody')}</p>
        <div className="auth-actions"><Link className="submit-btn" to="/auth">{t('account.action.toSignIn')}</Link></div>
      </Shell>
    );
  }
  return (
    <Shell title={t('account.action.resetTitle')}>
      <p className="auth-subtitle">{t('account.action.resetFor', { email })}</p>
      {problem && <div className="auth-error" role="alert">{problem}</div>}
      <form onSubmit={handleSubmit} className="auth-form">
        {/* Password managers and browsers expect the account name next to a new-password field; we know it from the link */}
        <input type="text" name="username" autoComplete="username" value={email} readOnly hidden />
        <div className="form-group">
          <label htmlFor="reset-password">{t('account.action.resetNew')}</label>
          <PasswordField id="reset-password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <PasswordStrength password={password} email={email} />
        <div className="form-group">
          <label htmlFor="reset-confirm">{t('account.confirm.label')}</label>
          <PasswordField id="reset-confirm" name="confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <button type="submit" className="submit-btn" disabled={saving}>{t('account.action.resetSubmit')}</button>
      </form>
    </Shell>
  );
}

export default function AuthAction() {
  const [params] = useSearchParams();
  const { t } = useLanguage();
  const mode = params.get('mode');
  const oobCode = params.get('oobCode');

  if (oobCode && mode === 'verifyEmail') return <VerifyEmail oobCode={oobCode} />;
  if (oobCode && mode === 'resetPassword') return <ResetPassword oobCode={oobCode} />;
  return (
    <Shell title={t('account.action.invalidTitle')}>
      <p className="auth-info" role="alert">{t('account.action.invalidBody')}</p>
      <div className="auth-actions"><Link className="submit-btn" to="/auth">{t('account.action.toSignIn')}</Link></div>
    </Shell>
  );
}
