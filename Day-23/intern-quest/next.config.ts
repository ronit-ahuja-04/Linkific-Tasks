import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Cache Components, the rendering model of Next.js 16 (as on Day 20)
  cacheComponents: true,
  partialPrefetching: true,
  // Day 23: publish browser source maps, so a production stack trace (in DevTools, or in a report sent to
  // /api/client-errors) can be read as the original source. The repository is public, so they reveal nothing new;
  // a private codebase would upload them to its error tracker instead. Server code is never in them.
  productionBrowserSourceMaps: true,
  // pin the project root (a stray package-lock.json higher up the disk would otherwise be picked up)
  turbopack: { root: path.resolve(import.meta.dirname) },
  // For the Docker image only: a self-contained server in .next/standalone (Vercel does not need it)
  ...(process.env.BUILD_STANDALONE === '1' ? { output: 'standalone' as const } : {}),
};

export default nextConfig;
