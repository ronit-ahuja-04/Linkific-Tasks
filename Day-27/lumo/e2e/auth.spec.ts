import { expect, test } from '@playwright/test';
import { PASSWORD, sql, stamp, watchErrors } from './helpers';

// Accounts beyond the happy path: a forgotten password, reset from a real email (the local stack's Mailpit inbox),
// and pages that don't exist.
const MAILPIT = 'http://127.0.0.1:54424';
const id = stamp();
const person = { name: 'Rhea Reset', handle: `rhea_${id}`, email: `e2e-reset-${id}@lumo.local` };

test.afterAll(() => {
  sql(`delete from auth.users where email = '${person.email}'`);
});

/** The newest email to an address, from Mailpit's API (polls until it arrives). */
async function latestEmailText(to: string): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const search = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`);
    const { messages } = (await search.json()) as { messages: { ID: string }[] };
    if (messages?.length) {
      const message = await fetch(`${MAILPIT}/api/v1/message/${messages[0]!.ID}`);
      const { HTML, Text } = (await message.json()) as { HTML: string; Text: string };
      return `${HTML}\n${Text}`;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`No email to ${to}`);
}

test('a forgotten password is reset from the emailed link', async ({ page, browser }) => {
  const errors = watchErrors(page);

  await test.step('sign up, with the handle suggested and the strength meter guiding', async () => {
    await page.goto('/register');
    await page.getByLabel('What should Wisp call you?').fill(person.name);
    await expect(page.getByLabel('Handle')).toHaveValue('rhea_reset');
    await page.getByLabel('Handle').fill(person.handle);
    await page.getByLabel('Email').fill(person.email);
    await page.getByLabel('Password', { exact: true }).fill('lanterns');
    await expect(page.getByText('Password strength: Weak.')).toBeVisible();
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Create my account' }).click();
    await page.waitForURL(/\/setup/);
  });

  const fresh = await browser.newContext();
  const p = await fresh.newPage();
  const resetErrors = watchErrors(p);
  const newPassword = `New lantern ${id}!`;

  await test.step('ask for a reset link from the sign-in screen', async () => {
    await p.goto('/login');
    await p.getByLabel('Email').fill(person.email);
    await p.getByRole('link', { name: 'Forgot your password?' }).click();
    await expect(p.getByLabel('Email')).toHaveValue(person.email); // carried over
    await p.getByRole('button', { name: 'Send me a reset link' }).click();
    await expect(p.getByRole('heading', { name: 'Check your inbox' })).toBeVisible();
  });

  await test.step('the emailed link opens the reset page, signed in for that purpose', async () => {
    const email = await latestEmailText(person.email);
    const link = email.match(/https?:\/\/[^\s"'<>]+\/auth\/v1\/verify\?[^\s"'<>]+/)?.[0];
    expect(link, 'reset link in the email').toBeTruthy();
    await p.goto(link!.replaceAll('&amp;', '&'));
    await p.waitForURL(/\/reset-password/);
    await expect(p.getByRole('heading', { name: 'Choose a new password' })).toBeVisible();
    await expect(p.getByText(`For ${person.name}.`)).toBeVisible();
    await p.getByLabel('New password', { exact: true }).fill(newPassword);
    await expect(p.getByText(/Password strength: (Strong|Great)\./)).toBeVisible();
    await p.getByRole('button', { name: 'Save my new password' }).click();
    await expect(p.getByText('Password changed. Welcome back!')).toBeVisible();
  });

  await test.step('the new password works and the old one doesn’t', async () => {
    const check = await browser.newContext();
    const c = await check.newPage();
    await c.goto('/login');
    await c.getByLabel('Email').fill(person.email);
    await c.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await c.getByRole('button', { name: 'Sign in' }).click();
    await expect(c.getByRole('alert').first()).toBeVisible();
    await c.getByLabel('Password', { exact: true }).fill(newPassword);
    await c.getByRole('button', { name: 'Sign in' }).click();
    await c.waitForURL((u) => !u.pathname.startsWith('/login'));
    await check.close();
  });

  await fresh.close();
  expect(errors).toEqual([]);
  expect(resetErrors).toEqual([]);
});

test('an unknown address shows the 404 island with a way home', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/islands/atlantis');
  await expect(page.getByRole('heading', { name: 'This island isn’t on the map' })).toBeVisible();
  await expect(page.getByText('/islands/atlantis')).toBeVisible();
  await page.getByRole('link', { name: /Back to the isles/ }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(errors).toEqual([]);
});
