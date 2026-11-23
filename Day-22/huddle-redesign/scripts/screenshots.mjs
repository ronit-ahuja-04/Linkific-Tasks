// Takes the before/after screenshots: the same pages, the same sizes, the same data, both themes.
//
//   npm run db:reset                  (the seed only, so both sets show the same data)
//   npm run dev                       (http://localhost:5177)
//   node scripts/screenshots.mjs before      -> docs/screenshots/before/*.jpg
//   node scripts/screenshots.mjs after       -> docs/screenshots/after/*.jpg
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const label = process.argv[2];
if (!label) {
  console.error('Usage: node scripts/screenshots.mjs <before|after>');
  process.exit(1);
}
const BASE = process.env.BASE_URL ?? 'http://localhost:5177';
const OUT = `docs/screenshots/${label}`;
mkdirSync(OUT, { recursive: true });

const desktop = { width: 1440, height: 900 };
const phone = { width: 390, height: 844 };
const PAGES = [
  { name: 'dashboard', path: '/' },
  { name: 'chat', path: '/chat' },
  { name: 'chat-room', path: '/chat', room: 'General' },
  { name: 'notes', path: '/notes' },
  { name: 'files', path: '/files' },
  { name: 'profile', path: '/profile' },
  { name: 'lab', path: '/lab' },
];
const PHONE_PAGES = ['dashboard', 'chat-room', 'notes'];

const browser = await chromium.launch({ channel: 'chrome' });

async function signedInContext(viewport, theme) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await context.addInitScript((mode) => localStorage.setItem('huddle-theme', mode), theme);
  const page = await context.newPage();
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').first().fill('ada@example.com');
  await page.getByLabel('Password', { exact: true }).first().fill('demo-password-123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(`${BASE}/`);
  return { context, page };
}

async function shoot(page, name) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 80 });
  console.log(`${OUT}/${name}.jpg`);
}

async function open(page, { path, room }) {
  await page.goto(`${BASE}${path}`);
  if (room) {
    await page.getByRole('link', { name: room }).first().click();
    await page.waitForURL(/\/chat\/.+/);
  }
}

// signed out: the auth pages
for (const theme of ['light', 'dark']) {
  const context = await browser.newContext({ viewport: desktop, reducedMotion: 'reduce' });
  await context.addInitScript((mode) => localStorage.setItem('huddle-theme', mode), theme);
  const page = await context.newPage();
  await page.goto(`${BASE}/login`);
  await shoot(page, `login-${theme}`);
  await context.close();
}
{
  const context = await browser.newContext({ viewport: phone, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(`${BASE}/login`);
  await shoot(page, 'login-phone');
  await context.close();
}

// signed in, desktop, both themes
for (const theme of ['light', 'dark']) {
  const { context, page } = await signedInContext(desktop, theme);
  for (const target of PAGES) {
    await open(page, target);
    await shoot(page, `${target.name}-${theme}`);
  }
  await context.close();
}

// signed in, phone, light
{
  const { context, page } = await signedInContext(phone, 'light');
  for (const target of PAGES.filter((p) => PHONE_PAGES.includes(p.name))) {
    await open(page, target);
    await shoot(page, `${target.name}-phone`);
  }
  await context.close();
}
await browser.close();
