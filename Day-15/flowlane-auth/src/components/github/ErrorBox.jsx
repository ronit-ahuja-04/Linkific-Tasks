import { useLanguage } from '../../context/LanguageContext';
import { errorKeyFor } from './errors';

/** Friendly error with a Retry button. role="alert" so screen readers announce it. */
export default function ErrorBox({ error, onRetry }) {
  const { t } = useLanguage();
  return (
    <div className="gh-error" role="alert">
      <p>{t(`github.error.${errorKeyFor(error)}`)}</p>
      <button type="button" className="gh-btn gh-btn-secondary" onClick={onRetry}>
        {t('github.retry')}
      </button>
    </div>
  );
}
