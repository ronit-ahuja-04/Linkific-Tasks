import { AppError, fromException, fromResponse, MESSAGES } from './errors';

/**
 * apiFetch: the ONE way the browser calls our API. Every call gets, without the call site doing anything:
 *
 *   - a DEADLINE (15 s): a request that never answers becomes a `timeout` error instead of an endless "Saving…".
 *     It is longer than the server's own database deadline (5 s, src/lib/server/client.ts), so when the database is
 *     slow the SERVER normally answers first, with a 503 that explains itself.
 *   - an OFFLINE check: when the browser knows it is offline, nothing is sent and the error says so.
 *   - one error shape: any failure is thrown as an AppError (src/lib/errors.ts) with a kind and a message for people.
 *   - RETRIES for reads only: a GET that fails for a reason that can pass (network, timeout, 503, 5xx) is tried twice
 *     more, after a random wait that grows (exponential backoff with "full jitter", so many browsers that failed at
 *     the same moment do not all come back at the same moment). Writes are NEVER retried automatically: a POST that
 *     timed out may have been saved, and sending it again could log the same day twice.
 *
 * Returns the parsed JSON body (null for 204). Callers narrow it with their own type guards, as before.
 */
export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface ApiOptions {
  method?: Method;
  body?: unknown;
  timeoutMs?: number;
  /** automatic retries; default 2 for GET, and always 0 for writes */
  retries?: number;
  signal?: AbortSignal;
  // injectable for tests
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
  online?: () => boolean;
}

export const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_GET_RETRIES = 2;

/** Wait before retry number `attempt` (0, 1, …): random between 100 ms and 400 ms × 2^attempt, capped at 4 s */
export const backoff = (attempt: number, random: () => number = Math.random): number => Math.round(100 + random() * Math.min(4000, 400 * 2 ** attempt));

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const browserOnline = () => typeof navigator === 'undefined' || navigator.onLine;

export async function apiFetch(path: string, options: ApiOptions = {}): Promise<unknown> {
  const method = options.method ?? 'GET';
  const retries = method === 'GET' ? (options.retries ?? DEFAULT_GET_RETRIES) : 0;
  const sleep = options.sleep ?? defaultSleep;
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await once(path, method, options);
    } catch (error) {
      const appError = error instanceof AppError ? error : fromException(error, { method });
      if (attempt >= retries || !appError.autoRetry || options.signal?.aborted) throw appError;
      await sleep(backoff(attempt, options.random));
    }
  }
}

async function once(path: string, method: Method, options: ApiOptions): Promise<unknown> {
  const online = options.online ?? browserOnline;
  if (!online()) throw new AppError('offline', MESSAGES.offline, { method });

  // our own deadline (setTimeout + AbortController rather than AbortSignal.timeout, so tests can move the clock)
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException('No answer before the deadline', 'TimeoutError')), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const forwardAbort = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener('abort', forwardAbort, { once: true });
  try {
    const response = await (options.fetch ?? fetch)(path, {
      method,
      headers: options.body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: 'same-origin',
      signal: controller.signal,
    });
    const text = await response.text(); // still under the deadline: a body can stall too
    const body = parseJson(text, response.headers.get('content-type'));
    const requestId = response.headers.get('x-request-id') ?? undefined;
    if (!response.ok) throw fromResponse(response.status, body, { requestId, method });
    return body;
  } catch (error) {
    if (error instanceof AppError) throw error;
    // fetch rejects with the abort REASON: our TimeoutError, or whatever the caller's signal carried
    const reason = controller.signal.aborted ? controller.signal.reason : error;
    throw fromException(reason, { method, online: online() });
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', forwardAbort);
  }
}

function parseJson(text: string, contentType: string | null): unknown {
  if (!text || !contentType?.includes('json')) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
