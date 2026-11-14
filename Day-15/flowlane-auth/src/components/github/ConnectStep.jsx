import { useLanguage } from '../../context/LanguageContext';

/** Step 1: explain what we ask GitHub for, then open the GitHub popup. */
export default function ConnectStep({ reconnect, connecting, error, onConnect }) {
  const { t } = useLanguage();
  return (
    <div className="gh-step">
      <p>{reconnect ? t('github.connect.expired') : t('github.connect.body')}</p>
      <p className="gh-muted">{t('github.connect.requests')}</p>
      <ul className="gh-scopes">
        <li>{t('github.connect.scope.profile')}</li>
        <li>{t('github.connect.scope.email')}</li>
      </ul>
      <p className="gh-muted">{t('github.connect.memory')}</p>
      {error && (
        <p className="gh-error-text" role="alert">
          {t(`github.error.${error.code === 'credential_in_use' ? 'credential_in_use' : 'unknown'}`)}
        </p>
      )}
      <div className="gh-actions">
        <button type="button" className="gh-btn gh-btn-primary" onClick={onConnect} disabled={connecting}>
          {connecting ? t('github.connect.connecting') : reconnect ? t('github.connect.reconnect') : t('github.connect.button')}
        </button>
      </div>
    </div>
  );
}
