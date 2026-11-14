import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The browser only ever talks to its own origin. /api is forwarded to the Express server, so the
// refresh cookie is same-origin (SameSite=Strict works) and there is no CORS in development.
// Production would put both behind one host (a reverse proxy) for the same reason.
const target = process.env.API_URL ?? 'http://127.0.0.1:4000';
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': { target, changeOrigin: false } } },
  preview: { proxy: { '/api': { target, changeOrigin: false } } },
});
