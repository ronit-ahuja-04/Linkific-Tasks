import { defineConfig } from 'vitest/config';

// Unit and component tests only. Browser tests live in e2e/ and run with `npm run test:e2e`.
export default defineConfig({
  test: { include: ['test/**/*.test.{js,jsx}'], exclude: ['node_modules/**', 'e2e/**'], setupFiles: ['test/setup.js'] },
});
