import { test as base, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

export const URL = process.env.VITE_SUPABASE_URL;
export const KEY = process.env.VITE_SUPABASE_ANON_KEY;
// Node 20 has no built-in WebSocket (Realtime needs one); a browser has it natively
const clientOptions = { auth: { persistSession: false, autoRefreshToken: false }, realtime: { transport: WebSocket } };
export const MAILPIT = 'http://127.0.0.1:54324';

/** Every test fails if the page logs a console error or warning, or throws an uncaught exception */
/** Collect console errors, warnings and uncaught exceptions of a page into `sink`; every test fails if there are any */
function watch(page, sink, label) {
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'verbose' && text.startsWith('[DOM]')) sink.push(`[${label}] ${text}`);
    // The browser logs every failed request ("Failed to load resource: ... 400/401/403/404/406"). These suites
    // trigger some on purpose (a wrong password, a private object opened without a signature, a replaced avatar):
    // the app handles them.
    else if ((type === 'error' || type === 'warning') && !/^Failed to load resource: the server responded with a status of (400|401|403|404|406|409|422)/.test(text)) {
      sink.push(`[${label}] console.${type}: ${text}`);
    }
  });
  page.on('pageerror', (error) => sink.push(`[${label}] pageerror: ${error.message}`));
}

export const test = base.extend({
  problems: [async ({}, use) => { const sink = []; await use(sink); expect(sink, 'console problems').toEqual([]); }, { auto: true }],
  page: async ({ page, problems }, use) => {
    watch(page, problems, 'A');
    await use(page);
  },
  // A second, independent browser (another person) with the same checks
  other: async ({ browser, problems }, use) => {
    const context = await browser.newContext({ viewport: { width: 1360, height: 900 } });
    const page = await context.newPage();
    watch(page, problems, 'B');
    await use(page);
    await context.close();
  },
});
export { expect };

let counter = 0;
/** A fresh user per test, so tests never depend on each other */
export function newUser(label = 'user') {
  counter += 1;
  const stamp = `${Date.now().toString(36)}${counter}`.replace(/[^a-z0-9]/g, '');
  return { email: `${label}.${stamp}@example.com`, password: 'Sturdy-Pass-2026', username: `${label}_${stamp}`.slice(0, 24), fullName: `Test ${label}` };
}

/** A supabase-js client acting for one user, in Node (no browser): used to attack the API directly */
export async function clientFor(user, { signUp = false } = {}) {
  const client = createClient(URL, KEY, clientOptions);
  if (signUp) {
    const { error } = await client.auth.signUp({ email: user.email, password: user.password, options: { data: { username: user.username, full_name: user.fullName } } });
    if (error) throw error;
  }
  const { data, error } = await client.auth.signInWithPassword({ email: user.email, password: user.password });
  if (error) throw error;
  return { client, id: data.user.id, accessToken: data.session.access_token };
}
/** A client that has only the public anon key: what any visitor to the website has */
export const anonClient = () => createClient(URL, KEY, clientOptions);

// ---- the local mail catcher (Mailpit): magic links and reset emails land here ---------------------------
export async function messagesTo(email) {
  const response = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`);
  return (await response.json()).messages ?? [];
}
/** The first link in the newest email to `email` whose URL contains `needle` */
export async function linkFromEmail(email, needle = '/auth/v1/verify') {
  const [latest] = await messagesTo(email);
  if (!latest) return null;
  const message = await (await fetch(`${MAILPIT}/api/v1/message/${latest.ID}`)).json();
  const links = [...(message.HTML ?? '').matchAll(/href="([^"]+)"/g), ...(message.Text ?? '').matchAll(/(https?:\/\/\S+)/g)].map((m) => m[1].replace(/&amp;/g, '&'));
  return links.find((l) => l.includes(needle)) ?? null;
}

export async function signUpUI(page, user) {
  await page.goto('/register');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByLabel(/^Username/).fill(user.username);
  await page.getByLabel(/^Full name/).fill(user.fullName);
  await page.getByRole('button', { name: /create account|sign up|register/i }).click();
  await page.waitForURL((url) => !/\/(register|login)/.test(url.pathname));
}

export async function signInUI(page, user) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL((url) => !/\/login/.test(url.pathname));
}

/** A link in the main navigation (the dashboard has links to the same pages) */
export const navLink = (page, name) => page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name });
