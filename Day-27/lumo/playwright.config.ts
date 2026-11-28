import { defineConfig } from '@playwright/test';

// End-to-end tests against the LOCAL stack (npm run db:start, npm run env:local). They create their own accounts
// and islands and remove them afterwards; e2e/helpers.ts refuses to run against anything but a local database.
// LUMO_E2E_URL runs the same tests against another server, such as the production build with its security headers
// (npm run build && npx vite preview --port 5181, then LUMO_E2E_URL=http://localhost:5181 npm run e2e).
const baseURL = process.env.LUMO_E2E_URL ?? 'http://localhost:5180';

export default defineConfig({
  testDir: 'e2e',
  // The journeys share one database, so they run one at a time.
  workers: 1,
  fullyParallel: false,
  timeout: 180_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL,
    channel: 'chrome',
    viewport: { width: 1280, height: 800 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.LUMO_E2E_URL
    ? undefined
    : { command: 'npm run dev', url: baseURL, reuseExistingServer: true },
});
