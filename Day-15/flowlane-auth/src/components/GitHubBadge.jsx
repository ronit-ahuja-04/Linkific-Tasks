import { useLanguage } from '../context/LanguageContext';
import { safeGithubUrl } from '../lib/github';
import '../styles/github.css';

const MARK = (
  <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false" fill="currentColor">
    <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.36-.93-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
  </svg>
);

/**
 * Small "#123" badge for tasks that came from a GitHub issue. A link to the issue when the stored
 * URL is a safe http(s) one; plain text otherwise. Clicking it must not open the task panel.
 */
export default function GitHubBadge({ source }) {
  const { t } = useLanguage();
  if (source?.type !== 'github') return null;
  const href = safeGithubUrl(source.url);
  const content = (
    <>
      {MARK}
      <span>#{source.number}</span>
    </>
  );
  if (!href) return <span className="gh-badge">{content}</span>;
  return (
    <a
      className="gh-badge"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('github.badge.aria', { number: source.number })}
      title={source.repo}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {content}
    </a>
  );
}
