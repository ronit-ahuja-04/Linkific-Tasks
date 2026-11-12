// Builds four tiny apps that each use ONLY debounce, and reports the JavaScript that ships.
// Usage: node scripts/bundle-sizes.mjs
import { mkdirSync, rmSync, writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
import { build } from 'vite';

const root = join(process.cwd(), 'node_modules', '.bundle-sizes');
const cases = [
  ['import _ from "lodash"  →  _.debounce', 'import _ from "lodash"; window.x = _.debounce(() => 1, 100);'],
  ['import { debounce } from "lodash"', 'import { debounce } from "lodash"; window.x = debounce(() => 1, 100);'],
  ['import debounce from "lodash/debounce"', 'import debounce from "lodash/debounce"; window.x = debounce(() => 1, 100);'],
  ['import { debounce } from "lodash-es"', 'import { debounce } from "lodash-es"; window.x = debounce(() => 1, 100);'],
];
rmSync(root, { recursive: true, force: true });
console.log('| Import style | Minified | Gzipped |\n|---|---:|---:|');
for (const [i, [label, code]] of cases.entries()) {
  const dir = join(root, `case${i}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'entry.js'), code);
  await build({
    root: process.cwd(), logLevel: 'silent', configFile: false,
    build: { outDir: join(dir, 'out'), emptyOutDir: true, minify: true, lib: { entry: join(dir, 'entry.js'), formats: ['es'], fileName: 'out' } },
  });
  const file = readdirSync(join(dir, 'out')).find((f) => f.endsWith('.js'));
  const bytes = readFileSync(join(dir, 'out', file));
  console.log(`| \`${label}\` | ${(bytes.length / 1024).toFixed(1)} kB | ${(gzipSync(bytes).length / 1024).toFixed(1)} kB |`);
}
rmSync(root, { recursive: true, force: true });
