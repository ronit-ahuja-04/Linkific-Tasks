import { defineConfig } from '@playwright/test';

// End-to-end tests drive the real app in Chrome against the Firebase Auth and Firestore EMULATORS
// (see `npm run test:e2e`). They use the real firestore.rules and never touch production.
export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5199',
    channel: 'chrome',
    headless: true,
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    // E2E_PROD=1 tests the production bundle (what Vercel serves) instead of the dev server
    command: process.env.E2E_PROD
      ? 'npx vite build --outDir /tmp/flowlane-e2e-dist --emptyOutDir && npx vite preview --outDir /tmp/flowlane-e2e-dist --port 5199 --strictPort --host 127.0.0.1'
      : 'npx vite --port 5199 --strictPort --host 127.0.0.1',
    url: 'http://127.0.0.1:5199',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      VITE_USE_EMULATORS: 'true',
      VITE_FIREBASE_API_KEY: 'demo-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'demo-flowlane.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'demo-flowlane',
      VITE_FIREBASE_STORAGE_BUCKET: 'demo-flowlane.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '1',
      VITE_FIREBASE_APP_ID: '1:1:web:1',
    },
  },
});
