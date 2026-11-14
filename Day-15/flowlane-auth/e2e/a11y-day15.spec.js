import AxeBuilder from '@axe-core/playwright';
import { test, expect, uniqueEmail, signUp, throughGithubPopup, STRONG } from './fixtures.js';

// The GitHub popup needs Google's script loader (see fixtures.js)
test.use({ googleScripts: true });

/** WCAG 2.1 A and AA: zero violations on every screen Day 15 added, in both themes */
async function expectAccessible(page, label) {
  await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {}))));
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const summary = result.violations.map((v) => `${v.id} (${v.impact}) x${v.nodes.length}: ${v.help} -> ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`);
  expect(summary, `accessibility problems on "${label}"`).toEqual([]);
}

for (const theme of ['light', 'dark']) {
  test.describe(`Day 15 screens, ${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
    });

    test('sign in, sign up (weak and strong password), forgot password, invalid links', async ({ page }) => {
      await page.goto('/auth');
      await expectAccessible(page, 'sign in with GitHub button, remember me, forgot link');
      await page.getByText('Sign up', { exact: true }).click();
      await page.getByPlaceholder('••••••••').fill('abc');
      await expectAccessible(page, 'sign up with a weak password: meter and tips');
      await page.getByPlaceholder('••••••••').fill(STRONG);
      await expectAccessible(page, 'sign up with a strong password');
      await page.goto('/forgot-password');
      await expectAccessible(page, 'forgot password');
      await page.getByLabel('Email').fill('someone@example.com');
      await page.getByRole('button', { name: 'Send reset link' }).click();
      await expect(page.getByText('Check your email')).toBeVisible();
      await expectAccessible(page, 'forgot password, confirmation');
      await page.goto('/auth/action?mode=verifyEmail&oobCode=nonsense');
      await expect(page.getByRole('heading', { name: 'This link did not work' })).toBeVisible();
      await expectAccessible(page, 'verification link that failed');
      await page.goto('/auth/action');
      await expectAccessible(page, 'invalid action link');
    });

    test('the inactivity notice on the sign-in page', async ({ page }) => {
      await page.clock.install();
      await signUp(page, uniqueEmail('a11yidle'), STRONG);
      await page.clock.fastForward('31:00');
      await expect(page.getByText('You were signed out after a period of inactivity.')).toBeVisible();
      await expectAccessible(page, 'sign in with the idle notice');
    });

    test('dashboard with the verify-email banner, Security tab, import dialog (connect step)', async ({ page }) => {
      await signUp(page, uniqueEmail('a11ydash'), STRONG);
      await expect(page.getByText(/Please confirm your email address/)).toBeVisible();
      await expectAccessible(page, 'dashboard with the verify-email banner and the Import button');
      await page.getByRole('button', { name: 'Import from GitHub' }).click();
      await expect(page.getByText('Connect your GitHub account')).toBeVisible();
      await expectAccessible(page, 'import dialog, connect step');
      await page.keyboard.press('Escape');
      await page.goto('/settings');
      await page.getByRole('tab', { name: 'Security' }).click();
      await expect(page.getByRole('button', { name: 'Refresh token now' })).toBeVisible();
      await expectAccessible(page, 'settings, security tab');
      await page.getByRole('button', { name: 'Ask the API' }).click();
      await expect(page.getByText(/emulator-unsigned/)).toBeVisible();
      await expectAccessible(page, 'security tab after asking the API');
    });

    test('import dialog: repositories and issues', async ({ page }) => {
      await page.goto('/auth');
      await throughGithubPopup(page, () => page.getByRole('button', { name: 'Continue with GitHub' }).click(), { email: uniqueEmail('a11ygh') });
      await expect(page.getByRole('heading', { name: 'My First Project' })).toBeVisible();
      await page.getByRole('button', { name: 'Import from GitHub' }).click();
      await expect(page.getByText('octocat/hello-flowlane', { exact: true })).toBeVisible();
      await expectAccessible(page, 'import dialog, repositories');
      await page.getByText('octocat/hello-flowlane', { exact: true }).click();
      await expect(page.getByText('Issue 34: Export to CSV')).toBeVisible();
      await page.getByLabel('Select all').check();
      await expectAccessible(page, 'import dialog, issues selected');
      await page.getByRole('button', { name: /^Import 25 issues$/ }).click();
      await page.keyboard.press('Escape');
      await expect(page.locator('.task-card', { hasText: 'Issue 34' })).toBeVisible();
      await expectAccessible(page, 'board with imported GitHub issues and badges');
      await page.locator('.task-card', { hasText: 'Issue 34' }).click();
      await expectAccessible(page, 'task panel with the GitHub link');
    });
  });
}
