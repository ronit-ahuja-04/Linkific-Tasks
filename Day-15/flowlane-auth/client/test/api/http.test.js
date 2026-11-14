// @vitest-environment jsdom
import { AxiosError } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, getAccessToken, http, refreshAccessToken, setAccessToken, setAuthFailureHandler, toApiError } from '../../src/api/http';

/** Hand-written axios adapter: `routes(config, calls)` returns { status, data } or throws 'network' */
let calls;
let routes;
const originalAdapter = http.defaults.adapter;

function respond(config, { status = 200, data = {} }) {
  const response = { data, status, statusText: String(status), headers: {}, config, request: {} };
  if (status >= 400) {
    return Promise.reject(new AxiosError(`Request failed with status code ${status}`, 'ERR_BAD_REQUEST', config, {}, response));
  }
  return Promise.resolve(response);
}

beforeEach(() => {
  calls = [];
  routes = () => ({ status: 200, data: {} });
  http.defaults.adapter = (config) => {
    calls.push({ method: config.method, url: config.url, auth: config.headers.get('Authorization'), xrw: config.headers.get('X-Requested-With') });
    const result = routes(config, calls);
    if (result === 'network') return Promise.reject(new AxiosError('Network Error', 'ERR_NETWORK', config, {}));
    return respond(config, result);
  };
  setAccessToken(null);
  setAuthFailureHandler(null);
});
afterEach(() => {
  http.defaults.adapter = originalAdapter;
  setAccessToken(null);
  setAuthFailureHandler(null);
});

const err = (status, code, extra = {}) => ({ status, data: { error: { code, message: `msg ${code}`, ...extra } } });
const refreshOk = (token = 'new-token') => ({ status: 200, data: { user: { id: 'u1' }, accessToken: token, expiresIn: 900 } });

describe('instance defaults and token handling', () => {
  it('is configured for the same-origin API with cookies and the CSRF header', () => {
    expect(http.defaults.baseURL).toBe('/api');
    expect(http.defaults.withCredentials).toBe(true);
    expect(http.defaults.headers['X-Requested-With']).toBe('fetch');
  });
  it('stores the token in memory only and clears it with null or empty', () => {
    setAccessToken('abc');
    expect(getAccessToken()).toBe('abc');
    expect(localStorage.length).toBe(0);
    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
    setAccessToken('');
    expect(getAccessToken()).toBeNull();
  });
  it('attaches the Bearer token when there is one', async () => {
    setAccessToken('tok');
    await http.get('/projects');
    expect(calls[0].auth).toBe('Bearer tok');
  });
  it('sends no Authorization header without a token', async () => {
    await http.get('/auth/providers');
    expect(calls[0].auth).toBeFalsy();
  });
  it('sends the X-Requested-With header', async () => {
    await http.get('/projects');
    expect(calls[0].xrw).toBe('fetch');
  });
  it('passes successful responses through untouched', async () => {
    routes = () => ({ data: { projects: [] } });
    expect((await http.get('/projects')).data).toEqual({ projects: [] });
  });
});

describe('ApiError mapping', () => {
  it('maps the server error shape including fields', async () => {
    routes = () => err(400, 'validation_failed', { fields: { email: 'Bad email' } });
    const error = await http.post('/auth/register', {}).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, code: 'validation_failed', message: 'msg validation_failed', fields: { email: 'Bad email' } });
  });
  it('maps a network failure to network_error', async () => {
    routes = () => 'network';
    const error = await http.get('/projects').catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0, code: 'network_error', message: 'Cannot reach the server. Check your connection.' });
  });
  it('falls back to a generic code for non-standard error bodies', () => {
    const error = toApiError(new AxiosError('x', 'ERR_BAD_RESPONSE', {}, {}, { status: 502, data: '<html>' }));
    expect(error).toMatchObject({ status: 502, code: 'http_502' });
    expect(error.message).toBeTruthy();
  });
  it('toApiError is idempotent and wraps unknown errors', () => {
    const original = new ApiError({ status: 409, code: 'email_taken', message: 'm' });
    expect(toApiError(original)).toBe(original);
    expect(toApiError(new Error('boom'))).toMatchObject({ code: 'unknown', message: 'boom' });
  });
  it('is an Error with a name', () => {
    const e = new ApiError({ status: 1, code: 'c', message: 'm' });
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('ApiError');
  });
});

