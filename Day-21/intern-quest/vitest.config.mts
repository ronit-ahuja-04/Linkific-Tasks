import path from 'node:path';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

const alias = {
  '@': path.resolve(import.meta.dirname, 'src'),
  // `server-only` throws unless bundled for React Server Components; the tests run server code directly in Node
  'server-only': path.resolve(import.meta.dirname, 'node_modules/server-only/empty.js'),
};
// The integration tests read .env.local (written by `npm run env:local`). Next.js's own loader skips .env.local
// when NODE_ENV is "test", on purpose, so Vite's loader is used here, and only for that project.
const localEnv = loadEnv('development', import.meta.dirname, '');

export default defineConfig({
  test: {
    projects: [
      // pure functions: no database, run anywhere
      { resolve: { alias }, test: { name: 'unit', include: ['test/unit/**/*.test.{ts,tsx}'], environment: 'node' } },
      // need the local Supabase stack (npm run db:start): the schema, and the API route handlers against it
      { resolve: { alias }, test: { name: 'integration', include: ['test/db/**/*.test.ts', 'test/api/**/*.test.ts'], environment: 'node', fileParallelism: false, env: localEnv } },
    ],
  },
});
