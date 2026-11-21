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
