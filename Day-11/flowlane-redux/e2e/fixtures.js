import { test as base, expect } from '@playwright/test';

const GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
const LOCAL = new Set(['127.0.0.1', 'localhost']);

/** Stub everything that is not local (avatars, fonts, Google APIs) so tests are fast and offline-safe */
async function stubExternal(context) {
  await context.route(
    (url) => !LOCAL.has(url.hostname),
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
    if (msg.text().includes("WebChannelConnection RPC 'Write' stream") && msg.text().includes('transport errored')) return;
    if (msg.text().startsWith('Failed to load resource') && msg.location().url.includes('/google.firestore.v1.Firestore/Write/channel')) return;
    sink.push(`[${label}] console.${type}: ${msg.text()}`);
  });
  page.on('pageerror', (err) => sink.push(`[${label}] uncaught: ${err.message}`));
}

export const test = base.extend({
  // A helper that opens another independent browser (another user) with the same checks
  problems: [async ({}, use) => { const sink = []; await use(sink); expect(sink, 'console problems').toEqual([]); }, { auto: true }],
  page: async ({ context, page, problems }, use) => {
    await stubExternal(context);
    watch(page, problems, 'A');
    await use(page);
  },
  newUserPage: async ({ browser, problems }, use) => {
    const contexts = [];
    await use(async (label = 'B') => {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      contexts.push(context);
      await stubExternal(context);
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
