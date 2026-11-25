// LIGHTHOUSE, signed in, on the production build served like a host would (scripts/perf/common.mjs serveDist).
//   PERF_LABEL=before RUNS=3 node scripts/perf/lighthouse.mjs   (run bundle.mjs first: it builds dist/)
//
// Each page is audited RUNS times on mobile (Lighthouse's default: a mid-range phone, slow 4G, 4x CPU slowdown,
// simulated) and on desktop; the report keeps the MEDIAN run by performance score (Lighthouse varies run to run).
// /login is audited signed out. Then the browser signs in once, through the real form, and the app pages are audited
// with the session kept (disableStorageReset) but the HTTP cache cleared before every run, so each is a first visit.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import puppeteer from 'puppeteer-core';
import { DOCS, LABEL, PROD_PORT, ROOT, localStack, perfRoom, serveDist, signIn } from './common.mjs';

const RUNS = Number(process.env.RUNS ?? 3);
const BASE = `http://127.0.0.1:${PROD_PORT}`;
const RAW = path.join(DOCS, 'lighthouse', LABEL); // full JSON reports: large, not committed

const METRICS = {
  lcp: 'largest-contentful-paint', fcp: 'first-contentful-paint', tbt: 'total-blocking-time', cls: 'cumulative-layout-shift', si: 'speed-index',
};

function summarise(lhr) {
  const audit = (id) => lhr.audits[id];
  const items = audit('resource-summary')?.details?.items ?? [];
  const byType = Object.fromEntries(items.map((i) => [i.resourceType, { requests: i.requestCount, bytes: i.transferSize }]));
  const opportunities = Object.values(lhr.audits)
    .filter((a) => a.details?.type === 'opportunity' && (a.score ?? 1) < 0.9 && (a.details.overallSavingsMs > 50 || a.details.overallSavingsBytes > 10_000))
    .sort((a, b) => (b.details.overallSavingsMs ?? 0) - (a.details.overallSavingsMs ?? 0))
    .slice(0, 5)
    .map((a) => ({ id: a.id, title: a.title, ms: Math.round(a.details.overallSavingsMs ?? 0), kb: Math.round((a.details.overallSavingsBytes ?? 0) / 1024) }));
  return {
    performance: Math.round(lhr.categories.performance.score * 100),
    accessibility: Math.round(lhr.categories.accessibility.score * 100),
    bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
    ...Object.fromEntries(Object.entries(METRICS).map(([key, id]) => [key, audit(id).numericValue])),
    totalKb: Math.round((byType.total?.bytes ?? 0) / 1024),
    scriptKb: Math.round((byType.script?.bytes ?? 0) / 1024),
    imageKb: Math.round((byType.image?.bytes ?? 0) / 1024),
    fontKb: Math.round((byType.font?.bytes ?? 0) / 1024),
    requests: byType.total?.requests ?? 0,
    opportunities,
  };
}

async function audit(port, url, formFactor, keepSession) {
  // clear the HTTP cache (not localStorage) so every run is a first visit
  const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${port}` });
  const [page] = await browser.pages();
  const session = await page.createCDPSession();
  await session.send('Network.clearBrowserCache');
  await session.detach();
  await browser.disconnect();
  const flags = { port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices'], disableStorageReset: keepSession };
  const result = await lighthouse(url, flags, formFactor === 'desktop' ? desktopConfig : undefined);
  return result.lhr;
}

export async function runLighthouse() {
  const stack = localStack();
  const room = await perfRoom(stack);
  const pages = [
    { name: 'Sign in', path: '/login', signedIn: false },
    { name: 'Dashboard', path: '/', signedIn: true },
    { name: 'Chat (Perf lab)', path: `/chat/${room.id}`, signedIn: true },
    { name: 'Notes', path: '/notes', signedIn: true },
    { name: 'Files', path: '/files', signedIn: true },
    { name: 'Profile', path: '/profile', signedIn: true },
  ];
  const server = await serveDist(path.join(ROOT, 'dist'), PROD_PORT);
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-first-run', '--no-default-browser-check'] });
  mkdirSync(RAW, { recursive: true });
  const results = [];
  try {
    let signedIn = false;
    for (const page of pages) {
      if (page.signedIn && !signedIn) {
        const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${chrome.port}` });
        const tab = await browser.newPage();
        await signIn(tab, BASE);
        await tab.close();
        await browser.disconnect();
        signedIn = true;
      }
      for (const formFactor of ['mobile', 'desktop']) {
        const runs = [];
        for (let i = 0; i < RUNS; i += 1) runs.push(await audit(chrome.port, `${BASE}${page.path}`, formFactor, page.signedIn));
        runs.sort((a, b) => a.categories.performance.score - b.categories.performance.score);
        const median = runs[Math.floor((runs.length - 1) / 2)];
        writeFileSync(path.join(RAW, `${page.path === '/' ? 'dashboard' : page.path.split('/')[1]}-${formFactor}.json`), JSON.stringify(median));
        const summary = { page: page.name, path: page.path.replace(room.id, ':room'), formFactor, scores: runs.map((r) => Math.round(r.categories.performance.score * 100)), ...summarise(median) };
        results.push(summary);
        console.log(`${page.name} ${formFactor}: performance ${summary.performance} (runs ${summary.scores.join(', ')}), LCP ${Math.round(summary.lcp)} ms, TBT ${Math.round(summary.tbt)} ms, CLS ${summary.cls.toFixed(3)}`);
      }
    }
  } finally {
    await chrome.kill();
    server.close();
  }
  writeFileSync(path.join(DOCS, `lighthouse-${LABEL}.json`), JSON.stringify(results, null, 2));
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) await runLighthouse();
