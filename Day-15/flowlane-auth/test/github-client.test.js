import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';

const fb = vi.hoisted(() => ({ auth: { currentUser: null } }));
vi.mock('../src/lib/firebase', () => ({ auth: fb.auth, db: {}, githubProvider: {}, isFirebaseConfigured: true }));

import { api, ApiError, resetClientState, setAuthFailureHandler, toApiError } from '../src/api/client.js';
import { clearGithubToken, getGithubToken, setGithubToken } from '../src/lib/githubToken.js';

// A hand-written axios adapter: the "network". `route(config, call)` returns { status, data } or throws.
let route;
let calls;
const adapter = async (config) => {
  calls.push({ url: config.url, headers: config.headers.toJSON(), retried: config._retried });
  const out = await route(config, calls.length);
  const response = { data: out.data ?? {}, status: out.status ?? 200, statusText: '', headers: {}, config };
  if (response.status >= 200 && response.status < 300) return response;
  throw new axios.AxiosError(`HTTP ${response.status}`, 'ERR_BAD_REQUEST', config, null, response);
};

const body = (code, message = code, extra = {}) => ({ error: { code, message, ...extra } });
const bearer = (call) => call.headers.Authorization;

// The Firebase user: getIdToken() gives the cached token, getIdToken(true) a fresh one
let tokenValue;
let getIdToken;
const user = { getIdToken: (force) => getIdToken(force) };

beforeEach(() => {
  calls = [];
  tokenValue = 'old';
  getIdToken = vi.fn(async (force) => {
    if (force) tokenValue = 'new';
    return tokenValue;
  });
  fb.auth.currentUser = user;
  api.defaults.adapter = adapter;
  resetClientState();
  clearGithubToken();
});
afterEach(() => {
  clearGithubToken();
  vi.restoreAllMocks();
});

