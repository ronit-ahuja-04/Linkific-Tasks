import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Download } from 'lucide-react';
import Modal from './Modal';
import ConnectStep from './github/ConnectStep';
import RepoStep from './github/RepoStep';
import IssueStep from './github/IssueStep';
import { useDebouncedValue } from './github/useDebouncedValue';
import { usePagedResource } from './github/usePagedResource';
import { needsReconnect } from './github/errors';
import { listIssues, listRepos } from '../api/github';
import { useAuth } from '../context/AuthContext';
import { useGitHub } from '../context/GitHubContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { importedUrls, issueToTask } from '../lib/github';
import { importTasks, selectBoard } from '../store/slices/boardSlice';
import '../styles/github.css';

/**
 * The wizard inside the modal. Three steps, all DERIVED from state (no "step" variable to keep in sync):
 *   1. connect   we hold no GitHub token in memory yet
 *   2. repos     connected, no repository chosen
 *   3. issues    a repository is chosen
 * The two lists live here (not in the steps) so that if GitHub rejects the token in the middle of
 * step 3, the wizard can go back to step 1 and say "reconnect" instead of losing the error.
 */
function Wizard({ onClose }) {
  const { t } = useLanguage();
  const toast = useToast();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { connected, connecting, error: connectError, connect } = useGitHub();
  const board = useSelector(selectBoard);

  const [search, setSearch] = useState('');
  const query = useDebouncedValue(search.trim(), 300);
  const [repo, setRepo] = useState(null);
  const [importing, setImporting] = useState(false);

  const loadRepos = useCallback(
    (page) => listRepos({ q: query, page }).then((r) => ({ items: r.repos, hasMore: r.hasMore })),
    [query]
  );
  const loadIssues = useCallback(
    (page) => listIssues({ repo, page }).then((r) => ({ items: r.issues, hasMore: r.hasMore })),
    [repo]
  );
  const repos = usePagedResource({ enabled: connected, load: loadRepos });
  const issues = usePagedResource({ enabled: connected && Boolean(repo), load: loadIssues });

  const step = !connected ? 'connect' : !repo ? 'repos' : 'issues';
  const stepNumber = { connect: 1, repos: 2, issues: 3 }[step];
  const reconnect = !connected && (needsReconnect(repos.error) || needsReconnect(issues.error));

  // Move keyboard focus to the step heading whenever the step changes, and close on Escape
  const headingRef = useRef(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleConnect = async () => {
    const ok = await connect();
    if (ok) {
      repos.retry(); // reload with the fresh token (clears an old "token rejected" error)
      issues.retry();
    }
  };

  const handleImport = async (chosen) => {
    setImporting(true);
    try {
      const tasks = chosen.map((issue) => issueToTask(issue, { repo, uid: user?.uid }));
      const count = await dispatch(importTasks({ tasks, repo })).unwrap();
      toast.success(count === 1 ? t('github.import.success.one', { repo }) : t('github.import.success.other', { count, repo }));
      onClose();
    } catch {
      toast.error(t('github.import.failed'));
      setImporting(false);
    }
  };

  const heading = {
    connect: t('github.step.connect'),
    repos: t('github.step.repos'),
    issues: t('github.step.issues'),
  }[step];

  return (
    <div className="gh-import">
      <p className="gh-steps">{t('github.step.of', { step: stepNumber, total: 3 })}</p>
      <h4 className="gh-heading" ref={headingRef} tabIndex={-1}>
        {heading}
      </h4>
      {step === 'connect' && (
        <ConnectStep reconnect={reconnect} connecting={connecting} error={connectError} onConnect={handleConnect} />
      )}
      {step === 'repos' && <RepoStep search={search} onSearch={setSearch} resource={repos} onPick={setRepo} />}
      {step === 'issues' && (
        <IssueStep
          key={repo}
          repo={repo}
          resource={issues}
          imported={importedUrls(board.tasks)}
          importing={importing}
          onBack={() => setRepo(null)}
          onImport={handleImport}
        />
      )}
    </div>
  );
}

/** The "Import from GitHub" button for the project header, plus its modal. */
export default function ImportFromGitHub() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button type="button" className="gh-open-btn" onClick={() => setOpen(true)}>
        <Download size={16} aria-hidden="true" /> {t('github.button')}
      </button>
      {/* The Modal renders nothing when closed, so the wizard (and its state) starts fresh every time */}
      <Modal isOpen={open} onClose={close} title={t('github.modal.title')}>
        <Wizard onClose={close} />
      </Modal>
    </>
  );
}
