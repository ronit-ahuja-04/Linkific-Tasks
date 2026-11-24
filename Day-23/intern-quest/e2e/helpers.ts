import { expect, type Page } from '@playwright/test';

/**
 * Shared steps. Note `.filter({ visible: true })`: hidden copies of elements can be in the DOM for two reasons:
 *   - Next.js keeps pages you leave alive but hidden (React <Activity>);
 *   - while a page streams, React holds arriving content in a hidden placeholder before swapping it in.
 * Tests act only on what the user can actually see.
 */
export const unique = (prefix = 'e2e') => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
export const visible = <T extends { filter: (o: { visible: boolean }) => T }>(locator: T): T => locator.filter({ visible: true });

export async function registerNew(page: Page, name = 'E2E Hero'): Promise<string> {
  const email = `${unique()}@test.invalid`;
  await page.goto('/register');
  await visible(page.getByLabel('Name')).fill(name);
  await visible(page.getByLabel('Email')).fill(email);
  await visible(page.getByLabel('Password')).fill('a long test password');
  await visible(page.getByRole('button', { name: 'Start your quest' })).click();
  await page.waitForURL('/');
  return email;
}

export async function signInAs(page: Page, email: string, password = 'demo-password-123'): Promise<void> {
  await page.goto('/login');
  await visible(page.getByLabel('Email')).fill(email);
  await visible(page.getByLabel('Password')).fill(password);
  await visible(page.getByRole('button', { name: 'Sign in' })).click();
  await page.waitForURL('/');
}

/** Register and create a Frontend Mage; returns the handle */
export async function newAdventurer(page: Page): Promise<string> {
  return (await newAdventurerAccount(page)).handle;
}

/** The same, also returning the account's email (its password is 'a long test password') */
export async function newAdventurerAccount(page: Page): Promise<{ handle: string; email: string }> {
  const handle = unique('hero').slice(0, 24).replace(/-$/, 'x');
  const email = await registerNew(page, 'Quest Tester');
  await page.goto('/character');
  await visible(page.getByLabel('Handle')).fill(handle);
  await visible(page.getByRole('radio', { name: /Frontend Mage/ })).click();
  await visible(page.getByRole('button', { name: 'Create character' })).click();
  await page.waitForURL('/journal');
  await expect(visible(page.getByRole('heading', { level: 1 }))).toHaveText('Day 1 awaits.');
  return { handle, email };
}

export async function logQuest(page: Page, fields: { title: string; difficulty?: string; skills?: string[]; pr?: string; blockers?: string; isPublic?: boolean; draft?: boolean }) {
  await visible(page.getByRole('link', { name: /Log day/ })).click();
  await page.waitForURL('/journal/new');
  await visible(page.getByLabel('Title')).fill(fields.title);
  if (fields.difficulty) await visible(page.getByRole('button', { name: fields.difficulty, exact: true })).click();
  for (const skill of fields.skills ?? ['React']) await visible(page.getByRole('button', { name: skill, exact: true })).click();
  if (fields.pr) {
    await visible(page.getByRole('button', { name: '+ Add a PR link' })).click();
    await visible(page.getByLabel('Pull request link 1')).fill(fields.pr);
  }
  if (fields.blockers) await visible(page.getByLabel(/Blockers/)).fill(fields.blockers);
  if (fields.isPublic === false) await visible(page.getByLabel('Show on my public sheet')).uncheck();
  await visible(page.getByRole('button', { name: fields.draft ? 'Save as draft' : 'Publish quest' })).click();
}
