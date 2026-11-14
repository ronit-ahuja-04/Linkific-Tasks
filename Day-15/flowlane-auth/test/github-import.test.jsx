// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const h = vi.hoisted(() => ({
  connect: null,
  connectError: null,
  repos: null,
  issues: null,
  calls: { repos: [], issues: [] },
}));
vi.mock('firebase/auth', async () => (await import('./mocks/auth.js')).authMock);
vi.mock('firebase/firestore', async () => (await import('./mocks/firestore.js')).firestoreMock);
vi.mock('../src/lib/firebase', () => ({ db: {}, auth: {}, githubProvider: {}, googleProvider: {}, isFirebaseConfigured: true }));
vi.mock('../src/context/AuthContext.jsx', () => ({ useAuth: () => ({ user: { uid: 'u1', providerIds: ['password'] } }) }));
// plain functions (not vi.fn) so a rejected promise is never reported as unhandled
vi.mock('../src/api/github', () => ({
  listRepos: (options) => { h.calls.repos.push(options); return h.repos(options); },
  listIssues: (options) => { h.calls.issues.push(options); return h.issues(options); },
}));
vi.mock('../src/context/GitHubContext.jsx', async () => {
  const { useSyncExternalStore } = await import('react');
  const store = await import('../src/lib/githubToken.js');
  return {
    useGitHub: () => {
      const connected = useSyncExternalStore(store.subscribeGithubToken, () => Boolean(store.getGithubToken()));
      return { connected, connecting: false, linked: false, githubLogin: null, error: h.connectError, connect: h.connect };
    },
  };
});

import { Provider } from 'react-redux';
import { firestoreMock as fs, resetFirestoreMock } from './mocks/firestore.js';
import { loadedStore } from './mocks/setup.js';
import ImportFromGitHub from '../src/components/ImportFromGitHub.jsx';
import { LanguageProvider } from '../src/context/LanguageContext.jsx';
import { ToastProvider } from '../src/context/ToastContext.jsx';
import { ApiError } from '../src/api/client.js';
import { boardReceived } from '../src/store/slices/boardSlice.js';
import { clearGithubToken, setGithubToken } from '../src/lib/githubToken.js';

const repo = (id, fullName, extra = {}) => ({ id, fullName, private: false, description: `About ${fullName}`, openIssues: 2, updatedAt: '', url: '', ...extra });
const issue = (n, extra = {}) => ({
  id: n, number: n, title: `Issue number ${n}`, body: `body ${n}`, url: `https://github.com/octo/hello/issues/${n}`, state: 'open',
  labels: [], author: 'me', comments: 0, createdAt: '2025-02-01T00:00:00Z', updatedAt: '', ...extra,
});
const ok = (value) => () => Promise.resolve(value);
const fail = (code) => () => Promise.reject(new ApiError({ status: 400, code, message: code }));

let store;
let user;
const renderImport = () => {
  store = loadedStore();
  return render(
    <Provider store={store}>
      <LanguageProvider>
        <ToastProvider>
          <ImportFromGitHub />
        </ToastProvider>
      </LanguageProvider>
    </Provider>
  );
};
const openModal = async () => {
  await user.click(screen.getByRole('button', { name: /import from github/i }));
  return screen.getByRole('dialog');
};
const goToIssues = async (name = 'octo/hello') => {
  await user.click(await screen.findByRole('button', { name: new RegExp(name) }));
};

beforeEach(() => {
  user = userEvent.setup();
  resetFirestoreMock();
  clearGithubToken();
  h.calls = { repos: [], issues: [] };
  h.connectError = null;
  h.connect = async () => { setGithubToken('gh-token'); return true; };
  h.repos = ok({ items: [], repos: [repo(1, 'octo/hello'), repo(2, 'octo/secret', { private: true })], hasMore: false });
  h.issues = ok({ issues: [issue(1), issue(2), issue(3)], hasMore: false });
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  clearGithubToken();
});

