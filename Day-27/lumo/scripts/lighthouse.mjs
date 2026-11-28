// Lighthouse scores for the production build: npm run build && npm run lighthouse [-- https://your-deploy.example]
//
// With no URL it serves dist/ with `vite preview` on :5181 and audits the public pages (mobile profile: slow 4G and
// a 4× slower CPU). Lighthouse runs through npx and the installed Chrome, so it adds nothing to package.json.
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const PAGES = ['/', '/taste', '/login', '/register'];
const target = process.argv[2]?.replace(/\/$/, '');
let server = null;
let base = target;
if (!base) {
  base = 'http://localhost:5181';
  server = spawn('npx', ['vite', 'preview', '--port', '5181', '--strictPort'], { stdio: 'ignore' });
  for (let i = 0; i < 40; i++) {
    try {
      if ((await fetch(base)).ok) break;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
}

const out = mkdtempSync(path.join(tmpdir(), 'lumo-lh-'));
const rows = [];
try {
  for (const page of PAGES) {
    const file = path.join(out, `${page.replace(/\W/g, '_') || 'home'}.json`);
    execFileSync(
      'npx',
      [
        '--yes',
        'lighthouse@12.6.1',
        base + page,
        '--quiet',
        '--chrome-flags=--headless=new',
        '--only-categories=performance,accessibility,best-practices,seo',
        '--output=json',
        `--output-path=${file}`,
      ],
      { stdio: 'ignore' },
    );
    const r = JSON.parse(readFileSync(file, 'utf8'));
    const score = (k) => Math.round(r.categories[k].score * 100);
    rows.push({
      page,
      performance: score('performance'),
      accessibility: score('accessibility'),
      'best practices': score('best-practices'),
      seo: score('seo'),
      LCP: r.audits['largest-contentful-paint'].displayValue,
      CLS: r.audits['cumulative-layout-shift'].displayValue,
    });
  }
} finally {
  server?.kill();
}
console.table(rows);
