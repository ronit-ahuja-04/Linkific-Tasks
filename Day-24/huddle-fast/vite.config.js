import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// ANALYZE=1 (scripts/perf/bundle.mjs) adds the bundle treemap, Vite's counterpart of webpack-bundle-analyzer.
// The manifest (dist/.vite/manifest.json) maps each source module to its chunk: the measurements read it to tell
// the JavaScript a first visit needs from what loads later.
const analyze = process.env.ANALYZE === '1';

export default defineConfig({
  plugins: [
    react(),
    analyze && visualizer({ filename: `docs/perf/bundle-${process.env.PERF_LABEL ?? 'before'}.html`, template: 'treemap', gzipSize: true, brotliSize: true, title: `Huddle bundle (${process.env.PERF_LABEL ?? 'before'})` }),
  ].filter(Boolean),
  build: { manifest: true },
});
