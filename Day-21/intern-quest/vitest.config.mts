import path from 'node:path';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

const alias = { '@': path.resolve(import.meta.dirname, 'src') };
// The database tests read .env.local (written by `npm run env:local`). Next.js's own loader skips .env.local
// when NODE_ENV is "test", on purpose, so Vite's loader is used here, and only for the db project.
const localEnv = loadEnv('development', import.meta.dirname, '');

export default defineConfig({
  test: {
    projects: [
      // pure functions: no database, run anywhere
      { resolve: { alias }, test: { name: 'unit', include: ['test/unit/**/*.test.{ts,tsx}'], environment: 'node' } },
      // need the local Supabase stack (npm run db:start)
      { resolve: { alias }, test: { name: 'db', include: ['test/db/**/*.test.ts'], environment: 'node', fileParallelism: false, env: localEnv } },
    ],
  },
});
