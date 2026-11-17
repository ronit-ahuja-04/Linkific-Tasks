// What each SDK costs in the browser: builds tiny apps that each import ONE thing and reports the JavaScript
// that would ship. Firebase is not a dependency of Huddle, so its cases are built inside the Day 15 project.
// Usage: node scripts/bundle-sizes.mjs
import { mkdirSync, rmSync, writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, resolve } from 'node:path';
import { build } from 'vite';

const roots = { supabase: process.cwd(), firebase: resolve('../../Day-15/flowlane-auth') };
const cases = [
  ['supabase-js: createClient (auth + database + realtime + storage in one client)', `import { createClient } from '@supabase/supabase-js'; window.x = createClient('http://localhost:54321', 'key');`],
  ['firebase: Auth only', `import { initializeApp } from 'firebase/app'; import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'; const app = initializeApp({ apiKey: 'k', projectId: 'p' }); window.x = [getAuth(app), signInWithEmailAndPassword];`],
  ['firebase: Firestore only', `import { initializeApp } from 'firebase/app'; import { getFirestore, collection, addDoc, onSnapshot, query, where } from 'firebase/firestore'; const app = initializeApp({ apiKey: 'k', projectId: 'p' }); window.x = [getFirestore(app), collection, addDoc, onSnapshot, query, where];`],
  ['firebase: Auth + Firestore', `import { initializeApp } from 'firebase/app'; import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'; import { getFirestore, collection, addDoc, onSnapshot, query, where } from 'firebase/firestore'; const app = initializeApp({ apiKey: 'k', projectId: 'p' }); window.x = [getAuth(app), signInWithEmailAndPassword, getFirestore(app), collection, addDoc, onSnapshot, query, where];`],
  ['firebase: Auth + Firestore + Storage', `import { initializeApp } from 'firebase/app'; import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'; import { getFirestore, collection, addDoc, onSnapshot, query, where } from 'firebase/firestore'; import { getStorage, ref, uploadBytes } from 'firebase/storage'; const app = initializeApp({ apiKey: 'k', projectId: 'p' }); window.x = [getAuth(app), signInWithEmailAndPassword, getFirestore(app), collection, addDoc, onSnapshot, query, where, getStorage(app), ref, uploadBytes];`],
];
console.log('| What is imported | Minified | Gzipped |\n|---|---:|---:|');
for (const [i, [label, code]] of cases.entries()) {
  const projectRoot = label.startsWith('supabase') ? roots.supabase : roots.firebase;
  const dir = join(projectRoot, 'node_modules', '.bundle-sizes', `case${i}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'entry.js'), code);
  await build({
    root: projectRoot, logLevel: 'silent', configFile: false,
    build: { outDir: join(dir, 'out'), emptyOutDir: true, minify: true, lib: { entry: join(dir, 'entry.js'), formats: ['es'], fileName: 'out' } },
  }).catch((e) => { console.log(`| ${label} | build failed: ${String(e.message).split('\n')[0]} | |`); });
  let file;
  try { file = readdirSync(join(dir, 'out')).find((f) => f.endsWith('.js')); } catch { continue; }
  if (!file) continue;
  const bytes = readFileSync(join(dir, 'out', file));
  console.log(`| ${label} | ${(bytes.length / 1024).toFixed(1)} kB | ${(gzipSync(bytes).length / 1024).toFixed(1)} kB |`);
}
for (const r of Object.values(roots)) rmSync(join(r, 'node_modules', '.bundle-sizes'), { recursive: true, force: true });
