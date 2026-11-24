import { defineConfig, devices } from '@playwright/test';

const PORT = 3121;
/** the fault proxy between the app and Supabase (inventory/fault-proxy.mjs); it passes everything through unless a test says otherwise */
export const E2E_FAULT_PROXY_PORT = 55498;
/** the quest-card embed site (Day-23/quest-card-embed): a second origin for the CORS tests; the only one on the allowlist */
export const EMBED_ORIGIN = 'http://localhost:4100';

/**
 * Browser tests against a PRODUCTION build (`next build` + `next start`) and the local Supabase stack.
 * GitHub sign-in is switched on with a fake client id: the test follows the redirect to GitHub's authorize page and
 * stops there (the real consent screen needs a real OAuth app).
 *
 * Day 23: the app reaches Supabase through the fault proxy, so e2e/faults.spec.ts can make the database fail for real
 * (unavailable, slow) without any test switch in the app. Those tests run as their own project, AFTER all the others
 * and one at a time, because a database fault affects every page at once.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  workers: 4,
  reporter: 'list',
  globalTeardown: './e2e/teardown.ts',
  use: { baseURL: `http://localhost:${PORT}`, ...devices['Desktop Chrome'], channel: 'chrome' },
  projects: [
    { name: 'main', testIgnore: /faults\.spec\.ts/ },
    { name: 'faults', testMatch: /faults\.spec\.ts/, dependencies: ['main'] },
  ],
  webServer: [
    { command: 'node ../quest-card-embed/server.mjs', url: `${EMBED_ORIGIN}/`, reuseExistingServer: false, env: { PORT: '4100' } },
    { command: 'node inventory/fault-proxy.mjs', url: `http://127.0.0.1:${E2E_FAULT_PROXY_PORT}/__fault`, reuseExistingServer: false, env: { FAULT_PROXY_PORT: String(E2E_FAULT_PROXY_PORT) } },
    {
      command: `npm run build && npx next start -p ${PORT}`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: false,
      timeout: 240_000,
      env: {
        AUTH_GITHUB_ID: 'e2e-github-client', AUTH_GITHUB_SECRET: 'e2e-github-secret', NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
        SUPABASE_URL: `http://127.0.0.1:${E2E_FAULT_PROXY_PORT}`,
        CORS_ALLOWED_ORIGINS: EMBED_ORIGIN,
      },
    },
  ],
});
