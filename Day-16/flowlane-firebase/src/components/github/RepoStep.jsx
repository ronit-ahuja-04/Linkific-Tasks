import { Lock, Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import ErrorBox from './ErrorBox';

/** Step 2: search and pick a repository. */
export default function RepoStep({ search, onSearch, resource, onPick }) {
  const { t } = useLanguage();
  const { items, loading, error, hasMore, moreLoading, moreError, loadMore, retry } = resource;
  return (
    <div className="gh-step">
      <div className="gh-field">
        <label htmlFor="gh-repo-search">{t('github.repos.search.label')}</label>
        <input
          id="gh-repo-search"
          type="search"
          value={search}
          placeholder={t('github.repos.search.placeholder')}
          onChange={(e) => onSearch(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div aria-live="polite" aria-busy={loading}>
        {loading && <p className="gh-muted">{t('github.repos.loading')}</p>}
        {error && <ErrorBox error={error} onRetry={retry} />}
        {!loading && !error && items.length === 0 && (
          <p className="gh-muted">{search ? t('github.repos.emptySearch') : t('github.repos.empty')}</p>
        )}
      </div>
      {items.length > 0 && (
        <ul className="gh-list" aria-label={t('github.repos.list')}>
          {items.map((repo) => (
            <li key={repo.id}>
              <button type="button" className="gh-row gh-repo" onClick={() => onPick(repo.fullName)}>
                <span className="gh-row-main">
                  <strong>{repo.fullName}</strong>
                  <span className="gh-visibility">
                    {repo.private ? <Lock size={12} aria-hidden="true" /> : <Globe size={12} aria-hidden="true" />}
                    {repo.private ? t('github.repos.private') : t('github.repos.public')}
                  </span>
                </span>
                {repo.description && <span className="gh-muted gh-clamp">{repo.description}</span>}
                <span className="gh-muted">{t('github.repos.openIssues', { count: repo.openIssues })}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {moreError && <ErrorBox error={moreError} onRetry={loadMore} />}
      {hasMore && (
        <div className="gh-actions">
          <button type="button" className="gh-btn gh-btn-secondary" onClick={loadMore} disabled={moreLoading}>
            {moreLoading ? t('github.loadingMore') : t('github.loadMore')}
          </button>
        </div>
      )}
    </div>
  );
}
