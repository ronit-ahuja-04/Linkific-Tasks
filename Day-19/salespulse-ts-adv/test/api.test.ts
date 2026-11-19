import { describe, expect, it } from 'vitest';
import { ApiError, isAbortError, toFailure } from '../src/api/errors';
import { createHttpApi, fetchJson, isDashboardResponse, isSalesRow } from '../src/api/httpApi';
import { createApi } from '../src/api/mockApi';
import { assertNever } from '../src/lib/exhaustive';

const json = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const isNumberBox = (v: unknown): v is { n: number } => typeof v === 'object' && v !== null && 'n' in v && typeof v.n === 'number';

describe('guards', () => {
  it('accept what the mock API really sends', async () => {
    const response = await createApi({ delayMs: 0 }).fetchDashboard({ months: 3 });
    expect(isDashboardResponse(response)).toBe(true);
    expect(response.sales.every(isSalesRow)).toBe(true);
  });

  it('reject values with a wrong or missing field, or of the wrong type altogether', async () => {
    const response = await createApi({ delayMs: 0 }).fetchDashboard({ months: 3 });
    expect(isDashboardResponse({ ...response, months: '3' })).toBe(false);
    expect(isDashboardResponse({ ...response, sales: [{ ...response.sales[0], region: 'Mars' }] })).toBe(false);
    expect(isDashboardResponse({ ...response, scores: undefined })).toBe(false);
    expect(isDashboardResponse(null)).toBe(false);
    expect(isDashboardResponse('text')).toBe(false);
  });
});

describe('fetchJson', () => {
  it('returns the body once the guard accepts it', async () => {
    const value = await fetchJson('/x', isNumberBox, { fetchImpl: async () => json({ n: 4 }) });
    expect(value.n).toBe(4);
  });

  it('turns a network failure, a bad status and a wrong shape into typed ApiErrors', async () => {
    const network = fetchJson('/x', isNumberBox, { fetchImpl: async () => { throw new TypeError('offline'); } });
    await expect(network).rejects.toMatchObject({ name: 'ApiError', kind: 'network' });
    const http = fetchJson('/x', isNumberBox, { fetchImpl: async () => json({}, 503) });
    await expect(http).rejects.toMatchObject({ kind: 'http', status: 503 });
    const shape = fetchJson('/x', isNumberBox, { fetchImpl: async () => json({ n: 'four' }) });
    await expect(shape).rejects.toMatchObject({ kind: 'shape' });
  });

  it('lets an abort through unchanged (cancelling is not a failure)', async () => {
    const abort = new DOMException('cancelled', 'AbortError');
    const request = fetchJson('/x', isNumberBox, { fetchImpl: async () => { throw abort; } });
    await expect(request).rejects.toSatisfy(isAbortError);
  });

  it('createHttpApi builds the URL and returns a validated DashboardResponse', async () => {
    const real = await createApi({ delayMs: 0 }).fetchDashboard({ months: 3 });
    let seen = '';
    const api = createHttpApi('https://example.test', async (url) => { seen = String(url); return json(real); });
    const response = await api.fetchDashboard({ months: 3 });
    expect(seen).toBe('https://example.test/dashboard?months=3');
    expect(response.months).toBe(3);
    expect(api.calls).toEqual([3]);
  });
});

describe('errors', () => {
  it('toFailure narrows an unknown thrown value', () => {
    expect(toFailure(new ApiError('http', 'no', 500))).toEqual({ kind: 'http', message: 'no' });
    expect(toFailure(new Error('plain'))).toEqual({ kind: 'unknown', message: 'plain' });
    expect(toFailure('a string')).toEqual({ kind: 'unknown', message: 'Something went wrong. Try again.' });
  });

  it('assertNever throws if an impossible value arrives at run time', () => {
    // @ts-expect-error a string is not `never`: this is exactly what the compiler checks in a switch's default branch
    expect(() => assertNever('surprise')).toThrow(/Unhandled value/);
  });
});
