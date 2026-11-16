import AxeBuilder from '@axe-core/playwright';
import { test, expect, uniqueEmail, signUp, sidebarProject, card, addTask, createProject } from './fixtures.js';

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const nameOf = (email) => email.split('@')[0];
const toast = (page, text) => page.locator('.toast', { hasText: text });
const snack = (page, text) => page.locator('.snack', { hasText: text });

async function invite(page, email) {
  const input = page.getByPlaceholder('Email address');
  if (!(await input.isVisible())) await page.getByRole('button', { name: 'Invite', exact: true }).click();
  await input.fill(email);
  await page.getByRole('button', { name: 'Send Invite' }).click();
}
async function team(page, newUserPage) {
  const emailA = uniqueEmail('alice');
  const emailB = uniqueEmail('bob');
  const b = await newUserPage('B');
  await signUp(page, emailA);
  await signUp(b, emailB);
  await createProject(page, 'Team Alpha');
  await expect(page.getByRole('heading', { name: 'Team Alpha' })).toBeVisible();
  await invite(page, emailB);
  await expect(snack(page, `Invitation sent to ${nameOf(emailB)}!`)).toBeVisible();
  await toast(b, 'invited you to').getByRole('button', { name: 'Accept' }).click();
  await expect(snack(b, 'You joined Team Alpha!')).toBeVisible();
  await sidebarProject(b, 'Team Alpha').click();
  await expect(b.getByRole('heading', { name: 'Team Alpha' })).toBeVisible();
  return { a: page, b, emailA, emailB };
}

const openLive = async (page) => {
  await page.getByRole('tab', { name: 'Live' }).click();
  await expect(page.getByRole('heading', { name: 'Live overview' })).toBeVisible();
};
const tile = (page, key) => page.getByTestId(`tile-${key}`).locator('.pulse-tile-value');

test.describe('live dashboard', () => {
  test('starts at zero and counts up as tasks are added', async ({ page }) => {
    await signUp(page, uniqueEmail('live'));
    await openLive(page);
    await expect(tile(page, 'total')).toHaveText('0');
    await expect(page.getByText(/No tasks yet/)).toBeVisible();
    await page.getByRole('tab', { name: 'Board' }).click();
    await addTask(page, 'First');
    await addTask(page, 'Second', { priority: 'high' });
    await openLive(page);
    await expect(tile(page, 'total')).toHaveText('2');
    await expect(tile(page, 'urgent')).toHaveText('1');
    await expect(page.getByTestId('column-todo')).toContainText('2');
    await expect(page.getByTestId('priority-high')).toContainText('1');
  });

  test('a teammate watching the tab sees every change at once, without reloading', async ({ page, newUserPage }) => {
    const { a, b } = await team(page, newUserPage);
    await openLive(b);
    await expect(tile(b, 'total')).toHaveText('0');
    await expect(b.getByTestId('pulse-age')).toContainText('Updated');

    // A adds three tasks, one of them high priority
    await addTask(a, 'One');
    await expect(tile(b, 'total')).toHaveText('1');
    await addTask(a, 'Two', { priority: 'high' });
    await addTask(a, 'Three');
    await expect(tile(b, 'total')).toHaveText('3');
    await expect(tile(b, 'urgent')).toHaveText('1');
    await expect(b.getByTestId('column-todo')).toContainText('3');

    // A moves a card to Done with the keyboard
    const one = card(a, 'One');
    await one.focus();
    await a.keyboard.press('Space');
    for (const key of ['ArrowRight', 'ArrowRight']) { await a.waitForTimeout(250); await a.keyboard.press(key); }
    await a.waitForTimeout(250);
    await a.keyboard.press('Space');
    await expect(tile(b, 'done')).toHaveText('1');
    await expect(b.getByTestId('tile-done')).toContainText('33% finished');
    await expect(b.getByTestId('column-done')).toContainText('1');
    await expect(b.getByTestId('column-todo')).toContainText('2');

    // A attaches an image
    await card(a, 'Two').click();
    await a.getByRole('dialog', { name: 'Task details' }).getByLabel('Choose an image to attach').setInputFiles({ name: 'p.png', mimeType: 'image/png', buffer: PNG });
    await expect(a.getByRole('img', { name: 'Attached image: p.png' })).toBeVisible();
    await expect(tile(b, 'images')).toHaveText('1');
  });

  test('the latest chat messages appear in the feed as they are sent, newest first, at most five', async ({ page, newUserPage }) => {
    const { a, b } = await team(page, newUserPage);
    await openLive(b);
    await expect(b.getByText('No messages yet. Say hi in the Activity tab!')).toBeVisible();
    await a.getByRole('tab', { name: 'Activity' }).click();
    for (let i = 1; i <= 6; i += 1) {
      await a.getByPlaceholder('Type a message...').fill(`message ${i}`);
      await a.getByRole('button', { name: 'Send message' }).click();
      await expect(a.locator('.chat-messages', { hasText: `message ${i}` })).toBeVisible();
    }
    const feed = b.getByTestId('chat-feed').getByRole('listitem');
    await expect(feed).toHaveCount(5);
    await expect(feed.first()).toContainText('message 6');
    await expect(feed.last()).toContainText('message 2'); // message 1 is older than the five newest
  });

  test('shows who has what, and the other projects', async ({ page, newUserPage }) => {
    const { a, b, emailA, emailB } = await team(page, newUserPage);
    await addTask(a, 'Assigned task');
    await card(a, 'Assigned task').click();
    const dialog = a.getByRole('dialog', { name: 'Task details' });
    await dialog.getByRole('button', { name: 'Edit' }).click();
    await dialog.getByRole('button', { name: '+' }).click();
    await a.getByText(nameOf(emailB), { exact: true }).last().click();
    await a.keyboard.press('Escape').catch(() => {});

    await openLive(b);
    await expect(b.getByTestId('unassigned')).toHaveCount(0); // everything open has someone on it
    // a task is assigned to its creator at once, and A then added B: one open task each
    await expect(b.locator('[data-testid^="person-"]')).toHaveCount(2);
    await expect(b.locator('[data-testid^="person-"]').filter({ hasText: nameOf(emailB) })).toContainText('1 open, 0 done');
    await expect(b.locator('[data-testid^="person-"]').filter({ hasText: nameOf(emailA) })).toContainText('1 open, 0 done');

    // the table lists both of B's projects (the default one and Team Alpha) and links to them
    await expect(b.locator('[data-testid^="project-"]')).toHaveCount(2);
    await expect(b.getByRole('link', { name: 'Team Alpha' })).toBeVisible();
    await expect(b.getByRole('link', { name: 'My First Project' })).toBeVisible();
    await b.getByRole('link', { name: 'My First Project' }).click();
    await expect(b.getByRole('heading', { name: 'My First Project' })).toBeVisible();
  });
});

for (const theme of ['light', 'dark']) {
  test(`the Live tab is accessible, ${theme} theme`, async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
    await signUp(page, uniqueEmail('axe'));
    await addTask(page, 'Something', { priority: 'high' });
    await openLive(page);
    await expect(tile(page, 'total')).toHaveText('1');
    await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {}))));
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const summary = result.violations.map((v) => `${v.id} (${v.impact}) x${v.nodes.length}: ${v.help} -> ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`);
    expect(summary).toEqual([]);
  });
}
