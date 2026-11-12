// Lists every distinct Lodash method imported in src/ (the "at least 10 methods" deliverable).
// Usage: node scripts/methods-used.mjs [--json]
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : /\.(js|jsx)$/.test(name) ? [path] : [];
});

export function methodsUsed(dir = 'src') {
  const found = new Map();
  for (const file of walk(dir)) {
    for (const m of readFileSync(file, 'utf8').matchAll(/from\s+['"]lodash\/([A-Za-z]+)['"]/g)) {
      found.set(m[1], [...(found.get(m[1]) ?? []), file]);
    }
  }
  return [...found.keys()].sort();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const list = methodsUsed();
  console.log(process.argv.includes('--json') ? JSON.stringify(list) : `${list.length} distinct Lodash methods imported:\n${list.join(', ')}`);
}
