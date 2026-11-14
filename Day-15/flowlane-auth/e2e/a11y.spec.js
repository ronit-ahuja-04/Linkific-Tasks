import AxeBuilder from '@axe-core/playwright';
import { test, expect, signIn, ADMIN, DEMO } from './fixtures';

const check = async (page) => {
  await page.waitForTimeout(500);
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
};

for (const theme of ['light', 'dark']) {
  test.describe(`axe WCAG 2.1 AA (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('flowlane-auth-theme', t), theme);
    });
    for (const path of ['/login', '/register', '/forgot-password']) {
      test(`${path}`, async ({ page }) => {
        await page.goto(path);
        await check(page);
      });
    }
    test('register with the strength meter showing', async ({ page }) => {
      await page.goto('/register');
      await page.getByLabel('Password', { exact: true }).fill('abc123');
      await check(page);
    });
    test('login with a form error', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await check(page);
    });
    test('dashboard with a board open', async ({ page }) => {
      await signIn(page, DEMO);
      await page.getByRole('button', { name: /^Website launch/ }).click();
      await expect(page.locator('[data-status="todo"]')).toBeVisible();
      await check(page);
    });
    test('security page', async ({ page }) => {
      await signIn(page, DEMO);
      await page.getByRole('link', { name: 'Security' }).click();
      await expect(page.locator('.session-item').first()).toBeVisible();
      await check(page);
    });
    test('admin page', async ({ page }) => {
      await signIn(page, ADMIN);
      await page.getByRole('link', { name: 'Admin' }).click();
      await expect(page.getByRole('table')).toBeVisible();
      await check(page);
    });
  });
}
