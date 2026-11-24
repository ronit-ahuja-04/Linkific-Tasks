import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { json, people, record } from './fixtures';

/**
 * Day 23: what the API answers when things go wrong on OUR side, and the endpoint browsers report errors to.
 * The database layer is replaced here (no outage needed): listQuests fails the way db.ts fails when Supabase does
 * not answer.
 */
vi.mock('@/lib/server/session', () => ({ currentUser: vi.fn() }));
vi.mock('@/lib/server/db', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/server/db')>()), listQuests: vi.fn() }));
const { currentUser } = await import('@/lib/server/session');
const { DbError, listQuests } = await import('@/lib/server/db');
const quests = await import('@/app/api/quests/route');
const unknown = await import('@/app/api/[...path]/route');
const clientErrors = await import('@/app/api/client-errors/route');

let log: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.mocked(currentUser).mockResolvedValue(people.one);
  log = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

const withId = (path: string, init: RequestInit = {}) => new Request(`http://localhost${path}`, { ...init, headers: { 'x-request-id': 'rid-7', ...init.headers } });

describe('our failures answer in the API\'s own JSON shape (inventory rows S8, S9, N7)', () => {
  it('database not answering: 503, Retry-After, a sentence and the request id', async () => {
    vi.mocked(listQuests).mockRejectedValue(new DbError('unavailable', 'Loading quests: the database did not answer (TypeError: fetch failed)'));
    const response = await quests.GET(withId('/api/quests'));
    expect(response.status).toBe(503);
    expect(response.headers.get('retry-after')).toBe('5');
    const { body } = await json(response);
    expect(record(body)).toMatchObject({ requestId: 'rid-7' });
    expect(record(body).error).toMatch(/not answering/);
  });

  it('a bug: 500 JSON (not an empty body), logged as one JSON line with the request id', async () => {
    vi.mocked(listQuests).mockRejectedValue(new DbError('unexpected', 'Loading quests: relation "quests" does not exist'));
    const response = await quests.GET(withId('/api/quests'));
    expect(response.status).toBe(500);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(record((await json(response)).body)).toMatchObject({ requestId: 'rid-7' });
    const line = JSON.parse(String(log.mock.calls[0][0]));
    expect(line).toMatchObject({ at: 'error', source: 'route', id: 'rid-7', kind: 'unexpected', path: '/api/quests' });
  });

  it('an unknown /api address: JSON 404, for every method', async () => {
    for (const handler of [unknown.GET, unknown.POST, unknown.PUT, unknown.PATCH, unknown.DELETE]) {
      const { status, body } = await json(await handler());
      expect(status).toBe(404);
      expect(body).toEqual({ error: 'There is no API endpoint at this address.' });
    }
  });
});

describe('POST /api/client-errors', () => {
  const report = { source: 'window', name: 'TypeError', message: 'x is undefined', path: '/journal' };
  const post = (body: unknown, headers: Record<string, string> = {}) =>
    clientErrors.POST(withId('/api/client-errors', {
      method: 'POST',
      headers: { origin: 'http://localhost', 'content-type': 'application/json', 'x-forwarded-for': `10.0.0.${Math.floor(Math.random() * 250)}`, ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }));

  it('logs a valid report as one client-error line, with the signed-in user, and answers 204', async () => {
    const response = await post(report);
    expect(response.status).toBe(204);
    const line = JSON.parse(String(log.mock.calls[0][0]));
    expect(line).toMatchObject({ at: 'client-error', id: 'rid-7', user: people.one.id, source: 'window', message: 'x is undefined', path: '/journal' });
  });

  it('works signed out too (errors happen on the sign-in page)', async () => {
    vi.mocked(currentUser).mockResolvedValue(null);
    expect((await post(report)).status).toBe(204);
  });

  it('refuses another origin, or no origin at all (403)', async () => {
    expect((await post(report, { origin: 'https://evil.example' })).status).toBe(403);
    const noOrigin = await clientErrors.POST(new Request('http://localhost/api/client-errors', { method: 'POST', body: JSON.stringify(report) }));
    expect(noOrigin.status).toBe(403);
  });

  it('refuses more than 8 KB (413), invalid JSON and invalid reports (400)', async () => {
    expect((await post({ ...report, message: 'x'.repeat(9000) })).status).toBe(413);
    expect((await post('{nope')).status).toBe(400);
    expect((await post({ source: 'window' })).status).toBe(400);
  });

  it('slows down a flood from one address: 20 a minute, then 429 with Retry-After', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 21; i += 1) statuses.push((await post(report, { 'x-forwarded-for': '192.0.2.99' })).status);
    expect(statuses.slice(0, 20).every((s) => s === 204)).toBe(true);
    const limited = await post(report, { 'x-forwarded-for': '192.0.2.99' });
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get('retry-after'))).toBeGreaterThan(0);
  });
});
