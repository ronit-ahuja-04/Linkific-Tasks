import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.{ts,tsx}'],
    setupFiles: ['test/setup.ts'],
    env: { VITE_SUPABASE_URL: 'http://127.0.0.1:54421', VITE_SUPABASE_ANON_KEY: 'test-anon-key' },
  },
});
