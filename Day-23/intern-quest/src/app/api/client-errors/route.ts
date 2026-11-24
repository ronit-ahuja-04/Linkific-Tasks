import { parseClientReport } from '@/lib/client-report';
import { noContent, problem, withErrors } from '@/lib/server/http';
import { RateLimiter } from '@/lib/server/rate-limit';
import { currentUser } from '@/lib/server/session';

/**
 * POST /api/client-errors   a browser reports an error it could not show or handle (src/lib/report-client.ts).
 * It is written to the same log as server errors, as one JSON line ({"at":"client-error", …}).
 *
 * Open to signed-out visitors (errors happen on the sign-in page too), so it is guarded instead:
 *   - same origin only: browsers send an Origin header on POST; a report from another site is refused (403);
 *   - 8 KB at most (413);
 *   - 20 reports a minute per address (429; per server instance, see rate-limit.ts);
 *   - the body is validated and every field cut to length (src/lib/client-report.ts).
 */
const MAX_BYTES = 8 * 1024;
const limiter = new RateLimiter(20, 60_000);

export const POST = withErrors(async (request: Request) => {
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) return problem(403, 'Error reports are accepted from this site only.');

  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_BYTES) return problem(413, 'That report is too large.');
  const body = await request.text();
  if (body.length > MAX_BYTES) return problem(413, 'That report is too large.');

  const address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const wait = limiter.hit(address);
  if (wait > 0) return problem(429, 'Too many error reports. Slow down.', undefined, { headers: { 'Retry-After': String(wait) } });

  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return problem(400, 'The request body is not valid JSON.');
  }
  const report = parseClientReport(json);
  if (!report) return problem(400, 'An error report needs a source and a message.');

  const user = await currentUser().catch(() => null);
  console.error(JSON.stringify({ at: 'client-error', id: request.headers.get('x-request-id'), user: user?.id ?? null, ...report }));
  return noContent();
});
