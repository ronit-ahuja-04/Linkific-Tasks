import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { defineConfig, loadEnv } from 'vite';

/**
 * `vite preview` serves the same security headers as Vercel (vercel.json), so the Content-Security-Policy is tested
 * locally before it ships. Locally the API is the local stack, so its origin is allowed in place of *.supabase.co.
 */
function productionHeaders(mode: string): Record<string, string> {
  const vercel = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8')) as {
    headers: { source: string; headers: { key: string; value: string }[] }[];
  };
  const all = vercel.headers.find((h) => h.source === '/(.*)')?.headers ?? [];
  const api = loadEnv(mode, process.cwd(), 'VITE_').VITE_SUPABASE_URL ?? '';
  const local = /^http:\/\/(127\.0\.0\.1|localhost)/.test(api) ? new URL(api) : null;
  return Object.fromEntries(
    all
      .filter((h) => h.key !== 'Strict-Transport-Security')
      .map((h) => [
        h.key,
        local && h.key === 'Content-Security-Policy'
          ? h.value
              .replaceAll('https://*.supabase.co', local.origin)
              .replace('wss://*.supabase.co', `ws://${local.host}`)
          : h.value,
      ]),
  );
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  preview: { headers: productionHeaders(mode) },
  build: {
    rolldownOptions: {
      output: {
        // Libraries change far less often than app code: separate chunks stay cached between deploys.
        advancedChunks: {
          groups: [
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
            },
            { name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/ },
            {
              name: 'state',
              test: /node_modules[\\/](@reduxjs|redux|react-redux|immer|reselect)[\\/]/,
            },
          ],
        },
      },
    },
  },
}));
