// INTERACTIONS: what happens while the app is USED, not only while it loads.
//   PERF_LABEL=before node scripts/perf/interactions.mjs   (run bundle.mjs first: it builds dist/)
//
// Two passes over the same scenarios, signed in as the perf test user (scripts/perf-data.mjs):
//   1. RENDERS on the dev server (component names are readable there): React's DevTools hook counts every component
//      that rendered (scripts/perf/render-counter.js). Counting is not timing, so dev mode is fine for it.
//   2. TIMINGS on the production build: the Event Timing API (what INP is built on) for each key press, long tasks,
//      and for pages, the image bytes and layout shift.
// The scenario that matters most is a LONG CHAT SESSION: the Perf lab room after loading 450 earlier messages
// (500 on screen), then typing a message and receiving new ones, as a team chat open all day would.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { rolldown } from 'rolldown';
import { DEV_PORT, DOCS, LABEL, PROD_PORT, ROOT, localStack, median, perfRoom, rest, serveDist, signIn } from './common.mjs';

const EARLIER_PAGES = 9; // 50 + 9 x 50 = 500 messages on screen
const TYPED = 'Shipping the release notes today'; // 32 key presses

async function bundleCounter() {
  const build = await rolldown({ input: path.join(import.meta.dirname, 'render-counter.js'), logLevel: 'silent' });
  const { output } = await build.generate({ format: 'iife' });
  await build.close();
  return output[0].code;
}

