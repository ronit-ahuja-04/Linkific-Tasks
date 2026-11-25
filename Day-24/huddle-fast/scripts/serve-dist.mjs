// SERVE the production build the way a static host would (Day 24): brotli/gzip, the caching rules in
// public/_headers, and every unknown path answered with index.html (the app's routes).
//
//   npm run build && node scripts/serve-dist.mjs          http://127.0.0.1:4190  (PORT=… to change)
//
// `vite preview` serves dist/ too, but uncompressed and without _headers, so Lighthouse scores it lower than a real
// host would. This is the same server `npm run perf` measures with (scripts/perf/common.mjs).
import { existsSync } from 'node:fs';
import path from 'node:path';
import { serveDist } from './perf/common.mjs';

const dist = path.resolve(import.meta.dirname, '../dist');
if (!existsSync(path.join(dist, 'index.html'))) throw new Error('No build found: run `npm run build` first.');
const port = Number(process.env.PORT ?? 4190);
await serveDist(dist, port);
console.log(`Huddle (production build) on http://127.0.0.1:${port}  (Ctrl+C to stop)`);
