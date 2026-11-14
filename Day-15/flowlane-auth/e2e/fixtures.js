import { test as base, expect } from '@playwright/test';

const GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
const LOCAL = new Set(['127.0.0.1', 'localhost']);

/** Stub everything that is not local (avatars, fonts, Google APIs) so tests are fast and offline-safe */
// Firebase's popup sign-in first loads Google's own script loader (apis.google.com) and its helper libraries
// (gstatic). Stubbed with an empty file, the popup never opens. Tests that drive a popup (GitHub) opt in with
// `test.use({ googleScripts: true })` and these two hosts go to the real network (internet needed for those tests).
const GOOGLE_SCRIPT_HOSTS = new Set(['apis.google.com', 'www.gstatic.com']);

async function stubExternal(context, { googleScripts = false } = {}) {
  await context.route(
    (url) => !LOCAL.has(url.hostname) && !(googleScripts && GOOGLE_SCRIPT_HOSTS.has(url.hostname)),
    (route) => {
      const type = route.request().resourceType();
      if (type === 'image') return route.fulfill({ status: 200, contentType: 'image/gif', body: GIF });
      if (type === 'stylesheet') return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
      return route.fulfill({ status: 200, contentType: 'text/plain', body: '' });
    }
  );
}

/** Collect console errors, warnings and uncaught exceptions; every test fails if there are any */
function watch(page, sink, label) {
  page.on('console', (msg) => {
    const type = msg.type();
    if (process.env.E2E_VERBOSE) console.log(`[${label}] ${type}: ${msg.text()} @ ${msg.location().url}`);
    // Chrome's "Issues" hints (missing autocomplete, form fields without id or label, ...) arrive as
    // verbose [DOM] messages. They count as problems too.
    if (type === 'verbose' && msg.text().startsWith('[DOM]')) { sink.push(`[${label}] ${msg.text()}`); return; }
    if (type !== 'error' && type !== 'warning') return;
    // Firebase Auth loads Google's sign-in popup script from apis.google.com. These tests stub every
    // external request, so that load is empty; the message is a test artefact, not an app problem.
    if (msg.text().includes("Couldn't load preload assets")) return;
    // The browser itself logs "Failed to load resource: 400" when Firebase Auth correctly rejects a
    // wrong password or a duplicate email. That is the expected failure path, not an app problem.
    if (msg.text().startsWith('Failed to load resource') && msg.location().url.includes('/identitytoolkit')) return;
    // The Firestore SDK retries its write channel when a connection to the emulator is recycled and
    // says so with a warning (and the browser logs the dropped request). Data is not lost: writes are
    // retried. Only this exact noise is ignored; every other Firestore warning or error still fails.
    // The same goes for the Listen stream, which is torn down when someone signs out while a request is in flight.
    if (/WebChannelConnection RPC '(Write|Listen)' stream/.test(msg.text()) && msg.text().includes('transport errored')) return;
    if (msg.text().startsWith('Failed to load resource') && /\/google\.firestore\.v1\.Firestore\/(Write|Listen)\/channel/.test(msg.location().url)) return;
    // Our own API answers 401 on purpose in a few tests (an expired token, a rejected GitHub token) and the
    // browser logs each failed request. The app handles them; they are not problems.
    if (msg.text().startsWith('Failed to load resource') && msg.location().url.includes('/api/') && /status of 40[01]/.test(msg.text())) return;
    // Same for Firebase refusing an expired or revoked refresh token on purpose
    if (msg.text().startsWith('Failed to load resource') && msg.location().url.includes('securetoken.googleapis.com')) return;
    sink.push(`[${label}] console.${type}: ${msg.text()}`);
  });
  page.on('pageerror', (err) => sink.push(`[${label}] uncaught: ${err.message}`));
}

export const test = base.extend({
  // A helper that opens another independent browser (another user) with the same checks
  problems: [async ({}, use) => { const sink = []; await use(sink); expect(sink, 'console problems').toEqual([]); }, { auto: true }],
  googleScripts: [false, { option: true }],
  page: async ({ context, page, problems, googleScripts }, use) => {
    await stubExternal(context, { googleScripts });
    watch(page, problems, 'A');
    await use(page);
  },
  newUserPage: async ({ browser, problems, googleScripts }, use) => {
    const contexts = [];
    await use(async (label = 'B') => {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      contexts.push(context);
      await stubExternal(context, { googleScripts });
      const page = await context.newPage();
      watch(page, problems, label);
      return page;
    });
    for (const c of contexts) await c.close();
  },
});

export { expect };

let counter = 0;
export const uniqueEmail = (prefix = 'user') => `${prefix}${Date.now().toString(36)}${counter++}@test.dev`;

