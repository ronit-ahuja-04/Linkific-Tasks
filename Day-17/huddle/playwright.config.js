import { defineConfig } from '@playwright/test';

// End-to-end tests drive the real app in Chrome against the REAL local Supabase stack (Postgres, Auth, Realtime,
// Storage). Start it first:  npm run db:start  (and  npm run env:local  once, to write .env).
// E2E_PROD=1 tests the production bundle instead of the dev server.
try {
  process.loadEnvFile('.env');
} catch {
  /* no .env yet: global-setup explains what to do */
}
const WEB = 'http://127.0.0.1:5176';

export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/global-setup.js',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: WEB,
    channel: 'chrome',
    headless: true,
    viewport: { width: 1360, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: process.env.E2E_PROD
      ? 'npx vite build --outDir node_modules/.e2e-dist --emptyOutDir && npx vite preview --outDir node_modules/.e2e-dist --port 5176 --strictPort --host 127.0.0.1'
      : 'npx vite --port 5176 --strictPort --host 127.0.0.1',
    url: WEB,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