async function startDevServer() {
  const child = spawn('npx', ['vite', '--port', String(DEV_PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore', detached: true });
  const url = `http://127.0.0.1:${DEV_PORT}`;
  for (let i = 0; i < 60; i += 1) {
    try {
      if ((await fetch(url)).ok) return { url, stop: () => process.kill(-child.pid) };
    } catch { /* not yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('The dev server did not start');
}

async function openLongChat(page, base, roomId) {
  await page.goto(`${base}/chat/${roomId}`);
  const log = page.locator('[role="log"]');
  await log.locator('li').first().waitFor();
  for (let i = 0; i < EARLIER_PAGES; i += 1) {
    const before = await log.locator('li').count();
    await page.getByRole('button', { name: 'Load earlier messages' }).click();
    await page.waitForFunction((n) => document.querySelectorAll('[role="log"] li').length > n, before);
  }
  return log.locator('li').count();
}

/** Insert messages from another member, as Realtime would deliver them in a busy room */
async function receive(stack, room, count) {
  for (let i = 0; i < count; i += 1) {
    await rest(stack, 'messages', { method: 'POST', body: JSON.stringify({ room_id: room.id, user_id: room.others[i % room.others.length], body: `Incoming message ${i + 1} for the measurement` }), headers: { Prefer: 'return=minimal' } });
    await new Promise((r) => setTimeout(r, 150));
  }
}

async function cleanupIncoming(stack, room) {
  await rest(stack, `messages?room_id=eq.${room.id}&body=like.Incoming%20message*`, { method: 'DELETE' });
  await rest(stack, `messages?room_id=eq.${room.id}&body=eq.${encodeURIComponent(TYPED)}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------- pass 1: renders (dev)

async function measureRenders(stack, room, counter) {
  const dev = await startDevServer();
  const browser = await chromium.launch({ channel: 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  await context.addInitScript({ content: counter });
  const page = await context.newPage();
  const renders = {};
  const read = () => page.evaluate(() => window.__renders.read());
  const reset = () => page.evaluate(() => window.__renders.reset());
  try {
    await signIn(page, dev.url);
    const onScreen = await openLongChat(page, dev.url, room.id);
    await page.waitForTimeout(500);
    await reset();
    await page.locator('#chat-input').pressSequentially(TYPED, { delay: 30 });
    await page.waitForTimeout(300);
    renders.typing = { onScreen, ...(await read()) };
    await page.locator('#chat-input').fill('');
    await page.waitForTimeout(300);
    await reset();
    await receive(stack, room, 5);
    await page.waitForFunction(() => [...document.querySelectorAll('[role="log"] li')].filter((li) => li.textContent.includes('Incoming message')).length >= 5);
    await page.waitForTimeout(300);
    renders.receiving = { onScreen, ...(await read()) };

    await page.goto(`${dev.url}/notes`);
    await page.locator('#notes-search-input').waitFor();
    await page.waitForTimeout(800);
    await reset();
    await page.locator('#notes-search-input').pressSequentially('deployment', { delay: 30 });
    await page.waitForTimeout(300);
    renders.notesSearchTyping = await read();
  } finally {
    await browser.close();
    dev.stop();
    await cleanupIncoming(stack, room);
  }
  return renders;
}

// ---------------------------------------------------------------- pass 2: timings and bytes (production build)

const OBSERVE = () => {
  window.__perf = { events: [], longTasks: [], shifts: 0 };
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) if (e.interactionId) window.__perf.events.push(e.duration);
  }).observe({ type: 'event', durationThreshold: 16, buffered: true });
  new PerformanceObserver((list) => { for (const e of list.getEntries()) window.__perf.longTasks.push(e.duration); }).observe({ type: 'longtask', buffered: true });
  new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__perf.shifts += e.value; }).observe({ type: 'layout-shift', buffered: true });
};

async function measureTimings(stack, room) {
  const server = await serveDist(path.join(ROOT, 'dist'), PROD_PORT);
  const base = `http://127.0.0.1:${PROD_PORT}`;
  const browser = await chromium.launch({ channel: 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  await context.addInitScript(OBSERVE);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  const out = {};
  try {
    await signIn(page, base);
    // a 4x slower CPU, like Lighthouse's mobile run: differences that hide on a fast laptop become visible
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    const started = Date.now();
    await page.goto(`${base}/chat/${room.id}`);
    await page.locator('[role="log"] li').first().waitFor();
    out.openRoomMs = Date.now() - started;
    out.onScreen = await openLongChat(page, base, room.id);
    out.domNodes = await page.evaluate(() => document.getElementsByTagName('*').length);
    await page.evaluate(() => { window.__perf.events = []; window.__perf.longTasks = []; });
    await page.locator('#chat-input').pressSequentially(TYPED, { delay: 50 });
    await page.waitForTimeout(500);
    const typing = await page.evaluate(() => window.__perf);
    out.typing = { interactions: typing.events.length, worstMs: Math.max(0, ...typing.events), medianMs: median(typing.events) ?? 0, longTaskMs: Math.round(typing.longTasks.reduce((a, b) => a + b, 0)) };
    await page.locator('#chat-input').fill('');

    await page.evaluate(() => { window.__perf.longTasks = []; });
    await receive(stack, room, 5);
    await page.waitForFunction(() => [...document.querySelectorAll('[role="log"] li')].filter((li) => li.textContent.includes('Incoming message')).length >= 5);
    await page.waitForTimeout(500);
    out.receivingLongTaskMs = Math.round((await page.evaluate(() => window.__perf.longTasks)).reduce((a, b) => a + b, 0));
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });

    // images and layout shift on the pages that show pictures (a fresh page each, so the counts are per page)
    out.pages = {};
    for (const [name, url] of [['Files', '/files'], ['Profile', '/profile'], ['Chat', `/chat/${room.id}`], ['Dashboard', '/']]) {
      const fresh = await context.newPage();
      const images = [];
      fresh.on('response', async (response) => {
        if ((response.headers()['content-type'] ?? '').startsWith('image/')) {
          const body = await response.body().catch(() => null);
          images.push({ url: response.url(), bytes: body?.length ?? 0 });
        }
      });
      await fresh.goto(`${base}${url}`, { waitUntil: 'networkidle' });
      await fresh.waitForTimeout(800);
      const shifts = await fresh.evaluate(() => window.__perf.shifts);
      const rendered = await fresh.evaluate(() => [...document.images].filter((img) => img.complete && img.naturalWidth > 0).map((img) => ({ natural: img.naturalWidth, shown: Math.round(img.getBoundingClientRect().width) })));
      out.pages[name] = {
        imageRequests: images.length,
        imageKb: Math.round(images.reduce((a, b) => a + b.bytes, 0) / 1024),
        biggestImageKb: Math.round(Math.max(0, ...images.map((i) => i.bytes)) / 1024),
        // how many times wider the downloaded picture is than the space it is shown in (1 = just right)
        worstOversize: rendered.length ? Math.max(...rendered.filter((r) => r.shown > 0).map((r) => +(r.natural / r.shown).toFixed(1))) : null,
        cls: +shifts.toFixed(3),
      };
      await fresh.close();
    }
  } finally {
    await browser.close();
    server.close();
    await cleanupIncoming(stack, room);
  }
  return out;
}

export async function runInteractions() {
  const stack = localStack();
  const room = await perfRoom(stack);
  const counter = await bundleCounter();
  const renders = await measureRenders(stack, room, counter);
  const timings = await measureTimings(stack, room);
  const result = { label: LABEL, renders, timings };
  mkdirSync(DOCS, { recursive: true });
  writeFileSync(path.join(DOCS, `interactions-${LABEL}.json`), JSON.stringify(result, null, 2));
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = await runInteractions();
  console.log(JSON.stringify({ typing: { onScreen: r.renders.typing.onScreen, commits: r.renders.typing.commits, total: r.renders.typing.total, top: Object.entries(r.renders.typing.byComponent).slice(0, 6) }, receiving: { total: r.renders.receiving.total, top: Object.entries(r.renders.receiving.byComponent).slice(0, 5) }, notes: { total: r.renders.notesSearchTyping.total, top: Object.entries(r.renders.notesSearchTyping.byComponent).slice(0, 5) }, timings: r.timings }, null, 1));
}
