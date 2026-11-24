import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseClientReport } from '@/lib/client-report';
import { withDeadline } from '@/lib/server/client';
import { DbError, fail, isUnavailable } from '@/lib/server/db';
import { SERVER_ERROR_MESSAGE, UNAVAILABLE_MESSAGE, withErrors } from '@/lib/server/http';
import { errorLine } from '@/lib/server/log';
import { RateLimiter } from '@/lib/server/rate-limit';

const postgrestError = (code: string, message: string) => ({ code, message, details: '', hint: '', name: 'PostgrestError' }) as Parameters<typeof fail>[0];

describe('fail: a database error becomes a DbError with a kind', () => {
  it.each([
    ['23505', 'duplicate key', 'conflict'],
    ['23514', 'check violation', 'invalid'],
    ['PGRST001', 'Database client error. Retrying the connection.', 'unavailable'],
    ['PGRST003', 'Timed out acquiring connection from connection pool.', 'unavailable'],
    ['', 'TypeError: fetch failed', 'unavailable'],
    ['', 'TimeoutError: The operation was aborted due to timeout', 'unavailable'],
    ['', '<html><title>502 Bad Gateway</title></html>', 'unavailable'],
    ['42P01', 'relation "nope" does not exist', 'unexpected'],
  ])('%s "%s" -> %s', (code, message, kind) => {
    expect(() => fail(postgrestError(code, message), 'Loading quests')).toThrow(expect.objectContaining({ kind }));
  });

  it('isUnavailable does not mistake a broken rule for an outage', () => {
    expect(isUnavailable({ code: '23505', message: 'duplicate key value violates unique constraint' })).toBe(false);
  });
});

describe('withDeadline: every database request gets one', () => {
  it('aborts a request that does not answer in time with a TimeoutError', async () => {
    const hang = ((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(init.signal?.reason)))) as typeof fetch;
    await expect(withDeadline(hang, 20)('http://db')).rejects.toMatchObject({ name: 'TimeoutError' });
  });

  it('keeps a signal the caller passed', async () => {
    const seen: AbortSignal[] = [];
    const spy = ((_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.signal) seen.push(init.signal);
      return Promise.resolve(new Response('ok'));
    }) as typeof fetch;
    const caller = new AbortController();
    await withDeadline(spy, 1000)('http://db', { signal: caller.signal });
    caller.abort();
    expect(seen[0].aborted).toBe(true);
  });
});

describe('withErrors: nothing escapes as an empty 500', () => {
  afterEach(() => vi.restoreAllMocks());
  const req = () => new Request('http://localhost/api/quests', { headers: { 'x-request-id': 'rid-42' } });

  it('the database not answering -> 503 JSON, Retry-After, the request id; logged once as a JSON line', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const handler = withErrors(async (_request: Request) => {
      throw new DbError('unavailable', 'Loading quests: the database did not answer');
    });
    const response = await handler(req());
    expect(response.status).toBe(503);
    expect(response.headers.get('retry-after')).toBe('5');
    expect(await response.json()).toEqual({ error: UNAVAILABLE_MESSAGE, requestId: 'rid-42' });
    expect(log).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(log.mock.calls[0][0]))).toMatchObject({ at: 'error', source: 'route', id: 'rid-42', method: 'GET', path: '/api/quests', kind: 'unavailable', name: 'DbError' });
  });

  it('a bug -> 500 JSON with the request id (no stack, no message from the error)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const handler = withErrors(async (_request: Request) => {
      throw new TypeError("Cannot read properties of undefined (reading 'day')");
    });
    const response = await handler(req());
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: SERVER_ERROR_MESSAGE, requestId: 'rid-42' });
  });

  it('answers pass through untouched', async () => {
    const response = await withErrors(async () => Response.json({ fine: true }, { status: 201 }))();
    expect(response.status).toBe(201);
  });
});

describe('errorLine: one JSON line per error', () => {
  it('has the fields log search needs, and a short stack', () => {
    const error = Object.assign(new Error('boom'), { digest: '733246587' });
    const line = errorLine(error, { source: 'render', requestId: 'rid', path: '/journal', route: '/(game)/journal' });
    expect(line).toMatchObject({ at: 'error', source: 'render', id: 'rid', digest: '733246587', path: '/journal', route: '/(game)/journal', name: 'Error', message: 'boom' });
    expect(Array.isArray(line.stack)).toBe(true);
    expect((line.stack as string[]).length).toBeLessThanOrEqual(8);
  });

  it('cuts long messages and survives non-Error values', () => {
    expect((errorLine(new Error('x'.repeat(2000)), { source: 'route' }).message as string).length).toBe(500);
    expect(errorLine('a string', { source: 'route' })).toMatchObject({ name: 'string', message: 'a string', stack: undefined });
  });
});

describe('RateLimiter', () => {
  it('allows `limit` hits per window per key, then says how long to wait', () => {
    let now = 0;
    const limiter = new RateLimiter(2, 60_000, () => now);
    expect(limiter.hit('a')).toBe(0);
    expect(limiter.hit('a')).toBe(0);
    expect(limiter.hit('a')).toBe(60);
    expect(limiter.hit('b')).toBe(0);
    now = 30_000;
    expect(limiter.hit('a')).toBe(30);
    now = 60_001;
    expect(limiter.hit('a')).toBe(0);
  });
});

describe('parseClientReport', () => {
  it('accepts a report and cuts every field to length', () => {
    const report = parseClientReport({ source: 'window', name: 'TypeError', message: 'm'.repeat(5000), stack: 's'.repeat(9000), path: '/journal?secret=1', digest: '123' });
    expect(report).toMatchObject({ source: 'window', name: 'TypeError', path: '/journal', digest: '123' });
    expect(report?.message.length).toBe(1000);
    expect(report?.stack?.length).toBe(4000);
  });

  it('refuses a report without a known source or a message', () => {
    expect(parseClientReport({ source: 'window' })).toBeNull();
    expect(parseClientReport({ source: 'elsewhere', message: 'x' })).toBeNull();
    expect(parseClientReport('x')).toBeNull();
    expect(parseClientReport([])).toBeNull();
  });

  it('drops a path that is not a path, and a digest that is not a token', () => {
    expect(parseClientReport({ source: 'boundary', message: 'x', path: 'https://evil.example/x', digest: '<script>' })).toMatchObject({ path: undefined, digest: undefined });
  });
});
