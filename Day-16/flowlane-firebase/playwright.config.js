import { defineConfig } from '@playwright/test';

// End-to-end tests drive the real app in Chrome against the Firebase Auth and Firestore EMULATORS
// (see `npm run test:e2e`), plus the small Express API (server/) and a FAKE GitHub API, so GitHub
// features run without a GitHub account. They use the real firestore.rules and never touch production.
// E2E_PROD=1 tests the production bundle (what a host serves) instead of the dev server.
const WEB = 'http://127.0.0.1:5199';
const API = 'http://127.0.0.1:4101';
const FAKE_GITHUB = 'http://127.0.0.1:4210';

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: WEB,
    channel: 'chrome',
    headless: true,
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      // a stand-in for api.github.com with fixed data (repos, 35 issues with pull requests mixed in)
      command: 'node server/src/dev/fake-github.js',
      url: `${FAKE_GITHUB}/user`,
      reuseExistingServer: false,
      timeout: 30_000,
      env: { FAKE_GITHUB_PORT: '4210' },
    },
    {
      // the real API code, pointed at the Auth emulator (it accepts the emulator's unsigned tokens) and the fake GitHub
      command: 'node server/src/index.js',
      url: `${API}/api/health`,
      reuseExistingServer: false,
      timeout: 30_000,
      env: {
        PORT: '4101',
        FIREBASE_PROJECT_ID: 'demo-flowlane',
        FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9199',
        GITHUB_API_URL: FAKE_GITHUB,
        CLIENT_URL: WEB,
        RATE_LIMIT_MAX: '1000',
        LOG_SILENT: 'true',
      },
    },
    {
      // E2E_PROD=1 tests the production bundle (what Vercel serves) instead of the dev server
      command: process.env.E2E_PROD
        ? 'npx vite build --outDir /tmp/flowlane-auth-e2e-dist --emptyOutDir && npx vite preview --outDir /tmp/flowlane-auth-e2e-dist --port 5199 --strictPort --host 127.0.0.1'
        : 'npx vite --port 5199 --strictPort --host 127.0.0.1',
      url: WEB,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        API_URL: API,
        VITE_USE_EMULATORS: 'true',
        VITE_FIREBASE_API_KEY: 'demo-key',
        VITE_FIREBASE_AUTH_DOMAIN: 'demo-flowlane.firebaseapp.com',
        VITE_FIREBASE_PROJECT_ID: 'demo-flowlane',
        VITE_FIREBASE_STORAGE_BUCKET: 'demo-flowlane.appspot.com',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '1',
        VITE_FIREBASE_APP_ID: '1:1:web:1',
      },
    },
  ],
});
