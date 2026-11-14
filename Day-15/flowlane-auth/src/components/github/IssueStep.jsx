import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { isImported, labelColor } from '../../lib/github';
import ErrorBox from './ErrorBox';

/** Step 3: tick the issues to import. Already imported ones are ticked and disabled. */
export default function IssueStep({ repo, resource, imported, importing, onBack, onImport }) {
  const { t } = useLanguage();
  const { items, loading, error, hasMore, moreLoading, moreError, loadMore, retry } = resource;
  const [picked, setPicked] = useState(() => new Set());

  const selectable = items.filter((issue) => !isImported(issue, imported));
  const chosen = selectable.filter((issue) => picked.has(issue.id));
  const allChosen = selectable.length > 0 && chosen.length === selectable.length;

  const toggle = (id) =>
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () => setPicked(allChosen ? new Set() : new Set(selectable.map((issue) => issue.id)));

  return (
    <div className="gh-step">
      <div className="gh-toolbar">
        <span className="gh-muted">{t('github.issues.from', { repo })}</span>
        <button type="button" className="gh-link" onClick={onBack}>
          {t('github.issues.back')}
        </button>
      </div>
      <div aria-live="polite" aria-busy={loading}>
        {loading && <p className="gh-muted">{t('github.issues.loading')}</p>}
        {error && <ErrorBox error={error} onRetry={retry} />}
        {!loading && !error && items.length === 0 && <p className="gh-muted">{t('github.issues.empty')}</p>}
      </div>
      {items.length > 0 && (
        <>
          <label className="gh-check gh-select-all">
            <input
              type="checkbox"
              checked={allChosen}
              disabled={selectable.length === 0}
              ref={(el) => {
                if (el) el.indeterminate = chosen.length > 0 && !allChosen;
              }}
              onChange={toggleAll}
            />
            <span>{t('github.issues.selectAll')}</span>
          </label>
          <ul className="gh-list" aria-label={t('github.issues.list')}>
            {items.map((issue) => {
              const done = isImported(issue, imported);
              return (
                <li key={issue.id}>
                  <label className={`gh-row gh-check${done ? ' gh-row-disabled' : ''}`}>
                    <input
                      type="checkbox"
                      checked={done || picked.has(issue.id)}
                      disabled={done}
                      onChange={() => toggle(issue.id)}
                    />
                    <span className="gh-row-main-col">
                      <span className="gh-issue-title">
                        <span className="gh-number">#{issue.number}</span> {issue.title}
                      </span>
                      <span className="gh-meta">
                        {done && <span className="gh-imported">{t('github.issues.imported')}</span>}
                        {issue.labels.map((label) => (
                          <span className="gh-chip" key={label.name}>
                            <span className="gh-dot" style={{ background: labelColor(label.color) }} aria-hidden="true" />
                            {label.name}
                          </span>
                        ))}
                        {issue.comments > 0 && (
                          <span className="gh-muted gh-comments">
                            <MessageSquare size={12} aria-hidden="true" /> {t('github.issues.comments', { count: issue.comments })}
                          </span>
                        )}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {moreError && <ErrorBox error={moreError} onRetry={loadMore} />}
      {hasMore && (
        <div className="gh-actions">
          <button type="button" className="gh-btn gh-btn-secondary" onClick={loadMore} disabled={moreLoading}>
            {moreLoading ? t('github.loadingMore') : t('github.loadMore')}
          </button>
        </div>
      )}
      <div className="gh-actions gh-footer">
        <button
          type="button"
          className="gh-btn gh-btn-primary"
          disabled={chosen.length === 0 || importing}
          onClick={() => onImport(chosen)}
        >
          {importing
            ? t('github.issues.importing')
            : chosen.length === 1
              ? t('github.issues.import.one', { count: chosen.length })
              : t('github.issues.import.other', { count: chosen.length })}
        </button>
      </div>
    </div>
  );
}
