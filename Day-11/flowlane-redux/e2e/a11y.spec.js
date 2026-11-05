import AxeBuilder from '@axe-core/playwright';
import { test, expect, uniqueEmail, signUp, addTask } from './fixtures.js';

/** WCAG 2.1 A and AA automated checks: every screen must have zero violations, in both themes */
async function expectAccessible(page, label) {
  // Let fade-in animations finish: axe would otherwise measure half-transparent colours
  await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {}))));
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const summary = result.violations.map(
    (v) => `${v.id} (${v.impact}) x${v.nodes.length}: ${v.help} -> ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`
  );
  expect(summary, `accessibility problems on "${label}"`).toEqual([]);
}

async function tour(page, theme) {
  await addTask(page, `${theme} task`);
  await expectAccessible(page, `${theme}: board`);
  await page.locator('.task-card').click();
  await expectAccessible(page, `${theme}: task panel (view)`);
  await page.locator('.modal-content').getByRole('button', { name: 'Edit Task' }).click();
  await expectAccessible(page, `${theme}: task panel (edit)`);
  await page.getByRole('button', { name: 'Close task panel' }).click();
  await page.getByRole('button', { name: 'Add Task' }).click();
  await expectAccessible(page, `${theme}: new task panel`);
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.locator('.sidebar .nav-item', { hasText: 'New Project' }).click();
  await expectAccessible(page, `${theme}: new project modal`);
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'Invite' }).click();
  await expectAccessible(page, `${theme}: invite box`);
  await page.locator('.project-header h1').click();
  await page.getByText('Activity', { exact: true }).click();
  await expectAccessible(page, `${theme}: project chat`);
  await page.locator('.nav-item', { hasText: 'Messages' }).click();
  await expectAccessible(page, `${theme}: messages`);
  await page.getByRole('button', { name: 'Notifications' }).click();
  await expectAccessible(page, `${theme}: notifications`);
  await page.getByRole('button', { name: '← Back to Dashboard' }).click();
  await page.locator('.nav-item', { hasText: 'Settings' }).click();
  await expectAccessible(page, `${theme}: settings`);
  await page.getByRole('button', { name: '← Back to Dashboard' }).click();
  await page.getByRole('button', { name: 'My profile' }).click();
  await expectAccessible(page, `${theme}: profile`);
  await page.getByRole('button', { name: '← Back to Dashboard' }).click();
}

test.describe('accessibility (WCAG 2.1 AA)', () => {
  test('sign-in and sign-up pages', async ({ page }) => {
    await page.goto('/auth');
    await expectAccessible(page, 'sign-in');
    await page.getByText('Sign up', { exact: true }).click();
    await expectAccessible(page, 'sign-up');
  });

  test('every screen, light theme', async ({ page }) => {
    await signUp(page, uniqueEmail('axelight'));
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await tour(page, 'light');
  });

  test('every screen, dark theme', async ({ page }) => {
    await signUp(page, uniqueEmail('axedark'));
    await page.getByTitle('Toggle Theme').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await tour(page, 'dark');
  });
});
