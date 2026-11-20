import { connection } from 'next/server';

/**
 * GET /api/time: different on every request. `connection()` marks the handler as request-time work, so nothing
 * here is evaluated at build time. `no-store` also tells browsers and CDNs not to keep a copy.
 */
export async function GET() {
  await connection();
  return Response.json({ now: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
}
