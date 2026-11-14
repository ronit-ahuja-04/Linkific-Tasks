import { useCallback, useEffect, useState } from 'react';
import '../styles/security.css';
import { useAuth } from '../context/AuthContext';
import { useGitHub } from '../context/GitHubContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { getMe } from '../api/github';

/**
 * SECURITY PANEL: makes the invisible parts of authentication visible.
 *
 * An ID token is a JWT: three base64 parts (header.payload.signature). The payload ("claims") is
 * only encoded, not encrypted, so the browser can read it. What nobody can do without Google's
 * private key is change it, because the signature would stop matching. The raw token string is a
 * credential, so it is NEVER rendered or logged here: only the decoded claims are shown.
 */

const PROVIDER_ICONS = { password: '@', 'google.com': 'G', 'github.com': 'GH' };
const PROVIDER_KEYS = { password: 'security.provider.password', 'google.com': 'security.provider.google.com', 'github.com': 'security.provider.github.com' };
const GITHUB_ERROR_KEYS = {
  last_provider: 'security.github.error.last',
  credential_in_use: 'security.github.error.inUse',
  unknown: 'security.github.error.unknown',
};

function formatCountdown(seconds) {
  const safe = Math.max(0, seconds);
  const mm = String(Math.floor(safe / 60)).padStart(2, '0');
  const ss = String(safe % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function Card({ title, hint, children }) {
  return (
    <section className="security-card" aria-label={title}>
      <h3>{title}</h3>
      {hint && <p className="security-hint">{hint}</p>}
      {children}
    </section>
  );
}

function ErrorLine({ children }) {
  return <p className="security-error" role="alert">{children}</p>;
}

function TokenCard({ info, onRefresh }) {
  const { t, locale } = useLanguage();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  // `now` lives in state and is updated by a timer, so rendering stays pure (no Date.now() in render)
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const when = (ms) => (typeof ms === 'number' ? new Date(ms).toLocaleString(locale) : t('security.claims.none'));
  const claims = info.claims ?? {};
  const rows = [
    ['security.claims.iss', claims.iss],
    ['security.claims.aud', claims.aud],
    ['security.claims.sub', claims.sub],
    ['security.claims.email', claims.email],
    ['security.claims.authTime', when(info.authTime)],
    ['security.claims.iat', when(info.issuedAt)],
    ['security.claims.exp', when(info.expiresAt)],
    ['security.claims.provider', info.signInProvider],
  ];
  const remaining = Math.max(0, Math.floor((info.expiresAt - now) / 1000));

  const refresh = async () => {
    setBusy(true);
    try {
      const next = await onRefresh();
      if (next) toast.success(t('security.refresh.done'));
      else toast.error(t('security.refresh.failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title={t('security.token.title')} hint={t('security.token.hint')}>
      <dl className="security-claims">
        {rows.map(([key, value]) => (
          <div key={key} style={{ display: 'contents' }}>
            <dt>{t(key)}</dt>
            <dd><code>{value || t('security.claims.none')}</code></dd>
          </div>
        ))}
      </dl>
      <div className="security-countdown" data-expired={remaining === 0}>
        {t('security.expires.label')}: <span data-testid="token-countdown">{remaining === 0 ? t('security.expires.expired') : formatCountdown(remaining)}</span>
      </div>
      <div className="security-actions">
        <button type="button" className="security-btn" onClick={refresh} disabled={busy}>
          {busy ? t('security.refresh.busy') : t('security.refresh')}
        </button>
      </div>
    </Card>
  );
}

function ServerCard() {
  const { t, locale } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [errorKey, setErrorKey] = useState(null);

  const ask = async () => {
    setBusy(true);
    setErrorKey(null);
    try {
      setResult(await getMe());
    } catch (err) {
      setResult(null);
      if (err?.status === 401) setErrorKey('security.server.error.401');
      else if (err?.code === 'network_error') setErrorKey('security.server.error.network');
      else setErrorKey('security.server.error.generic');
    } finally {
      setBusy(false);
    }
  };

  const when = (ms) => (typeof ms === 'number' ? new Date(ms).toLocaleString(locale) : t('security.claims.none'));
  const rows = result && [
    ['security.server.uid', result.uid],
    ['security.server.email', result.email],
    ['security.server.provider', result.provider],
    ['security.server.verifiedBy', result.verifiedBy],
    ['security.server.expiresAt', when(result.expiresAt)],
  ];

  return (
    <Card title={t('security.server.title')} hint={t('security.server.hint')}>
      <div className="security-actions">
        <button type="button" className="security-btn" onClick={ask} disabled={busy}>
          {busy ? t('security.server.asking') : t('security.server.ask')}
        </button>
      </div>
      {rows && (
        <dl className="security-claims" style={{ marginTop: 16 }}>
          {rows.map(([key, value]) => (
            <div key={key} style={{ display: 'contents' }}>
              <dt>{t(key)}</dt>
              <dd><code>{value || t('security.claims.none')}</code></dd>
            </div>
          ))}
        </dl>
      )}
      {errorKey && <ErrorLine>{t(errorKey)}</ErrorLine>}
    </Card>
  );
}

function MethodsCard({ onChanged }) {
  const { t } = useLanguage();
  const toast = useToast();
  const { user, refreshUser } = useAuth();
  const github = useGitHub();
  const [localErrorKey, setLocalErrorKey] = useState(null);
  const providerIds = user?.providerIds ?? [];

  const afterChange = async (message) => {
    toast.success(message);
    await refreshUser();
    await onChanged();
  };

  const link = async () => {
    setLocalErrorKey(null);
    if (await github.connect()) await afterChange(t('security.github.linked'));
  };

  const unlink = async () => {
    // Never leave the account with no way to sign in
    if (providerIds.length <= 1) {
      setLocalErrorKey('security.github.error.last');
      return;
    }
    setLocalErrorKey(null);
    if (await github.unlink()) await afterChange(t('security.github.unlinked'));
  };

  const forget = () => {
    github.disconnect();
    toast.info(t('security.github.forgot'));
  };

  const contextErrorKey = github.error ? (GITHUB_ERROR_KEYS[github.error.code] ?? GITHUB_ERROR_KEYS.unknown) : null;
  const errorKey = localErrorKey ?? contextErrorKey;
  const hasGithub = github.linked || providerIds.includes('github.com');

  return (
    <Card title={t('security.methods.title')} hint={t('security.methods.hint')}>
      <ul className="security-providers">
        {providerIds.map((id) => (
          <li key={id}>
            <span className="security-icon" aria-hidden="true">{PROVIDER_ICONS[id] ?? '?'}</span>
            <span>{PROVIDER_KEYS[id] ? t(PROVIDER_KEYS[id]) : t('security.provider.other')}</span>
          </li>
        ))}
      </ul>
      {github.githubLogin && <p className="security-hint">{t('security.github.login', { login: github.githubLogin })}</p>}
      {github.connected && <p className="security-hint">{t('security.github.connectedHint')}</p>}
      <div className="security-actions">
        {hasGithub ? (
          <button type="button" className="security-btn secondary" onClick={unlink}>{t('security.github.unlink')}</button>
        ) : (
          <button type="button" className="security-btn" onClick={link} disabled={github.connecting}>{t('security.github.link')}</button>
        )}
        {github.connected && (
          <button type="button" className="security-btn secondary" onClick={forget}>{t('security.github.forget')}</button>
        )}
      </div>
      {errorKey && <ErrorLine>{t(errorKey)}</ErrorLine>}
    </Card>
  );
}

function EmailCard() {
  const { t } = useLanguage();
  const toast = useToast();
  const { user, resendVerification, refreshUser } = useAuth();
  const [busy, setBusy] = useState(false);

  const resend = async () => {
    setBusy(true);
    try {
      const ok = await resendVerification();
      if (ok) toast.success(t('security.email.sent'));
      else toast.error(t('security.email.sendFailed'));
    } finally {
      setBusy(false);
    }
  };

  const check = async () => {
    setBusy(true);
    try {
      await refreshUser();
    } finally {
      setBusy(false);
    }
  };

  const verified = Boolean(user?.emailVerified);
  return (
    <Card title={t('security.email.title')} hint={t('security.email.hint')}>
      <p style={{ marginBottom: 12, fontSize: 14 }}>
        {user?.email} <span className="security-badge">{verified ? t('security.email.verified') : t('security.email.unverified')}</span>
      </p>
      {!verified && (
        <div className="security-actions">
          <button type="button" className="security-btn" onClick={resend} disabled={busy}>{t('security.email.resend')}</button>
          <button type="button" className="security-btn secondary" onClick={check} disabled={busy}>{t('security.email.check')}</button>
        </div>
      )}
    </Card>
  );
}

function SessionsCard() {
  const { t } = useLanguage();
  const keys = ['security.sessions.id', 'security.sessions.refresh', 'security.sessions.remember', 'security.sessions.idle', 'security.sessions.github'];
  return (
    <Card title={t('security.sessions.title')}>
      <ul className="security-list">
        {keys.map((key) => <li key={key}>{t(key)}</li>)}
      </ul>
    </Card>
  );
}

export default function SecurityPanel() {
  const { t } = useLanguage();
  const { getTokenInfo, refreshToken } = useAuth();
  // undefined = still loading, null = no token, object = loaded
  const [info, setInfo] = useState(undefined);

  // Bumping `version` re-runs the effect below, i.e. asks for fresh token info (after a refresh or a provider change)
  const [version, setVersion] = useState(0);
  const load = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(() => getTokenInfo())
      .then((next) => { if (!cancelled) setInfo(next ?? null); })
      .catch(() => { if (!cancelled) setInfo(null); });
    return () => { cancelled = true; };
  }, [getTokenInfo, version]);

  const refresh = useCallback(async () => {
    try {
      const next = await refreshToken();
      if (next) setInfo(next);
      return next;
    } catch {
      return null;
    }
  }, [refreshToken]);

  return (
    <div>
      {info === undefined && <p className="security-hint" role="status">{t('security.loading')}</p>}
      {info === null && <ErrorLine>{t('security.token.missing')}</ErrorLine>}
      {info && <TokenCard info={info} onRefresh={refresh} />}
      <ServerCard />
      <MethodsCard onChanged={load} />
      <EmailCard />
      <SessionsCard />
    </div>
  );
}
