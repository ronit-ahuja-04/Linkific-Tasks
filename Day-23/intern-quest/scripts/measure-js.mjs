// Measures the JavaScript a browser downloads to open each page (what "bundle size" means for a visitor).
// Needs a running production server: `npm run build && npx next start -p 3122`, then `node scripts/measure-js.mjs`.
// Signs in with the demo account for the private pages. Per page it reports every script the browser fetched while
// the page loaded and settled, raw and gzipped (gzip is roughly what travels over the network).
import { gzipSync } from 'node:zlib';
import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3122';
const pages = [
  { path: '/', signedIn: false },
  { path: '/login', signedIn: false },
  { path: '/c/ronit', signedIn: false },
  { path: '/journal', signedIn: true },
  { path: '/journal/new', signedIn: true },
  { path: '/character', signedIn: true },
];

const browser = await chromium.launch({ channel: 'chrome' });
const signedIn = await browser.newContext();
{
  const page = await signedIn.newPage();
  await page.goto(`${BASE}/login`);
  // React streams content into a hidden placeholder before swapping it in: act on the visible field only
  await page.getByLabel('Email').filter({ visible: true }).fill('ronit@example.com');
  await page.getByLabel('Password').filter({ visible: true }).fill('demo-password-123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(`${BASE}/`);
  await page.close();
}
const signedOut = await browser.newContext();

const rows = [];
for (const { path, signedIn: auth } of pages) {
  const page = await (auth ? signedIn : signedOut).newPage();
  const scripts = new Map();
  page.on('response', async (response) => {
    if (response.request().resourceType() !== 'script') return;
    try { scripts.set(response.url(), await response.body()); } catch { /* aborted */ }
  });
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const bodies = [...scripts.values()];
  const raw = bodies.reduce((n, b) => n + b.length, 0);
  const gzip = bodies.reduce((n, b) => n + gzipSync(b).length, 0);
  rows.push({ path, files: bodies.length, rawKB: +(raw / 1024).toFixed(1), gzipKB: +(gzip / 1024).toFixed(1) });
  await page.close();
}
await browser.close();
console.table(rows);
console.log(JSON.stringify(rows));
