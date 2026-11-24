import 'server-only';
import { unstable_rethrow } from 'next/navigation';
import type { Parsed } from '@/lib/validation';
import { DbError } from './db';
import { logError } from './log';

/**
 * One shape for every API answer, so the client handles them all the same way:
 *   success  -> the data, with 200 / 201 (or 204 with no body)
 *   failure  -> { error: "a sentence for people", fields?: { field: "what is wrong" }, requestId?: "…" }
 * Every response also carries the request id in the x-request-id header (set by the proxy).
 */
export const ok = <T>(data: T, status = 200): Response => Response.json(data, { status });
export const noContent = (): Response => new Response(null, { status: 204 });

export type ProblemStatus = 400 | 401 | 403 | 404 | 409 | 413 | 429 | 500 | 503;

export const problem = (status: ProblemStatus, error: string, fields?: Record<string, string>, extra: { requestId?: string; headers?: HeadersInit } = {}): Response =>
  Response.json({ error, ...(fields ? { fields } : {}), ...(extra.requestId ? { requestId: extra.requestId } : {}) }, { status, headers: extra.headers });

export const unauthorized = (): Response => problem(401, 'Sign in to do this.');
export const forbidden = (why = 'You are not allowed to do this.'): Response => problem(403, why);
export const notFound = (what = 'Not found.'): Response => problem(404, what);

/** Read a JSON body. Invalid JSON is the client's mistake (400), not a crash (500). */
export async function readJson(request: Request): Promise<{ ok: true; value: unknown } | { ok: false; response: Response }> {
  try {
    return { ok: true, value: await request.json() };
  } catch {
    return { ok: false, response: problem(400, 'The request body is not valid JSON.') };
  }
}

/** A validation failure becomes a 400 that lists every field problem */
export const invalid = <T>(parsed: Extract<Parsed<T>, { ok: false }>, what: string): Response => problem(400, `That ${what} is not valid.`, parsed.errors);

export const UNAVAILABLE_MESSAGE = 'The database is not answering right now. Nothing was changed; try again in a moment.';
export const SERVER_ERROR_MESSAGE = 'Something broke on our side. It has been logged.';

/**
 * Wrap a route handler so that NOTHING escapes as Next's default answer (a 500 with an empty body, found in the M1
 * inventory, rows S8/S9). Expected failures are answered inside the handlers (400, 404, 409…); this catches the rest:
 *   - the database did not answer (DbError 'unavailable')  -> 503 + Retry-After: temporary, worth trying again
 *   - anything else (a bug)                                  -> 500
 * Both are logged once, as one JSON line with the request id, and the id is returned so a user can quote it.
 * Next's own control flow (redirect(), notFound()) is re-thrown untouched.
 */
export function withErrors<A extends unknown[]>(handler: (...args: A) => Promise<Response>): (...args: A) => Promise<Response> {
  // keeps the handler's own parameters (a handler may take none); Next always passes (request, context)
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      unstable_rethrow(error);
      const request = args[0] instanceof Request ? args[0] : undefined;
      const requestId = request?.headers.get('x-request-id') ?? undefined;
      logError(error, { source: 'route', requestId, method: request?.method, path: request ? new URL(request.url).pathname : undefined });
      if (error instanceof DbError && error.kind === 'unavailable') {
        return problem(503, UNAVAILABLE_MESSAGE, undefined, { requestId, headers: { 'Retry-After': '5' } });
      }
      return problem(500, SERVER_ERROR_MESSAGE, undefined, { requestId });
    }
  };
}