describe('refresh and retry', () => {
  it('refreshes once on token_expired and retries the original with the new token', async () => {
    setAccessToken('old');
    routes = (config) => {
      if (config.url === '/auth/refresh') return refreshOk('fresh');
      return config.headers.get('Authorization') === 'Bearer fresh' ? { data: { projects: ['p'] } } : err(401, 'token_expired');
    };
    const response = await http.get('/projects');
    expect(response.data).toEqual({ projects: ['p'] });
    expect(calls.map((c) => c.url)).toEqual(['/projects', '/auth/refresh', '/projects']);
    expect(calls[2].auth).toBe('Bearer fresh');
    expect(getAccessToken()).toBe('fresh');
  });
  it('the refresh call is a POST with credentials headers and no Bearer', async () => {
    setAccessToken('old');
    routes = (config) => (config.url === '/auth/refresh' ? refreshOk() : config.headers.get('Authorization') === 'Bearer new-token' ? {} : err(401, 'token_expired'));
    await http.get('/projects');
    expect(calls[1]).toMatchObject({ method: 'post', url: '/auth/refresh', xrw: 'fetch' });
    expect(calls[1].auth).toBeFalsy();
  });
  it('retries on unauthorized when a token was sent', async () => {
    setAccessToken('old');
    routes = (config) => (config.url === '/auth/refresh' ? refreshOk() : config.headers.get('Authorization') === 'Bearer new-token' ? {} : err(401, 'unauthorized'));
    await http.get('/projects');
    expect(calls.filter((c) => c.url === '/auth/refresh')).toHaveLength(1);
  });
  it('does not refresh on unauthorized when no token was sent', async () => {
    routes = () => err(401, 'unauthorized');
    const error = await http.get('/projects').catch((e) => e);
    expect(error.code).toBe('unauthorized');
    expect(calls).toHaveLength(1);
  });
  it('does not refresh for other errors (403, 404, 500)', async () => {
    setAccessToken('t');
    for (const [status, code] of [[403, 'forbidden'], [404, 'not_found'], [500, 'boom']]) {
      routes = () => err(status, code);
      await http.get('/projects').catch(() => {});
    }
    expect(calls.every((c) => c.url !== '/auth/refresh')).toBe(true);
  });
  it('shares ONE refresh between two parallel 401s', async () => {
    setAccessToken('old');
    routes = (config) => {
      if (config.url === '/auth/refresh') return refreshOk('fresh');
      return config.headers.get('Authorization') === 'Bearer fresh' ? { data: { ok: config.url } } : err(401, 'token_expired');
    };
    const [a, b] = await Promise.all([http.get('/projects'), http.get('/projects/p1/tasks')]);
    expect(a.data.ok).toBe('/projects');
    expect(b.data.ok).toBe('/projects/p1/tasks');
    expect(calls.filter((c) => c.url === '/auth/refresh')).toHaveLength(1);
  });
  it('refreshAccessToken is single-flight and resolves the auth result', async () => {
    routes = () => refreshOk('shared');
    const [a, b] = await Promise.all([refreshAccessToken(), refreshAccessToken()]);
    expect(a).toBe(b);
    expect(a.accessToken).toBe('shared');
    expect(calls).toHaveLength(1);
    expect(getAccessToken()).toBe('shared');
    await refreshAccessToken(); // the flight ended, so a new call makes a new request
    expect(calls).toHaveLength(2);
  });
  it('on refresh failure: handler called once, original rejected, token cleared', async () => {
    const handler = vi.fn();
    setAuthFailureHandler(handler);
    setAccessToken('old');
    routes = (config) => (config.url === '/auth/refresh' ? err(401, 'refresh_invalid') : err(401, 'token_expired'));
    const error = await http.get('/projects').catch((e) => e);
    expect(error).toMatchObject({ status: 401, code: 'token_expired' });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith('expired');
    expect(getAccessToken()).toBeNull();
  });
  it('parallel requests sharing one failed refresh call the handler once', async () => {
    const handler = vi.fn();
    setAuthFailureHandler(handler);
    setAccessToken('old');
    routes = (config) => (config.url === '/auth/refresh' ? err(401, 'refresh_invalid') : err(401, 'token_expired'));
    const results = await Promise.allSettled([http.get('/projects'), http.get('/projects/x/tasks'), http.get('/auth/me')]);
    expect(results.every((r) => r.status === 'rejected')).toBe(true);
    expect(calls.filter((c) => c.url === '/auth/refresh')).toHaveLength(1);
    expect(handler).toHaveBeenCalledTimes(1);
  });
  it('a second failed refresh later reports again', async () => {
    const handler = vi.fn();
    setAuthFailureHandler(handler);
    routes = (config) => (config.url === '/auth/refresh' ? err(401, 'refresh_invalid') : err(401, 'token_expired'));
    await http.get('/projects').catch(() => {});
    await http.get('/projects').catch(() => {});
    expect(handler).toHaveBeenCalledTimes(2);
  });
  it('refresh network failure also logs out and rejects the original', async () => {
    const handler = vi.fn();
    setAuthFailureHandler(handler);
    routes = (config) => (config.url === '/auth/refresh' ? 'network' : err(401, 'token_expired'));
    const error = await http.get('/projects').catch((e) => e);
    expect(error.code).toBe('token_expired');
    expect(handler).toHaveBeenCalledTimes(1);
  });
  it('refreshAccessToken rejects with an ApiError and clears the token', async () => {
    setAccessToken('old');
    routes = () => err(401, 'refresh_invalid');
    const error = await refreshAccessToken().catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe('refresh_invalid');
    expect(getAccessToken()).toBeNull();
  });
  it('retries only once: a second 401 after refresh is rejected without another refresh', async () => {
    setAccessToken('old');
    routes = (config) => (config.url === '/auth/refresh' ? refreshOk() : err(401, 'token_expired'));
    const error = await http.get('/projects').catch((e) => e);
    expect(error.code).toBe('token_expired');
    expect(calls.map((c) => c.url)).toEqual(['/projects', '/auth/refresh', '/projects']);
  });
  it('works without a failure handler registered', async () => {
    routes = (config) => (config.url === '/auth/refresh' ? err(401, 'refresh_invalid') : err(401, 'token_expired'));
    await expect(http.get('/projects')).rejects.toMatchObject({ code: 'token_expired' });
  });
});

