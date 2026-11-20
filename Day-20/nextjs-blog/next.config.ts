import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Cache Components: the rendering model of this version. `use cache` + `cacheLife` replace the old per-route
  // `revalidate` / `dynamic` settings (see the README, "Rendering strategies").
  cacheComponents: true,
  partialPrefetching: true,
  // Pin the project root: a stray package-lock.json higher up the disk would otherwise be picked up
  turbopack: { root: path.resolve(import.meta.dirname) },
};

export default nextConfig;
