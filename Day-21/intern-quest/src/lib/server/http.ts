import 'server-only';
import type { Parsed } from '@/lib/validation';

/**
 * One shape for every API answer, so the client handles them all the same way:
 *   success  -> the data, with 200 / 201 (or 204 with no body)
 *   failure  -> { error: "a sentence for people", fields?: { field: "what is wrong" } }
 */
export const ok = <T>(data: T, status = 200): Response => Response.json(data, { status });
export const noContent = (): Response => new Response(null, { status: 204 });

export const problem = (status: 400 | 401 | 403 | 404 | 409 | 500, error: string, fields?: Record<string, string>): Response =>
  Response.json(fields ? { error, fields } : { error }, { status });

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
