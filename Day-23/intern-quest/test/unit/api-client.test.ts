import { describe, expect, it, vi } from 'vitest';
import { apiFetch, backoff, type ApiOptions } from '@/lib/api-client';
import { AppError, MESSAGES } from '@/lib/errors';

/** A fake fetch that answers from a list, one answer per call ("hang" never answers, but honours the abort signal) */
type Answer = { status: number; body?: unknown; type?: string; headers?: Record<string, string> } | 'network' | 'hang';
function fakeFetch(...answers: Answer[]) {
  const calls: { url: string; init: RequestInit }[] = [];
  const impl = vi.fn(async (url: string | URL | Request, init: RequestInit = {}) => {
    calls.push({ url: String(url), init });
    const answer = answers[Math.min(calls.length - 1, answers.length - 1)];
    if (answer === 'network') throw new TypeError('Failed to fetch');
    if (answer === 'hang') {
      return new Promise<Response>((_resolve, reject) => init.signal?.addEventListener('abort', () => reject(init.signal?.reason)));
    }
    const body = answer.body === undefined ? null : typeof answer.body === 'string' ? answer.body : JSON.stringify(answer.body);
    return new Response(body, { status: answer.status, headers: { 'content-type': answer.type ?? 'application/json', ...answer.headers } });
  });
  return { impl: impl as unknown as typeof fetch, calls };
}

const base = (f: ReturnType<typeof fakeFetch>, extra: ApiOptions = {}): ApiOptions => ({ fetch: f.impl, sleep: async () => {}, online: () => true, ...extra });

describe('apiFetch: answers', () => {
  it('returns the parsed JSON, and sends a JSON body with the right header', async () => {
    const f = fakeFetch({ status: 201, body: { quest: { id: 'q1' } } });
    await expect(apiFetch('/api/quests', base(f, { method: 'POST', body: { title: 'x' } }))).resolves.toEqual({ quest: { id: 'q1' } });
    expect(f.calls[0].init.method).toBe('POST');
    expect(f.calls[0].init.body).toBe('{"title":"x"}');
    expect(f.calls[0].init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(f.calls[0].init.credentials).toBe('same-origin');
  });

  it('204 and non-JSON bodies come back as null', async () => {
    await expect(apiFetch('/x', base(fakeFetch({ status: 204 }), { method: 'DELETE' }))).resolves.toBeNull();
    await expect(apiFetch('/x', base(fakeFetch({ status: 200, body: '<p>hi</p>', type: 'text/html' })))).resolves.toBeNull();
  });

  it('an error answer is thrown as an AppError with the API sentence, the fields and the request id', async () => {
    const f = fakeFetch({ status: 400, body: { error: 'That quest is not valid.', fields: { title: 'too short' } }, headers: { 'x-request-id': 'rid-1' } });
    const error = await apiFetch('/api/quests', base(f, { method: 'POST', body: {} })).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ kind: 'validation', message: 'That quest is not valid.', fields: { title: 'too short' }, requestId: 'rid-1', status: 400 });
  });

  it('an HTML 500 page becomes our server message (inventory row C3)', async () => {
    const error = await apiFetch('/api/quests', base(fakeFetch({ status: 500, body: '<h1>Internal Server Error</h1>', type: 'text/html' }), { method: 'POST' })).catch((e: unknown) => e);
    expect(error).toMatchObject({ kind: 'server', message: MESSAGES.server });
  });
});

describe('apiFetch: no answer', () => {
  it('offline: nothing is sent at all (inventory row C1)', async () => {
    const f = fakeFetch({ status: 200, body: {} });
    const error = await apiFetch('/api/quests', base(f, { method: 'POST', online: () => false })).catch((e: unknown) => e);
    expect(error).toMatchObject({ kind: 'offline' });
    expect(f.calls).toHaveLength(0);
  });

  it('a request that never answers ends at the deadline as a timeout (inventory row C2)', async () => {
    vi.useFakeTimers();
    try {
      const pending = apiFetch('/api/quests', base(fakeFetch('hang'), { method: 'POST', timeoutMs: 15_000 })).catch((e: unknown) => e);
      await vi.advanceTimersByTimeAsync(15_000);
      const error = await pending;
      expect(error).toMatchObject({ kind: 'timeout' });
      expect((error as AppError).message).toMatch(/may have been saved anyway/);
    } finally {
      vi.useRealTimers();
    }
  });

  it('a dropped connection while online is a network error', async () => {
    await expect(apiFetch('/x', base(fakeFetch('network'), { method: 'POST' }))).rejects.toMatchObject({ kind: 'network' });
  });

  it('the caller can cancel: aborted, and not retried', async () => {
    const controller = new AbortController();
    const f = fakeFetch('hang');
    const pending = apiFetch('/x', base(f, { signal: controller.signal })).catch((e: unknown) => e);
    controller.abort();
    await expect(pending).resolves.toMatchObject({ kind: 'aborted' });
    expect(f.calls).toHaveLength(1);
  });
});

describe('apiFetch: retries', () => {
  it('a GET is retried after a 503 and a network error, then succeeds', async () => {
    const sleeps: number[] = [];
    const f = fakeFetch({ status: 503, body: { error: 'down' } }, 'network', { status: 200, body: { ok: 1 } });
    await expect(apiFetch('/x', base(f, { sleep: async (ms) => void sleeps.push(ms), random: () => 0.5 }))).resolves.toEqual({ ok: 1 });
    expect(f.calls).toHaveLength(3);
    expect(sleeps).toEqual([backoff(0, () => 0.5), backoff(1, () => 0.5)]);
  });

  it('a GET gives up after 2 retries and throws the last error', async () => {
    const f = fakeFetch({ status: 503 });
    await expect(apiFetch('/x', base(f))).rejects.toMatchObject({ kind: 'unavailable' });
    expect(f.calls).toHaveLength(3);
  });

  it('a GET is NOT retried when retrying can not help (404, 401, 409, 429)', async () => {
    for (const status of [404, 401, 409, 429]) {
      const f = fakeFetch({ status });
      await expect(apiFetch('/x', base(f))).rejects.toBeInstanceOf(AppError);
      expect(f.calls).toHaveLength(1);
    }
  });

  it('a write is NEVER retried automatically, even on a 503: it might happen twice', async () => {
    for (const method of ['POST', 'PUT', 'DELETE'] as const) {
      const f = fakeFetch({ status: 503 }, { status: 201, body: {} });
      await expect(apiFetch('/x', base(f, { method, retries: 5 }))).rejects.toMatchObject({ kind: 'unavailable' });
      expect(f.calls).toHaveLength(1);
    }
  });

  it('backoff: random between 100 ms and 400 ms × 2^attempt, capped at 4 s', () => {
    expect(backoff(0, () => 0)).toBe(100);
    expect(backoff(0, () => 1)).toBe(500);
    expect(backoff(1, () => 1)).toBe(900);
    expect(backoff(10, () => 1)).toBe(4100);
  });
});
