import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The browser only talks to its own origin: /api is forwarded to the small Express API in server/
// (token verification and the GitHub proxy). No CORS is needed in development, and production would
// put both behind one host the same way (see vercel.json for the static part).
const api = process.env.API_URL ?? 'http://127.0.0.1:4000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': { target: api, changeOrigin: false } } },
  preview: { proxy: { '/api': { target: api, changeOrigin: false } } },
})
