import { defineConfig } from '@playwright/test';

// End-to-end tests drive the real client against the real Express server in Chrome. The server runs
// with an in-memory database, the demo accounts, the dev "outbox" (so tests can read the verification
// and password-reset emails) and the fake GitHub provider (so OAuth runs without credentials).
// E2E_PROD=1 tests the production client bundle (vite preview) instead of the dev server.
const API = 'http://127.0.0.1:4100';
const WEB = 'http://127.0.0.1:5174';

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: WEB,
    channel: 'chrome',
    headless: true,
    viewport: { width: 1280, height: 860 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'node server/src/index.js',
      url: `${API}/api/auth/providers`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        PORT: '4100',
        CLIENT_URL: WEB,
        JWT_SECRET: 'e2e-only-secret-not-for-real-use-0123456789',
        ACCESS_TTL_SECONDS: '30',
        BCRYPT_COST: '4',
        SEED_DEMO: 'true',
        ENABLE_DEV_OUTBOX: 'true',
        OAUTH_FAKE: 'true',
        DB_FILE: ':memory:',
        RATE_LIMIT_LOGIN_MAX: '1000',
        RATE_LIMIT_FORGOT_MAX: '1000',
        LOG_SILENT: 'true',
      },
    },
    {
      command: process.env.E2E_PROD
        ? 'cd client && npx vite build --outDir node_modules/.e2e-dist --emptyOutDir && npx vite preview --outDir node_modules/.e2e-dist --port 5174 --strictPort --host 127.0.0.1'
        : 'cd client && npx vite --port 5174 --strictPort --host 127.0.0.1',
      url: WEB,
      reuseExistingServer: false,
      timeout: 120_000,
      env: { API_URL: API },
    },
  ],
});
