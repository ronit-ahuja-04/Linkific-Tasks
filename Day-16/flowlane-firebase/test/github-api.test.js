import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.hoisted(() => vi.fn());
const failing = vi.hoisted(() => ({ error: null }));
// (a plain wrapper: vitest reports a vi.fn that returns a rejected promise as an unhandled rejection)
vi.mock('../src/api/client', () => ({ api: { get: (...args) => (failing.error ? Promise.reject(failing.error) : get(...args)) } }));

import { getMe, listIssues, listRepos, normalizeIssue, normalizeRepo } from '../src/api/github.js';

beforeEach(() => {
  get.mockReset();
  failing.error = null;
});

describe('src/api/github', () => {
  it('getMe calls GET /me and returns the body', async () => {
    get.mockResolvedValue({ data: { uid: 'u1' } });
    await expect(getMe()).resolves.toEqual({ uid: 'u1' });
    expect(get).toHaveBeenCalledWith('/me');
  });

  it('listRepos sends q and page with github:true and maps the repos', async () => {
    get.mockResolvedValue({
      data: { repos: [{ id: 1, fullName: 'a/b', private: 1, description: null, openIssues: 3, updatedAt: 'x', url: 'u' }], hasMore: true },
    });
    const out = await listRepos({ q: 'b', page: 2 });
    expect(get).toHaveBeenCalledWith('/github/repos', { params: { q: 'b', page: 2 }, github: true });
    expect(out).toEqual({
      repos: [{ id: 1, fullName: 'a/b', private: true, description: '', openIssues: 3, updatedAt: 'x', url: 'u' }],
      hasMore: true,
    });
  });

  it('listRepos defaults: page 1 and no empty q', async () => {
    get.mockResolvedValue({ data: {} });
    const out = await listRepos();
    expect(get).toHaveBeenCalledWith('/github/repos', { params: { q: undefined, page: 1 }, github: true });
    expect(out).toEqual({ repos: [], hasMore: false });
  });

  it('listIssues sends repo, state and page and maps issues', async () => {
    get.mockResolvedValue({
      data: {
        issues: [{ id: 9, number: 4, title: 'Bug', body: null, url: 'https://x/4', state: 'open', labels: [{ name: 'bug', color: '#d73a4a' }, null, { color: 'fff' }], author: 'me', comments: 2, createdAt: 'c', updatedAt: 'u' }],
        hasMore: false,
      },
    });
    const out = await listIssues({ repo: 'o/r' });
    expect(get).toHaveBeenCalledWith('/github/issues', { params: { repo: 'o/r', state: 'open', page: 1 }, github: true });
    expect(out.issues[0]).toMatchObject({ id: 9, number: 4, body: '', labels: [{ name: 'bug', color: 'd73a4a' }], comments: 2 });
    expect(out.hasMore).toBe(false);
  });

  it('propagates API errors', async () => {
    const failure = Object.assign(new Error('x'), { code: 'repo_not_found' });
    failing.error = failure;
    await expect(listIssues({ repo: 'o/r' })).rejects.toBe(failure);
  });

  it('normalisers survive missing fields', () => {
    expect(normalizeRepo({ id: 1 })).toMatchObject({ fullName: '', private: false, openIssues: 0 });
    expect(normalizeIssue({ id: 1 })).toMatchObject({ title: '(no title)', labels: [], comments: 0, state: 'open' });
  });
});
