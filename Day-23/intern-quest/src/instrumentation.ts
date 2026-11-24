import type { Instrumentation } from 'next';

/**
 * Runs once when a server instance starts (`next start`, each Vercel function cold start, `next dev`).
 * Checks the environment and stops early with a readable message if something required is missing.
 *
 * Which rules apply depends on WHERE the app runs, not on NODE_ENV: `next start` on a laptop is also NODE_ENV
 * "production" (an optimised build), but it is not the live site. The strict rules (no local database, no demo
 * mentor code, a real site URL) apply when Vercel says this is the production deployment (VERCEL_ENV=production),
 * or when a self-hosted server sets APP_ENV=production.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { checkEnv, deploymentMode } = await import('@/lib/env');
  const { errors, warnings } = checkEnv(process.env, deploymentMode(process.env));
  for (const warning of warnings) console.warn(`[env] ${warning}`);
  if (errors.length > 0) {
    throw new Error(`[env] Intern Quest can not start:\n  - ${errors.join('\n  - ')}\nSee .env.example and the README's deployment guide.`);
  }
}

/**
 * Next.js calls this for every error it catches on the server: while rendering a page ('render'), in a route handler
 * ('route'), in a server action ('action') or in the proxy ('proxy'). It writes the one searchable JSON line
 * (src/lib/server/log.ts) with the request id the proxy set, and the DIGEST: the number Next shows on its error page,
 * so a screenshot from a user leads straight to this line. (Route handlers wrapped in withErrors log for themselves;
 * their errors never reach here.)
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { digestOf, headerValue, logError } = await import('@/lib/server/log');
  // Next's own control flow (notFound(), redirect()) is not an error
  if (digestOf(error)?.startsWith('NEXT_')) return;
  logError(error, {
    source: context.routeType,
    requestId: headerValue(request.headers['x-request-id']),
    method: request.method,
    path: request.path.split('?')[0],
    route: context.routePath,
  });
};