describe('/auth/* URLs', () => {
  it.each([
    ['post', '/auth/login'],
    ['post', '/auth/register'],
    ['post', '/auth/refresh'],
    ['post', '/auth/logout'],
    ['post', '/auth/forgot-password'],
    ['post', '/auth/reset-password'],
    ['post', '/auth/verify-email'],
  ])('never retries %s %s', async (method, url) => {
    setAccessToken('tok');
    routes = () => err(401, 'token_expired');
    const error = await http[method](url, {}).catch((e) => e);
    expect(error.code).toBe('token_expired');
    expect(calls).toHaveLength(1);
  });
  it.each(['/auth/me', '/auth/sessions', '/auth/sessions/s1', '/auth/resend-verification'])('may retry the Bearer route %s', async (url) => {
    setAccessToken('old');
    routes = (config) => (config.url === '/auth/refresh' ? refreshOk() : config.headers.get('Authorization') === 'Bearer new-token' ? {} : err(401, 'token_expired'));
    await http.request({ url, method: 'get' });
    expect(calls.filter((c) => c.url === '/auth/refresh')).toHaveLength(1);
    expect(calls.at(-1).url).toBe(url);
  });
  it('invalid_credentials from login surfaces as an ApiError', async () => {
    routes = () => err(401, 'invalid_credentials');
    await expect(http.post('/auth/login', {})).rejects.toMatchObject({ status: 401, code: 'invalid_credentials' });
  });
});
