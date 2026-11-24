import { defineConfig, devices } from '@playwright/test';

/**
 * ERROR INVENTORY (not part of `npm run test:e2e`). Drives a production build through every failure we can produce and
 * RECORDS what a user would see; it asserts nothing. `npm run inventory` writes docs/errors/<label>.md and screenshots.
 *
 * Faults come from two places, and none needs a change to the app:
 *   - the browser: Playwright cuts the network, hangs or rewrites requests (page.route, context.setOffline);
 *   - the database: the app talks to Supabase through inventory/fault-proxy.mjs, which can be made slow or unavailable.
 * Runs one scenario at a time (a database fault affects every page), on its own ports, so it never touches the e2e run.
 */
export const APP_PORT = 3131;
export const PROXY_PORT = 55499;

export default defineConfig({
  testDir: 'inventory',
  workers: 1,
  fullyParallel: false,
  timeout: 90_000,
  reporter: 'list',
  globalSetup: './inventory/setup.ts',
  globalTeardown: './inventory/report.ts',
  use: { baseURL: `http://localhost:${APP_PORT}`, ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1100, height: 760 } },
  webServer: [
    { command: `node inventory/fault-proxy.mjs`, url: `http://127.0.0.1:${PROXY_PORT}/__fault`, reuseExistingServer: false, env: { FAULT_PROXY_PORT: String(PROXY_PORT) } },
    {
      // the server log is kept: the inventory shows what the server wrote for each failure
      command: `npm run build && npx next start -p ${APP_PORT} 2>&1 | tee inventory/.server.log`,
      url: `http://localhost:${APP_PORT}`,
      reuseExistingServer: false,
      timeout: 240_000,
      env: { SUPABASE_URL: `http://127.0.0.1:${PROXY_PORT}`, NEXT_PUBLIC_SITE_URL: `http://localhost:${APP_PORT}` },
    },
  ],
});
