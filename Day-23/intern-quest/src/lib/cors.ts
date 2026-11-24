/**
 * CORS for the PUBLIC API (/api/public/*), and only for it. Used by src/proxy.ts; pure, so it is unit tested.
 *
 * The browser's same-origin policy lets a page READ answers only from its own origin (scheme + host + port). CORS is
 * how a server says "this other origin may read my answer too". Our rules:
 *
 *   - ALLOWLIST, from CORS_ALLOWED_ORIGINS (comma-separated, per environment). The allowed origin is echoed back in
 *     Access-Control-Allow-Origin; never `*`, so we always know exactly who may read.
 *   - `Vary: Origin` on every answer: the answer differs by Origin, so a cache (the browser's, a CDN) must not hand
 *     the answer meant for one origin to another.
 *   - NO credentials: the card is public, so no cookie is needed and none is accepted (no Allow-Credentials). The
 *     signed-in API stays same-origin only: it uses the session cookie, and letting another origin send it would
 *     invite cross-site request forgery.
 *   - PREFLIGHT (OPTIONS) is answered here, before any route code: 204 with the allowed methods and headers and a
 *     Max-Age (the browser may reuse the answer for 10 minutes), or 403 for an origin not on the list.
 *   - EXPOSE x-request-id: by default a script may read only a few "safelisted" response headers; this lets an
 *     embedding site quote our reference when something fails.
 *
 * CORS is not access control: it only decides whether a BROWSER lets a script read the answer. curl, servers and
 * other non-browser clients ignore it. That is fine here: everything under /api/public is public anyway.
 */
export const PUBLIC_API = '/api/public/';
export const ALLOWED_METHODS = 'GET, OPTIONS';
export const ALLOWED_HEADERS = 'Content-Type, X-Client-Name';
export const EXPOSED_HEADERS = 'X-Request-Id';
export const MAX_AGE_SECONDS = 600;

export interface Allowlist {
  origins: ReadonlySet<string>;
  /** entries that were ignored, with why (reported by the environment check) */
  rejected: string[];
}

/** "https://a.example, http://localhost:4000/" -> exact origins; `*`, paths and junk are rejected, not guessed at */
export function parseAllowlist(value: string | undefined): Allowlist {
  const origins = new Set<string>();
  const rejected: string[] = [];
  for (const raw of (value ?? '').split(',').map((s) => s.trim()).filter(Boolean)) {
    if (raw === '*' || raw === 'null') {
      rejected.push(`${raw} (list exact origins instead)`);
      continue;
    }
    try {
      const url = new URL(raw);
      const bare = raw.replace(/\/$/, '');
      if (!/^https?:$/.test(url.protocol) || bare !== url.origin) rejected.push(`${raw} (an origin is scheme://host[:port], nothing more)`);
      else origins.add(url.origin);
    } catch {
      rejected.push(`${raw} (not a URL)`);
    }
  }
  return { origins, rejected };
}

export type CorsDecision =
  | { kind: 'none' } //                                        not the public API: no CORS headers at all
  | { kind: 'preflight'; status: 204 | 403; headers: Record<string, string> } // answer it here and stop
  | { kind: 'request'; headers: Record<string, string> }; //   let it through, then add these headers

export function corsFor(pathname: string, method: string, origin: string | null, allowlist: Allowlist): CorsDecision {
  if (!pathname.startsWith(PUBLIC_API)) return { kind: 'none' };
  const allowed = origin !== null && allowlist.origins.has(origin);
  const base: Record<string, string> = { Vary: 'Origin' };
  const granted: Record<string, string> = allowed ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Expose-Headers': EXPOSED_HEADERS } : {};

  // a preflight is an OPTIONS that announces the real request (Access-Control-Request-Method)
  if (method === 'OPTIONS') {
    if (!allowed) return { kind: 'preflight', status: 403, headers: base };
    return {
      kind: 'preflight',
      status: 204,
      headers: { ...base, ...granted, 'Access-Control-Allow-Methods': ALLOWED_METHODS, 'Access-Control-Allow-Headers': ALLOWED_HEADERS, 'Access-Control-Max-Age': String(MAX_AGE_SECONDS) },
    };
  }
  // an actual request: always answered (the data is public), but only an allowed origin's page may READ the answer
  return { kind: 'request', headers: { ...base, ...granted } };
}

/**
 * CROSS-SITE WRITES. CORS hides answers; it does not stop requests. A "simple" request (e.g. a POST with
 * Content-Type: text/plain) is sent without a preflight, with the browser's cookies when the two sites count as the
 * same "site" (localhost:4000 and localhost:3000 do), and our handlers would process it even though the page that sent
 * it can not read the answer: cross-site request forgery. So every API WRITE whose Origin is not our own is refused,
 * the same check Next.js applies to server actions. Exceptions:
 *   - no Origin header: not a browser page (curl, a server), so no ambient cookie of a victim is involved;
 *   - /api/auth/*: NextAuth protects its own POSTs with a CSRF token.
 */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function isCrossSiteWrite(pathname: string, method: string, origin: string | null, ownOrigin: string): boolean {
  if (!pathname.startsWith('/api/') || pathname.startsWith('/api/auth/') || SAFE_METHODS.has(method)) return false;
  return origin !== null && origin !== ownOrigin;
}
