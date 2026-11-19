import { defineConfig } from 'vitest/config';
import pkg from './package.json' with { type: 'json' };

// Unit and component tests only. Browser tests live in e2e/ and run with `npm run test:e2e`.
export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  test: { include: ['test/**/*.test.{ts,tsx}'], exclude: ['node_modules/**', 'e2e/**'], setupFiles: ['test/setup.ts'] },
});
