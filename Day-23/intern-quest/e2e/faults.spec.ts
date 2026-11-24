import { expect, test, type Page } from '@playwright/test';
import { E2E_FAULT_PROXY_PORT } from '../playwright.config';
import { logQuest, newAdventurer, visible } from './helpers';

/**
 * Day 23: the DATABASE fails, for real. The app reaches Supabase through inventory/fault-proxy.mjs, which these tests
 * switch to "unavailable" (PostgREST's own 503) or "slow". Nothing in the app knows it is being tested.
 * Runs after every other test, one at a time ('faults' project in playwright.config.ts).
 */
test.describe.configure({ mode: 'serial' });

const dbFault = async (mode: 'pass' | 'unavailable' | 'slow', ms = 0) => {
  await fetch(`http://127.0.0.1:${E2E_FAULT_PROXY_PORT}/__fault?mode=${mode}&ms=${ms}`, { method: 'POST' });
};
test.afterEach(() => dbFault('pass'));

const heading = (page: Page) => visible(page.getByRole('heading', { level: 1 }));
const nav = (page: Page) => page.getByRole('navigation', { name: 'Main' });

test('a page that fails keeps the navigation; moving away and back works; Try again recovers (E-3)', async ({ page }) => {
  await newAdventurer(page);
  await dbFault('unavailable');
  await page.goto('/journal');
  await expect(heading(page)).toHaveText('This page could not load');
  await expect(heading(page)).toBeFocused();
  await expect(visible(page.getByText('The problem is on our side, and it has been logged.'))).toBeVisible();
  await expect(visible(page.locator('.error-ref code'))).toHaveText(/^\d+$/); // the digest, the same id as the server log line
  // the shell is still there and works: it needs no database
  await expect(visible(nav(page).getByRole('link', { name: 'Journal' }))).toHaveAttribute('aria-current', 'page');
  await visible(nav(page).getByRole('link', { name: 'Character' })).click();
  await page.waitForURL('/character');
  await expect(visible(nav(page).getByRole('link', { name: 'Character' }))).toHaveAttribute('aria-current', 'page');
  await expect(heading(page)).toHaveText('This page could not load');
  // the database comes back: Try again re-fetches the page in place
  await dbFault('pass');
  await visible(page.getByRole('button', { name: 'Try again' })).click();
  await expect(heading(page)).toHaveText('Your character');
});

test('home page: only the leaderboard fails, the rest of the page stays (E-5)', async ({ page }) => {
  await newAdventurer(page);
  await logQuest(page, { title: 'Expires the board cache' }); // a write expires the cached board: the next read needs the database
  await expect(page.getByRole('dialog', { name: 'Quest complete!' })).toBeVisible();
  await dbFault('unavailable');
  await page.goto('/');
  await expect(heading(page)).toHaveText('Your internship, as a role-playing game.');
  await expect(visible(page.getByRole('link', { name: 'Start your quest' })).first()).toBeVisible();
  const board = page.locator('.home-board');
  await expect(board.locator('.error-title')).toHaveText('The guild board could not load');
  await dbFault('pass');
  await board.getByRole('button', { name: 'Try again' }).click();
  await expect(board.locator('.board-card').first()).toBeVisible();
});

test('a public character sheet fails on a branded screen with a way home (status stays 200: E-6)', async ({ page }) => {
  const handle = await newAdventurer(page);
  await logQuest(page, { title: 'Expires the sheet cache' });
  await expect(page.getByRole('dialog', { name: 'Quest complete!' })).toBeVisible();
  await dbFault('unavailable');
  const response = await page.goto(`/c/${handle}`);
  // the prerendered shell was already sent with 200 when the read failed (Cache Components streaming), as for not-found
  expect(response?.status()).toBe(200);
  await expect(heading(page)).toHaveText('This page could not load');
  await expect(visible(page.getByRole('link', { name: 'Home' }))).toBeVisible();
  await expect(page.locator('meta[name="robots"][content="noindex"]').first()).toBeAttached();
});

test('saving while the database is down: a clear message with a reference, the form kept (S10)', async ({ page }) => {
  await newAdventurer(page);
  await visible(page.getByRole('link', { name: /Log day/ })).click();
  await visible(page.getByLabel('Title')).fill('During a real outage');
  await visible(page.getByRole('button', { name: 'React', exact: true })).click();
  await dbFault('unavailable');
  await visible(page.getByRole('button', { name: 'Publish quest' })).click();
  await expect(visible(page.locator('.editor .form-error'))).toHaveText(/^Intern Quest can not reach its database right now\. Try again in a moment\. \(ref [0-9a-f]{8}\)$/);
  await expect(visible(page.getByLabel('Title'))).toHaveValue('During a real outage');
});

test('a database slower than the 5 s deadline: the save ends with the outage message, not an endless spinner (S13)', async ({ page }) => {
  await newAdventurer(page);
  await visible(page.getByRole('link', { name: /Log day/ })).click();
  await visible(page.getByLabel('Title')).fill('Slow database');
  await visible(page.getByRole('button', { name: 'React', exact: true })).click();
  await dbFault('slow', 30_000);
  const started = Date.now();
  await visible(page.getByRole('button', { name: 'Publish quest' })).click();
  await expect(visible(page.locator('.editor .form-error'))).toContainText('can not reach its database', { timeout: 15_000 });
  expect(Date.now() - started).toBeLessThan(12_000);
  await expect(visible(page.getByRole('button', { name: 'Publish quest' }))).toBeEnabled();
});
