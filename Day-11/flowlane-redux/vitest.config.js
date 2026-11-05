import { defineConfig } from 'vitest/config';

// Unit tests only. Playwright tests (e2e/) and security-rules tests (test/rules/) have their own
// runners: `npm run test:e2e` and `npm run test:rules`.
export default defineConfig({
  test: { include: ['test/**/*.test.{js,jsx}'], exclude: ['node_modules/**', 'e2e/**', 'test/rules/**'] },
});
