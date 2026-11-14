import { api } from './client';

/**
 * Calls to our API. The server already returns the shapes below; we still normalise defensively so
 * a missing field never crashes the UI.
 */
const str = (value, fallback = '') => (typeof value === 'string' ? value : fallback);
const num = (value, fallback = 0) => (Number.isFinite(value) ? value : fallback);

export function normalizeRepo(raw) {
  return {
    id: raw.id,
    fullName: str(raw.fullName),
    private: Boolean(raw.private),
    description: str(raw.description),
    openIssues: num(raw.openIssues),
    updatedAt: str(raw.updatedAt),
    url: str(raw.url),
  };
}

export function normalizeIssue(raw) {
  return {
    id: raw.id,
    number: num(raw.number),
    title: str(raw.title, '(no title)'),
    body: str(raw.body),
    url: str(raw.url),
    state: str(raw.state, 'open'),
    labels: (Array.isArray(raw.labels) ? raw.labels : [])
      .filter((label) => label && label.name)
      .map((label) => ({ name: String(label.name), color: str(label.color).replace(/^#/, '') })),
    author: str(raw.author),
    comments: num(raw.comments),
    createdAt: str(raw.createdAt),
    updatedAt: str(raw.updatedAt),
  };
}

/** Who the server thinks we are (the claims it verified from our ID token) */
export const getMe = () => api.get('/me').then((res) => res.data);

/** `github: true` makes the client add the X-GitHub-Token header */
export const listRepos = ({ q, page = 1 } = {}) =>
  api.get('/github/repos', { params: { q: q || undefined, page }, github: true }).then((res) => ({
    repos: (res.data?.repos ?? []).map(normalizeRepo),
    hasMore: Boolean(res.data?.hasMore),
  }));

export const listIssues = ({ repo, state = 'open', page = 1 } = {}) =>
  api.get('/github/issues', { params: { repo, state, page }, github: true }).then((res) => ({
    issues: (res.data?.issues ?? []).map(normalizeIssue),
    hasMore: Boolean(res.data?.hasMore),
  }));
