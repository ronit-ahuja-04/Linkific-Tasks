// @vitest-environment jsdom
import { AxiosError } from 'axios';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as authApi from '../../src/api/authApi';
import { ApiError, http, setAccessToken } from '../../src/api/http';

let seen;
let reply;
const originalAdapter = http.defaults.adapter;

beforeEach(() => {
  seen = [];
  reply = () => ({ status: 200, data: { ok: true } });
  http.defaults.adapter = (config) => {
    seen.push({ method: config.method, url: config.url, body: config.data ? JSON.parse(config.data) : undefined });
    const { status, data } = reply();
    const response = { status, data, headers: {}, config, statusText: '', request: {} };
    return status >= 400 ? Promise.reject(new AxiosError('failed', 'ERR_BAD_REQUEST', config, {}, response)) : Promise.resolve(response);
  };
  setAccessToken(null);
});
afterEach(() => {
  http.defaults.adapter = originalAdapter;
});

describe('authApi', () => {
  it.each([
    ['register', () => authApi.register({ name: 'A', email: 'a@b.co', password: 'pw', extra: 'ignored' }), 'post', '/auth/register', { name: 'A', email: 'a@b.co', password: 'pw' }],
    ['login', () => authApi.login({ email: 'a@b.co', password: 'pw', remember: true }), 'post', '/auth/login', { email: 'a@b.co', password: 'pw', remember: true }],
    ['login default remember', () => authApi.login({ email: 'a@b.co', password: 'pw' }), 'post', '/auth/login', { email: 'a@b.co', password: 'pw', remember: false }],
    ['refresh', () => authApi.refresh(), 'post', '/auth/refresh', undefined],
    ['logout', () => authApi.logout(), 'post', '/auth/logout', undefined],
    ['me', () => authApi.me(), 'get', '/auth/me', undefined],
    ['forgotPassword', () => authApi.forgotPassword('a@b.co'), 'post', '/auth/forgot-password', { email: 'a@b.co' }],
    ['resetPassword', () => authApi.resetPassword('tok', 'new'), 'post', '/auth/reset-password', { token: 'tok', password: 'new' }],
    ['verifyEmail', () => authApi.verifyEmail('tok'), 'post', '/auth/verify-email', { token: 'tok' }],
    ['resendVerification', () => authApi.resendVerification(), 'post', '/auth/resend-verification', undefined],
    ['providers', () => authApi.providers(), 'get', '/auth/providers', undefined],
    ['revokeSession', () => authApi.revokeSession('s 1'), 'delete', '/auth/sessions/s%201', undefined],
  ])('%s calls the right endpoint and unwraps data', async (_name, run, method, url, body) => {
    reply = () => ({ status: 200, data: { payload: _name } });
    await expect(run()).resolves.toEqual({ payload: _name });
    expect(seen[0]).toEqual({ method, url, body });
  });

  it('listSessions returns the list inside { sessions }', async () => {
    reply = () => ({ status: 200, data: { sessions: [{ id: 's1', current: true }] } });
    await expect(authApi.listSessions()).resolves.toEqual([{ id: 's1', current: true }]);
    expect(seen[0]).toEqual({ method: 'get', url: '/auth/sessions', body: undefined });
  });

  it('throws ApiError with the server code', async () => {
    reply = () => ({ status: 409, data: { error: { code: 'email_taken', message: 'Taken' } } });
    const error = await authApi.register({ name: 'A', email: 'a@b.co', password: 'pw' }).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, code: 'email_taken' });
  });
  it('wraps a non-http failure in an ApiError', async () => {
    http.defaults.adapter = (config) => Promise.reject(new AxiosError('Network Error', 'ERR_NETWORK', config, {}));
    await expect(authApi.providers()).rejects.toMatchObject({ code: 'network_error' });
  });
});
