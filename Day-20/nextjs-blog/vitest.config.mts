import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Unit tests of the pure library and of server-rendered components. Browser tests live in e2e/.
export default defineConfig({
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  test: { include: ['test/**/*.test.{ts,tsx}'], environment: 'node' },
});
