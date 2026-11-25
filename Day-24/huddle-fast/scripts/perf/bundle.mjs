// BUNDLE REPORT: builds the app (with the treemap) and measures what the browser downloads.
//   PERF_LABEL=before node scripts/perf/bundle.mjs   -> docs/perf/bundle-before.html (treemap) and bundle-before.json
//
// "Initial" = the entry chunk and everything it imports statically: what EVERY first visit downloads before the app
// can render. "Lazy" = chunks loaded later by import(), e.g. a route or a heavy component.
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { DOCS, LABEL, ROOT } from './common.mjs';

const DIST = path.join(ROOT, 'dist');

export function build() {
  execSync('npx vite build', { cwd: ROOT, stdio: 'ignore', env: { ...process.env, ANALYZE: '1', PERF_LABEL: LABEL } });
}

const sizes = (file) => {
  const bytes = readFileSync(path.join(DIST, file));
  return { raw: bytes.length, gzip: zlib.gzipSync(bytes, { level: 9 }).length, brotli: zlib.brotliCompressSync(bytes).length };
};
const sum = (list, key) => list.reduce((total, item) => total + item[key], 0);

export function measureBundle() {
  const manifest = JSON.parse(readFileSync(path.join(DIST, '.vite', 'manifest.json'), 'utf8'));
  const entryKey = Object.keys(manifest).find((key) => manifest[key].isEntry);
  // the static import graph from the entry: all of it is needed before the first render
  const initial = new Set();
  const visit = (key) => {
    if (initial.has(key)) return;
    initial.add(key);
    for (const next of manifest[key].imports ?? []) visit(next);
  };
  visit(entryKey);
  const chunk = (key) => ({ name: manifest[key].name ?? key, file: manifest[key].file, ...sizes(manifest[key].file), css: (manifest[key].css ?? []) });
  const initialJs = [...initial].map(chunk);
  const lazyJs = Object.keys(manifest).filter((key) => !initial.has(key) && manifest[key].file.endsWith('.js')).map(chunk);
  const initialCss = [...new Set(initialJs.flatMap((c) => c.css))].map((file) => ({ file, ...sizes(file) }));
  const assets = readdirSync(path.join(DIST, 'assets'));
  const fonts = assets.filter((f) => /\.(woff2?|ttf)$/.test(f)).map((f) => ({ file: f, raw: readFileSync(path.join(DIST, 'assets', f)).length }));
  // fonts that the initial CSS points at (the browser fetches only those it actually needs for the text on screen)
  const initialCssText = initialCss.map((c) => readFileSync(path.join(DIST, c.file), 'utf8')).join('\n');
  const fontsInInitialCss = fonts.filter((f) => initialCssText.includes(f.file));

  const report = {
    label: LABEL,
    initial: { chunks: initialJs.length, raw: sum(initialJs, 'raw'), gzip: sum(initialJs, 'gzip'), brotli: sum(initialJs, 'brotli') },
    initialCss: { files: initialCss.length, raw: sum(initialCss, 'raw'), gzip: sum(initialCss, 'gzip') },
    lazy: { chunks: lazyJs.length, raw: sum(lazyJs, 'raw'), gzip: sum(lazyJs, 'gzip') },
    total: { raw: sum(initialJs, 'raw') + sum(lazyJs, 'raw'), gzip: sum(initialJs, 'gzip') + sum(lazyJs, 'gzip') },
    fonts: { files: fonts.length, raw: sum(fonts, 'raw'), referencedByInitialCss: fontsInInitialCss.length },
    chunks: [...initialJs.map((c) => ({ ...c, initial: true })), ...lazyJs.map((c) => ({ ...c, initial: false }))]
      .map(({ name, file, raw, gzip, initial: isInitial }) => ({ name, file, raw, gzip, initial: isInitial }))
      .sort((a, b) => b.gzip - a.gzip),
  };
  report.byPackage = byPackage(new Set(initialJs.map((c) => c.file)));
  mkdirSync(DOCS, { recursive: true });
  writeFileSync(path.join(DOCS, `bundle-${LABEL}.json`), JSON.stringify(report, null, 2));
  return report;
}

/**
 * What the INITIAL JavaScript is made of, by npm package (or app folder), from the visualizer's raw data.
 * Sizes are each module's gzip size inside the bundle (a little larger than its share of the gzipped file).
 */
function byPackage(initialFiles) {
  const raw = JSON.parse(readFileSync(path.join(ROOT, 'node_modules', '.perf', 'bundle-modules.json'), 'utf8'));
  const totals = new Map();
  for (const meta of Object.values(raw.nodeMetas)) {
    const id = meta.id;
    let key;
    if (id.includes('/node_modules/')) {
      const parts = id.split('/node_modules/').pop().split('/');
      key = parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
    } else if (id.includes('/src/')) {
      const parts = id.split('/src/').pop().split('/');
      key = `src/${parts.length > 1 ? parts[0] : parts[0]}`;
    } else continue;
    for (const [bundle, partId] of Object.entries(meta.moduleParts)) {
      if (!initialFiles.has(bundle)) continue;
      const part = raw.nodeParts[partId];
      const entry = totals.get(key) ?? { raw: 0, gzip: 0 };
      entry.raw += part.renderedLength;
      entry.gzip += part.gzipLength ?? 0;
      totals.set(key, entry);
    }
  }
  return [...totals.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.gzip - a.gzip).slice(0, 15);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  build();
  const r = measureBundle();
  for (const p of r.byPackage) console.log(`  ${p.name.padEnd(36)} ${(p.raw / 1024).toFixed(1).padStart(7)} KB  gzip ${(p.gzip / 1024).toFixed(1).padStart(6)} KB`);
  console.log(`initial JS: ${r.initial.chunks} chunks, ${(r.initial.gzip / 1024).toFixed(1)} KB gzip; lazy: ${r.lazy.chunks} chunks, ${(r.lazy.gzip / 1024).toFixed(1)} KB gzip; fonts: ${r.fonts.files} files`);
}