describe('step 1: connect', () => {
  it('opens a dialog that explains what is requested and does not call the API yet', async () => {
    renderImport();
    const dialog = await openModal();
    expect(within(dialog).getByText('Step 1 of 3')).toBeTruthy();
    expect(within(dialog).getByRole('heading', { name: 'Connect GitHub' })).toBeTruthy();
    expect(within(dialog).getByText(/read:user/)).toBeTruthy();
    expect(within(dialog).getByText(/user:email/)).toBeTruthy();
    expect(within(dialog).getByText(/only in this tab's memory/)).toBeTruthy();
    expect(h.calls.repos).toHaveLength(0);
  });

  it('moves the focus into the dialog and closes on Escape', async () => {
    renderImport();
    const dialog = await openModal();
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes with the X button', async () => {
    renderImport();
    await openModal();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('skips the connect step when a token is already in memory', async () => {
    setGithubToken('already');
    renderImport();
    await openModal();
    expect(await screen.findByText('Step 2 of 3')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Connect GitHub' })).toBeNull();
  });

  it('explains that GitHub sign-in is not enabled for the project when Firebase says operation-not-allowed', async () => {
    h.connect = async () => false;
    h.connectError = { code: 'provider_off', message: 'x' };
    renderImport();
    await openModal();
    await user.click(screen.getByRole('button', { name: 'Connect GitHub' }));
    expect(screen.getByRole('alert').textContent).toMatch(/GitHub sign-in is not turned on for this project yet/);
  });

  it('shows a friendly error when connecting fails', async () => {
    h.connect = async () => false;
    h.connectError = { code: 'credential_in_use', message: 'x' };
    renderImport();
    await openModal();
    await user.click(screen.getByRole('button', { name: 'Connect GitHub' }));
    expect(screen.getByRole('alert').textContent).toMatch(/already linked to another FlowLane user/);
    expect(screen.getByText('Step 1 of 3')).toBeTruthy();
  });

  it('shows a generic connect error for other codes', async () => {
    h.connectError = { code: 'unknown', message: 'x' };
    renderImport();
    await openModal();
    expect(screen.getByRole('alert').textContent).toMatch(/Could not connect to GitHub/);
  });
});

describe('step 2: repositories', () => {
  it('connect -> repository list with visibility as text', async () => {
    renderImport();
    await openModal();
    await user.click(screen.getByRole('button', { name: 'Connect GitHub' }));
    expect(await screen.findByText('Step 2 of 3')).toBeTruthy();
    const list = await screen.findByRole('list', { name: 'Repositories' });
    expect(within(list).getByText('octo/hello')).toBeTruthy();
    expect(within(list).getByText('Private')).toBeTruthy();
    expect(within(list).getByText('Public')).toBeTruthy();
    expect(h.calls.repos[0]).toEqual({ q: '', page: 1 });
  });

  it('shows a loading state, then an empty state', async () => {
    setGithubToken('t');
    let release;
    h.repos = () => new Promise((resolve) => { release = () => resolve({ items: [], hasMore: false, repos: [] }); });
    renderImport();
    await openModal();
    expect(screen.getByText('Loading repositories...')).toBeTruthy();
    release();
    expect(await screen.findByText('No repositories found.')).toBeTruthy();
  });

  it('searches with a 300 ms debounce (one request for the whole word)', async () => {
    setGithubToken('t');
    renderImport();
    await openModal();
    await screen.findByRole('list', { name: 'Repositories' });
    await user.type(screen.getByLabelText('Search repositories'), 'hel');
    await waitFor(() => expect(h.calls.repos.at(-1)).toEqual({ q: 'hel', page: 1 }));
    expect(h.calls.repos.filter((c) => c.q === 'h' || c.q === 'he')).toHaveLength(0);
  });

  it('shows the no-match message for an empty search result', async () => {
    setGithubToken('t');
    h.repos = (o) => Promise.resolve({ repos: o.q ? [] : [repo(1, 'octo/hello')], hasMore: false });
    renderImport();
    await openModal();
    await screen.findByRole('list', { name: 'Repositories' });
    await user.type(screen.getByLabelText('Search repositories'), 'zzz');
    expect(await screen.findByText('No repository matches your search.')).toBeTruthy();
  });

  it('Load more appends the next page', async () => {
    setGithubToken('t');
    h.repos = ({ page }) => Promise.resolve({ repos: page === 1 ? [repo(1, 'octo/one')] : [repo(2, 'octo/two')], hasMore: page === 1 });
    renderImport();
    await openModal();
    await user.click(await screen.findByRole('button', { name: 'Load more' }));
    expect(await screen.findByText('octo/two')).toBeTruthy();
    expect(screen.getByText('octo/one')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
    expect(h.calls.repos.at(-1).page).toBe(2);
  });

  it('shows an error with Retry, and Retry loads again', async () => {
    setGithubToken('t');
    let attempts = 0;
    h.repos = () => (++attempts === 1 ? fail('network_error')() : Promise.resolve({ repos: [repo(1, 'octo/hello')], hasMore: false }));
    renderImport();
    await openModal();
    expect((await screen.findByRole('alert')).textContent).toMatch(/Could not reach the server/);
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('octo/hello')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('maps rate limiting and unavailable errors to friendly messages', async () => {
    setGithubToken('t');
    h.repos = fail('github_rate_limited');
    renderImport();
    await openModal();
    expect((await screen.findByRole('alert')).textContent).toMatch(/rate limit/i);
  });

  it('keeps an error in Load more without losing the list', async () => {
    setGithubToken('t');
    h.repos = ({ page }) => (page === 1 ? Promise.resolve({ repos: [repo(1, 'octo/one')], hasMore: true }) : fail('github_unavailable')());
    renderImport();
    await openModal();
    await user.click(await screen.findByRole('button', { name: 'Load more' }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/not responding/);
    expect(screen.getByText('octo/one')).toBeTruthy();
  });
});

describe('step 3: issues and import', () => {
  const toIssues = async () => {
    setGithubToken('t');
    renderImport();
    await openModal();
    await goToIssues();
    await screen.findByRole('list', { name: 'Issues' });
  };

  it('lists issues for the chosen repository with labels as text chips', async () => {
    h.issues = ok({ issues: [issue(1, { labels: [{ name: 'bug', color: 'd73a4a' }, { name: 'help wanted', color: '008672' }], comments: 3 })], hasMore: false });
    await toIssues();
    expect(screen.getByText('Step 3 of 3')).toBeTruthy();
    expect(screen.getByText('Issues in octo/hello')).toBeTruthy();
    expect(h.calls.issues[0]).toEqual({ repo: 'octo/hello', page: 1 });
    expect(screen.getByText('bug')).toBeTruthy();
    expect(screen.getByText('help wanted')).toBeTruthy();
    expect(screen.getByText('3 comments')).toBeTruthy();
  });

  it('the import button counts the ticked issues; select all ticks everything importable', async () => {
    await toIssues();
    const button = screen.getByRole('button', { name: /^Import \d+ issues?$/ });
    expect(button.textContent).toBe('Import 0 issues');
    expect(button.disabled).toBe(true);
    await user.click(screen.getByRole('checkbox', { name: /Issue number 2/ }));
    expect(screen.getByRole('button', { name: 'Import 1 issue' }).disabled).toBe(false);
    await user.click(screen.getByRole('checkbox', { name: 'Select all' }));
    expect(screen.getByRole('button', { name: 'Import 3 issues' })).toBeTruthy();
    await user.click(screen.getByRole('checkbox', { name: 'Select all' }));
    expect(screen.getByRole('button', { name: 'Import 0 issues' }).disabled).toBe(true);
  });

  it('imports the selected issues with ONE write, shows a success toast and closes', async () => {
    await toIssues();
    await user.click(screen.getByRole('checkbox', { name: /Issue number 1/ }));
    await user.click(screen.getByRole('checkbox', { name: /Issue number 3/ }));
    await user.click(screen.getByRole('button', { name: 'Import 2 issues' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(fs.updateDoc).toHaveBeenCalledTimes(1);
    const payload = fs.updateDoc.mock.calls[0][1];
    const taskKeys = Object.keys(payload).filter((k) => k.startsWith('tasks.'));
    expect(taskKeys).toHaveLength(2);
    expect(payload[taskKeys[0]]).toMatchObject({ content: 'Issue number 1', source: { type: 'github', repo: 'octo/hello', number: 1 } });
    expect(store.getState().board.columns.todo.taskIds).toHaveLength(4);
    expect(screen.getByText('Imported 2 issues from octo/hello')).toBeTruthy();
  });

  it('uses the singular in the toast for one issue', async () => {
    await toIssues();
    await user.click(screen.getByRole('checkbox', { name: /Issue number 2/ }));
    await user.click(screen.getByRole('button', { name: 'Import 1 issue' }));
    expect(await screen.findByText('Imported 1 issue from octo/hello')).toBeTruthy();
  });

  it('shows already imported issues ticked and disabled, and does not count them', async () => {
    setGithubToken('t');
    renderImport();
    const board = store.getState().board;
    store.dispatch(boardReceived({
      projectId: 'p1', columns: board.columns, columnOrder: board.columnOrder,
      tasks: { ...board.tasks, gh: { id: 'gh', content: 'x', users: [], source: { type: 'github', url: issue(2).url, number: 2, repo: 'octo/hello' } } },
    }));
    await openModal();
    await goToIssues();
    await screen.findByRole('list', { name: 'Issues' });
    const done = screen.getByRole('checkbox', { name: /Issue number 2/ });
    expect(done.checked).toBe(true);
    expect(done.disabled).toBe(true);
    expect(screen.getByText('Already imported')).toBeTruthy();
    await user.click(screen.getByRole('checkbox', { name: 'Select all' }));
    expect(screen.getByRole('button', { name: 'Import 2 issues' })).toBeTruthy();
  });

  it('disables select all when everything is already imported', async () => {
    setGithubToken('t');
    h.issues = ok({ issues: [issue(1)], hasMore: false });
    renderImport();
    const board = store.getState().board;
    store.dispatch(boardReceived({
      projectId: 'p1', columns: board.columns, columnOrder: board.columnOrder,
      tasks: { ...board.tasks, gh: { id: 'gh', content: 'x', users: [], source: { type: 'github', url: issue(1).url, number: 1, repo: 'octo/hello' } } },
    }));
    await openModal();
    await goToIssues();
    await screen.findByRole('list', { name: 'Issues' });
    expect(screen.getByRole('checkbox', { name: 'Select all' }).disabled).toBe(true);
  });

  it('shows an empty state for a repository without issues', async () => {
    h.issues = ok({ issues: [], hasMore: false });
    setGithubToken('t');
    renderImport();
    await openModal();
    await goToIssues();
    expect(await screen.findByText('This repository has no open issues.')).toBeTruthy();
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('Load more appends issues and keeps the selection', async () => {
    h.issues = ({ page }) => Promise.resolve({ issues: page === 1 ? [issue(1)] : [issue(2)], hasMore: page === 1 });
    setGithubToken('t');
    renderImport();
    await openModal();
    await goToIssues();
    await user.click(await screen.findByRole('checkbox', { name: /Issue number 1/ }));
    await user.click(screen.getByRole('button', { name: 'Load more' }));
    expect(await screen.findByRole('checkbox', { name: /Issue number 2/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Import 1 issue' })).toBeTruthy();
  });

  it('shows repo_not_found with Retry', async () => {
    h.issues = fail('repo_not_found');
    setGithubToken('t');
    renderImport();
    await openModal();
    await goToIssues();
    expect((await screen.findByRole('alert')).textContent).toMatch(/not found, or you do not have access/);
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  });

  it('"Change repository" goes back to step 2', async () => {
    await toIssues();
    await user.click(screen.getByRole('button', { name: 'Change repository' }));
    expect(screen.getByText('Step 2 of 3')).toBeTruthy();
    expect(await screen.findByRole('list', { name: 'Repositories' })).toBeTruthy();
  });

  it('keeps the dialog open and tells the user when the import fails', async () => {
    fs.updateDoc.mockRejectedValueOnce(new Error('permission-denied'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await toIssues();
    await user.click(screen.getByRole('checkbox', { name: /Issue number 1/ }));
    await user.click(screen.getByRole('button', { name: 'Import 1 issue' }));
    expect(await screen.findByText('Could not import the issues. Nothing was changed.')).toBeTruthy();
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(store.getState().board.columns.todo.taskIds).toEqual(['t1', 't2']); // rolled back
    expect(screen.getByRole('button', { name: 'Import 1 issue' }).disabled).toBe(false); // can try again
  });
});

describe('token rejected by GitHub', () => {
  it('goes back to Connect with a "Reconnect GitHub" button, and reloads after reconnecting', async () => {
    setGithubToken('stale');
    let first = true;
    // like the real client: github_token_invalid clears the in-memory token before the error arrives
    h.repos = () => {
      if (first) {
        first = false;
        clearGithubToken();
        return fail('github_token_invalid')();
      }
      return Promise.resolve({ repos: [repo(1, 'octo/hello')], hasMore: false });
    };
    renderImport();
    await openModal();
    expect(await screen.findByText(/no longer accepts your saved access/)).toBeTruthy();
    expect(screen.getByText('Step 1 of 3')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Reconnect GitHub' }));
    expect(await screen.findByText('octo/hello')).toBeTruthy();
    expect(screen.getByText('Step 2 of 3')).toBeTruthy();
  });

  it('also handles it in the middle of the issue step', async () => {
    setGithubToken('stale');
    h.issues = () => {
      clearGithubToken();
      return fail('github_token_invalid')();
    };
    renderImport();
    await openModal();
    await goToIssues();
    expect(await screen.findByRole('button', { name: 'Reconnect GitHub' })).toBeTruthy();
  });
});
