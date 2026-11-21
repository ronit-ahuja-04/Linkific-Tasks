import { defineConfig, devices } from '@playwright/test';

const PORT = 3121;

/**
 * Browser tests against a PRODUCTION build (`next build` + `next start`) and the local Supabase stack.
 * GitHub sign-in is switched on with a fake client id: the test follows the redirect to GitHub's authorize page and
 * stops there (the real consent screen needs a real OAuth app).
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  workers: 4,
  reporter: 'list',
  globalTeardown: './e2e/teardown.ts',
  use: { baseURL: `http://localhost:${PORT}`, ...devices['Desktop Chrome'], channel: 'chrome' },
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 240_000,
    env: { AUTH_GITHUB_ID: 'e2e-github-client', AUTH_GITHUB_SECRET: 'e2e-github-secret', NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}` },
  },
});