/** Create an account through the sign-up form and wait for the dashboard */
export async function signUp(page, email, password = 'secret123') {
  await page.goto('/auth');
  await page.getByText('Sign up', { exact: true }).click();
  await page.getByPlaceholder('hello@flowlane.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
  await expect(page.getByText('Your Projects')).toBeVisible();
  // The account is only fully set up once the profile and the first project have been saved; a test
  // that navigates away sooner would race Firebase writing the login session to browser storage
  await expect(page.getByRole('heading', { name: 'My First Project' })).toBeVisible();
}

export async function signIn(page, email, password = 'secret123') {
  await page.goto('/auth');
  await page.getByPlaceholder('hello@flowlane.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page.getByText('Your Projects')).toBeVisible();
}

export async function signOut(page) {
  await page.getByRole('button', { name: 'My profile' }).click();
  await page.getByRole('button', { name: 'Sign Out' }).click();
  await expect(page).toHaveURL(/\/auth$/);
}

export const sidebarProject = (page, name) => page.locator('.sidebar .nav-item', { hasText: name });
export const column = (page, status) => page.locator(`.column[data-status="${status}"]`);
export const card = (page, text) => page.locator('.task-card', { hasText: text });

/** Create a task as the project owner via the draft panel */
export async function addTask(page, title, { description = '', priority } = {}) {
  await page.getByRole('button', { name: 'Add Task' }).click();
  await page.getByPlaceholder('Task Title').fill(title);
  if (description) await page.getByPlaceholder('Add a more detailed description...').fill(description);
  if (priority) await page.locator('.modal-content select').selectOption(priority);
  await page.getByRole('button', { name: 'Create Task' }).click();
  await expect(card(page, title)).toBeVisible();
}

/** Create a project from the sidebar modal */
export async function createProject(page, name, ownerEmail = '') {
  await page.locator('.sidebar .nav-item', { hasText: 'New Project' }).click();
  await page.getByPlaceholder('e.g. Website Redesign').fill(name);
  if (ownerEmail) await page.getByPlaceholder('Leave blank to assign yourself').fill(ownerEmail);
  await page.getByRole('button', { name: 'Create Project' }).click();
}

// ---------------------------------------------------------------------------------------------
// Day 15 helpers: the Auth emulator's "emails" and its fake GitHub popup
// ---------------------------------------------------------------------------------------------
export const EMULATOR = 'http://127.0.0.1:9199';
export const PROJECT = 'demo-flowlane';
export const STRONG = 'Tr1cky-Horse-Battery-77';

/** The emails the Auth emulator "sent": [{ email, requestType: 'VERIFY_EMAIL' | 'PASSWORD_RESET', oobCode }] */
export async function emailsTo(request, email) {
  const response = await request.get(`${EMULATOR}/emulator/v1/projects/${PROJECT}/oobCodes`);
  const { oobCodes } = await response.json();
  return oobCodes.filter((m) => m.email === email);
}
export async function latestCode(request, email, requestType) {
  const mails = (await emailsTo(request, email)).filter((m) => m.requestType === requestType);
  return mails.at(-1)?.oobCode;
}

/**
 * Click something that opens Firebase's GitHub popup and finish it. In the emulator the popup is a small
 * form: pick the account (or add one with an email and a GitHub username) and sign in. The same email always
 * means the same GitHub account, which is what re-authenticating needs.
 */
export async function throughGithubPopup(page, trigger, { email, login = 'octocat' }) {
  const popupPromise = page.context().waitForEvent('page');
  await trigger();
  const popup = await popupPromise;
  await popup.waitForLoadState('domcontentloaded');
  const existing = popup.getByText(email, { exact: true });
  if (await existing.count()) {
    await existing.first().click();
  } else {
    await popup.getByText(/add new account/i).click();
    await popup.locator('#email-input').fill(email);
    await popup.locator('#display-name-input').fill('The Octocat');
    await popup.locator('#screen-name-input').fill(login);
    await popup.locator('#sign-in').click();
  }
  await popup.waitForEvent('close').catch(() => {}); // the popup closes itself when done
}

/** Switch an account off in the Auth emulator (what an admin disabling a user does): its sessions stop working */
export async function disableUser(request, email) {
  const headers = { Authorization: 'Bearer owner' };
  const found = await request.post(`${EMULATOR}/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:query`, { headers, data: { returnUserInfo: true } });
  const user = (await found.json()).userInfo?.find((u) => u.email === email);
  if (!user) throw new Error(`no emulator account for ${email}`);
  const update = await request.post(`${EMULATOR}/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:update`, { headers, data: { localId: user.localId, disableUser: true } });
  if (!update.ok()) throw new Error(`could not disable ${email}: ${update.status()}`);
}