describe('request interceptor', () => {
  it('attaches the ID token as a Bearer header', async () => {
    route = () => ({ data: { ok: true } });
    const res = await api.get('/me');
    expect(res.data).toEqual({ ok: true });
    expect(bearer(calls[0])).toBe('Bearer old');
  });

  it('does not send the GitHub header unless the request asks for it', async () => {
    setGithubToken('gh-secret');
    route = () => ({});
    await api.get('/me');
    expect(calls[0].headers['X-GitHub-Token']).toBeUndefined();
  });

  it('sends the GitHub token when config.github is true', async () => {
    setGithubToken('gh-secret');
    route = () => ({});
    await api.get('/github/repos', { github: true });
    expect(calls[0].headers['X-GitHub-Token']).toBe('gh-secret');
    expect(bearer(calls[0])).toBe('Bearer old');
  });

  it('omits the GitHub header when we hold no GitHub token', async () => {
    route = () => ({});
    await api.get('/github/repos', { github: true });
    expect(calls[0].headers['X-GitHub-Token']).toBeUndefined();
  });

  it('rejects with unauthorized (and never calls the network) when nobody is signed in', async () => {
    fb.auth.currentUser = null;
    const handler = vi.fn();
    setAuthFailureHandler(handler);
    route = () => ({});
    await expect(api.get('/me')).rejects.toMatchObject({ name: 'ApiError', status: 401, code: 'unauthorized' });
    expect(calls).toHaveLength(0);
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('401 handling: refresh once, retry once', () => {
  it.each(['token_expired', 'unauthorized'])('on %s asks for a new ID token and retries with it', async (code) => {
    route = (config) =>
      config.headers.get('Authorization') === 'Bearer old' ? { status: 401, data: body(code) } : { data: { uid: 'u1' } };
    const res = await api.get('/me');
    expect(res.data).toEqual({ uid: 'u1' });
    expect(getIdToken).toHaveBeenCalledWith(true);
    expect(getIdToken.mock.calls.filter(([force]) => force)).toHaveLength(1);
    expect(calls).toHaveLength(2);
    expect(bearer(calls[1])).toBe('Bearer new');
  });

  it('parallel 401s share ONE refresh and all retry', async () => {
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    getIdToken = vi.fn(async (force) => {
      if (force) {
        await gate;
        tokenValue = 'new';
      }
      return tokenValue;
    });
    route = (config) =>
      config.headers.get('Authorization') === 'Bearer old' ? { status: 401, data: body('token_expired') } : { data: { ok: 1 } };
    const all = Promise.all([api.get('/a'), api.get('/b'), api.get('/c')]);
    await new Promise((r) => setTimeout(r, 20)); // all three have failed and are waiting on the same refresh
    release();
    const results = await all;
    expect(results.map((r) => r.data)).toEqual([{ ok: 1 }, { ok: 1 }, { ok: 1 }]);
    expect(getIdToken.mock.calls.filter(([force]) => force)).toHaveLength(1);
    expect(calls).toHaveLength(6);
  });

  it('when the refresh fails, calls the failure handler ONCE (even with parallel requests) and rejects', async () => {
    const handler = vi.fn();
    setAuthFailureHandler(handler);
    getIdToken = vi.fn(async (force) => {
      if (force) throw new Error('auth/user-token-expired');
      return 'old';
    });
    route = () => ({ status: 401, data: body('token_expired') });
    const results = await Promise.allSettled([api.get('/a'), api.get('/b')]);
    expect(results.every((r) => r.status === 'rejected' && r.reason.code === 'token_expired')).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('never retries twice: a second 401 reaches the failure handler', async () => {
    const handler = vi.fn();
    setAuthFailureHandler(handler);
    route = () => ({ status: 401, data: body('unauthorized') });
    await expect(api.get('/me')).rejects.toMatchObject({ status: 401, code: 'unauthorized' });
    expect(calls).toHaveLength(2); // original + exactly one retry
    expect(calls[1].retried).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('a later success re-arms the failure handler', async () => {
    const handler = vi.fn();
    setAuthFailureHandler(handler);
    route = () => ({ status: 401, data: body('unauthorized') });
    await expect(api.get('/me')).rejects.toBeInstanceOf(ApiError);
    route = () => ({});
    await api.get('/me');
    route = () => ({ status: 401, data: body('unauthorized') });
    await expect(api.get('/me')).rejects.toBeInstanceOf(ApiError);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('does not refresh for other 401 codes', async () => {
    route = () => ({ status: 401, data: body('github_token_missing') });
    await expect(api.get('/github/repos', { github: true })).rejects.toMatchObject({ code: 'github_token_missing' });
    expect(getIdToken).not.toHaveBeenCalledWith(true);
    expect(calls).toHaveLength(1);
  });

  it('survives a handler that throws', async () => {
    setAuthFailureHandler(() => { throw new Error('boom'); });
    route = () => ({ status: 401, data: body('unauthorized') });
    await expect(api.get('/me')).rejects.toMatchObject({ code: 'unauthorized' });
  });

  it('ignores a handler that is not a function', async () => {
    setAuthFailureHandler('nope');
    route = () => ({ status: 401, data: body('unauthorized') });
    await expect(api.get('/me')).rejects.toMatchObject({ code: 'unauthorized' });
  });
});

describe('GitHub token problems', () => {
  it('github_token_invalid clears the in-memory token and rejects without refreshing', async () => {
    setGithubToken('stale');
    route = () => ({ status: 401, data: body('github_token_invalid') });
    await expect(api.get('/github/repos', { github: true })).rejects.toMatchObject({
      name: 'ApiError', status: 401, code: 'github_token_invalid',
    });
    expect(getGithubToken()).toBeNull();
    expect(getIdToken).not.toHaveBeenCalledWith(true);
    expect(calls).toHaveLength(1);
  });
});

describe('error normalisation', () => {
  it('turns a network failure into network_error', async () => {
    route = () => { throw new axios.AxiosError('Network Error', 'ERR_NETWORK'); };
    await expect(api.get('/me')).rejects.toMatchObject({ name: 'ApiError', status: 0, code: 'network_error' });
  });

  it('keeps status, code, message and extra details of the server error body', async () => {
    route = () => ({ status: 429, data: body('github_rate_limited', 'Slow down', { resetAt: 123 }) });
    const err = await api.get('/github/issues', { github: true }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 429, code: 'github_rate_limited', message: 'Slow down', details: { resetAt: 123 } });
  });

  it('falls back to http_<status> when the body has no error shape', async () => {
    route = () => ({ status: 500, data: '<html>oops</html>' });
    await expect(api.get('/me')).rejects.toMatchObject({ status: 500, code: 'http_500' });
  });

  it('toApiError returns an ApiError unchanged and defaults 401 to unauthorized', () => {
    const e = new ApiError({ code: 'x' });
    expect(toApiError(e)).toBe(e);
    expect(toApiError({ response: { status: 401, data: null }, message: 'm' }).code).toBe('unauthorized');
  });

  it('rethrows cancellations untouched', async () => {
    route = () => { throw new axios.CanceledError('cancelled'); };
    await expect(api.get('/me')).rejects.toBeInstanceOf(axios.CanceledError);
  });

  it('the ApiError defaults are sensible', () => {
    expect(new ApiError()).toMatchObject({ status: 0, code: 'unknown', name: 'ApiError' });
  });
});
