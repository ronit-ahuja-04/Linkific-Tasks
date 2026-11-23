import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './fixtures';
import { CONTRAST_PAIRS } from '../src/lib/contrast.js';

// The design system page is held to the full WCAG 2.2 AA rule set, in both themes
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

test.describe('design system (/styleguide)', () => {
  for (const theme of ['light', 'dark']) {
    test(`no axe violations, and every token pair passes, in ${theme}`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('huddle-theme', t), theme);
      await page.goto('/styleguide');
      await expect(page.getByRole('heading', { level: 1, name: 'Huddle design system' })).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      // The page measures the live CSS in the browser; it must agree with npm run contrast
      const total = CONTRAST_PAIRS.length * 2;
      await expect(page.getByRole('status')).toHaveText(`${total} of ${total} pairs pass (${CONTRAST_PAIRS.length} pairs × 2 themes).`);
      await expect(page.locator('.sg-verdict.is-fail')).toHaveCount(0);
      const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(violations.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    });
  }

  test('fonts load from the app itself (no third-party font requests)', async ({ page }) => {
    const external = [];
    page.on('request', (r) => { if (r.resourceType() === 'font' && !r.url().startsWith('http://127.0.0.1:5177')) external.push(r.url()); });
    await page.goto('/styleguide');
    await page.waitForLoadState('networkidle');
    expect(await page.evaluate(() => document.fonts.check('16px "Inter Variable"'))).toBe(true);
    expect(await page.evaluate(() => document.fonts.check('16px "JetBrains Mono Variable"'))).toBe(true);
    expect(external).toEqual([]);
  });

  test('reflows to 320px wide with no horizontal scrolling (WCAG 1.4.10)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/styleguide');
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('keyboard: skip link first, then the section links jump to their headings', async ({ page }) => {
    await page.goto('/styleguide');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible(); // the page is a lazy chunk: wait for it
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page.locator('#sg-main')).toBeFocused();

    await page.getByRole('navigation', { name: 'On this page' }).getByRole('link', { name: 'Contrast' }).click();
    await expect(page).toHaveURL(/#sg-contrast$/);
    await expect(page.getByRole('heading', { level: 2, name: 'Contrast' })).toBeInViewport();
  });

  test('the theme toggle switches every token on the page', async ({ page }) => {
    await page.goto('/styleguide');
    const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const light = await bg();
    await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect.poll(bg).not.toBe(light);
  });
});
