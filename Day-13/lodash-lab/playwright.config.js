import { defineConfig } from '@playwright/test';

// End-to-end tests drive the real app in Chrome. There is no backend: the data is generated in the browser.
// E2E_PROD=1 tests the production bundle (what a host would serve) instead of the dev server.
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5198',
    channel: 'chrome',
    headless: true,
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: process.env.E2E_PROD
      ? 'npx vite build --outDir node_modules/.e2e-dist --emptyOutDir && npx vite preview --outDir node_modules/.e2e-dist --port 5198 --strictPort --host 127.0.0.1'
      : 'npx vite --port 5198 --strictPort --host 127.0.0.1',
    url: 'http://127.0.0.1:5198',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
