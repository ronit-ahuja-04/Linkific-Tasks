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
    // the same data as JSON, for the "by package" table in the report (not committed: node_modules/.perf)
    analyze && visualizer({ filename: 'node_modules/.perf/bundle-modules.json', template: 'raw-data', gzipSize: true }),
  ].filter(Boolean),
  build: {
    manifest: true,
    rolldownOptions: {
      output: {
        // VENDOR CHUNKS (Day 24): libraries change far less often than the app. In their own files (with their own
        // content hash), a deploy that only changes app code leaves them cached in returning visitors' browsers.
        // They are still part of the first download, so this is about repeat visits, not the first one.
        advancedChunks: {
          groups: [
            { name: 'react-vendor', test: /node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/ },
            { name: 'supabase-vendor', test: /node_modules[\\/](@supabase|iceberg-js)[\\/]/ },
          ],
        },
      },
    },
  },
});
