import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;

// Tests run against the PRODUCTION build (`next build` + `next start`): caching, prerendering and image optimisation
// only behave like the real thing there, not in `next dev`.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  workers: 4,
  reporter: 'list',
  use: { baseURL: `http://localhost:${PORT}`, ...devices['Desktop Chrome'], channel: 'chrome' },
  webServer: { command: `npm run build && npx next start -p ${PORT}`, url: `http://localhost:${PORT}`, reuseExistingServer: false, timeout: 240_000 },
});
