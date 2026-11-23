import AxeBuilder from '@axe-core/playwright';
import { test, expect, newUser, signUpUI, navLink } from './fixtures';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function audit(page, label) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const summary = violations.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
  expect(summary, `${label} has accessibility violations`).toEqual([]);
}

test.describe('accessibility (axe, WCAG 2.1 AA)', () => {
  for (const theme of ['light', 'dark']) {
    test(`signed-out pages in ${theme}`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('huddle-theme', t), theme);
      for (const path of ['/login', '/register', '/forgot-password']) {
        await page.goto(path);
        await expect(page.locator('h1').first()).toBeVisible();
        await audit(page, `${path} (${theme})`);
      }
    });

    test(`signed-in pages in ${theme}`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('huddle-theme', t), theme);
      await signUpUI(page, newUser(`a11y${theme}`));
      for (const name of ['Dashboard', 'Chat', 'Notes', 'Files', 'Query lab', 'Profile']) {
        await navLink(page, name).click();
        await expect(page.locator('h1').first()).toBeVisible();
        await page.waitForLoadState('networkidle');
        await audit(page, `${name} (${theme})`);
      }
    });
  }

  test('no horizontal scrolling on a phone-sized screen', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await signUpUI(page, newUser('mobile'));
    for (const name of ['Dashboard', 'Chat', 'Notes', 'Files', 'Query lab', 'Profile']) {
      await navLink(page, name).click();
      await expect(navLink(page, name)).toHaveAttribute('aria-current', 'page');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(400); // lazy route chunks: let the new page replace the old one before measuring
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      const wide = overflow > 0 ? await page.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1).slice(0, 4).map((e) => `${e.tagName}.${e.className}`)) : [];
      expect(overflow, `${name} overflows horizontally (${wide.join(', ')})`).toBeLessThanOrEqual(0);
    }
  });
});
