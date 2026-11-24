import { getToken } from 'next-auth/jwt';
import { NextResponse, type NextRequest } from 'next/server';
import { corsFor, isCrossSiteWrite, parseAllowlist } from '@/lib/cors';
import { HANDLE_PATTERN } from '@/lib/validation';

/**
 * PROXY (called "middleware" before Next.js 16). Runs before every matched request, on the Node.js runtime.
 *
 *   1. request id + timing   every request gets an x-request-id (passed to the app and returned to the browser) and one log line
 *   2. /@handle              rewritten to /c/handle: a short, shareable address; the browser keeps showing /@handle
 *   3. sign-in redirect      /journal, /character, /guild without a session -> /login?next=<where you were going>
 *   4. mentor gate           /guild for a non-mentor -> /journal with a notice
 *   5. security headers      on every response
 *   6. CORS (Day 23)         /api/public/* only: an origin allowlist from CORS_ALLOWED_ORIGINS; preflights answered here
 *   7. cross-site writes     (Day 23) an API write from another origin's page is refused (403): CORS alone does not stop it
 *
 * `getToken` decrypts the session cookie (a JWT encrypted with AUTH_SECRET) without touching the database, which is
 * why these checks are cheap enough to run here, and it only READS the cookie. (NextAuth's `auth(...)` proxy wrapper
 * re-issues the cookie on every request; a request still in flight when you signed out then wrote the session back,
 * signing you in again. The browser tests caught that under load.) The checks are OPTIMISTIC: every page, API route
 * and server action checks the session again, because a proxy can be skipped (a matcher change, a server-action POST).
 */
const PROTECTED = ['/journal', '/character', '/guild', '/me'];
/** read once per server instance; changing it on Vercel means a redeploy, like any environment variable */
const CORS_ALLOWLIST = parseAllowlist(process.env.CORS_ALLOWED_ORIGINS);
const isUnder = (path: string, base: string): boolean => path === base || path.startsWith(`${base}/`);

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
};

export default async function proxy(request: NextRequest) {
  const started = performance.now();
  const requestId = crypto.randomUUID();
  const { pathname, search } = request.nextUrl;
  // on https the cookie is named __Secure-authjs.session-token; on http (local) authjs.session-token
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET, secureCookie: request.nextUrl.protocol === 'https:' });
  const session = token?.uid ? { user: { id: token.uid, role: token.role ?? 'intern' } } : null;
  let decision = 'next';
  let response: NextResponse;

  // the app (route handlers, server components) can read the id from the request headers
  const forwarded = new Headers(request.headers);
  forwarded.set('x-request-id', requestId);

  const cors = corsFor(pathname, request.method, request.headers.get('origin'), CORS_ALLOWLIST);

  const shortHandle = pathname.startsWith('/@') ? pathname.slice(2).toLowerCase() : null;
  if (isCrossSiteWrite(pathname, request.method, request.headers.get('origin'), request.nextUrl.origin)) {
    decision = 'refused cross-site write';
    response = NextResponse.json({ error: 'Requests that change data are accepted from this site only.' }, { status: 403 });
  } else if (cors.kind === 'preflight') {
    // a preflight never reaches the route: 204 with what is allowed, or 403 for an origin not on the list
    decision = `cors preflight ${cors.status}`;
    response = new NextResponse(null, { status: cors.status });
  } else if (shortHandle !== null && HANDLE_PATTERN.test(shortHandle)) {
    decision = `rewrite /c/${shortHandle}`;
    response = NextResponse.rewrite(new URL(`/c/${shortHandle}`, request.url), { request: { headers: forwarded } });
  } else if (PROTECTED.some((base) => isUnder(pathname, base)) && !session?.user) {
    decision = 'redirect /login';
    const login = new URL('/login', request.url);
    login.searchParams.set('next', `${pathname}${search}`);
    response = NextResponse.redirect(login);
  } else if (isUnder(pathname, '/guild') && session?.user.role !== 'mentor') {
    decision = 'redirect /journal (mentors only)';
    response = NextResponse.redirect(new URL('/journal?notice=mentors-only', request.url));
  } else {
    response = NextResponse.next({ request: { headers: forwarded } });
  }

  response.headers.set('x-request-id', requestId);
  if (cors.kind !== 'none') for (const [name, value] of Object.entries(cors.headers)) response.headers.set(name, value);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) response.headers.set(name, value);
  // one structured line per request: easy to grep locally, easy to search in Vercel's logs
  console.log(JSON.stringify({ at: 'proxy', id: requestId, method: request.method, path: pathname, user: session?.user.id ?? null, decision, ms: Math.round((performance.now() - started) * 10) / 10 }));
  return response;
}

export const config = {
  // everything except Next's static files, image optimisation and the icon (they need no session, headers or logs)
  matcher: ['/((?!_next/static|_next/image|icon.svg|favicon.ico).*)'],
};
