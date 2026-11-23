import AxeBuilder from '@axe-core/playwright';
import { test, expect, newUser, signUpUI } from './fixtures';

// The app shell, driven by keyboard only: tab order, visible focus, skip link, the phone menu, focus after navigation.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** What has focus right now, and whether its focus ring is visible (a 2px+ outline from :focus-visible) */
const focused = (page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    const style = getComputedStyle(el);
    const visibleText = (node) => {
      const copy = node.cloneNode(true);
      copy.querySelectorAll('[aria-hidden="true"]').forEach((hidden) => hidden.remove()); // as the accessibility tree reads it
      return copy.textContent;
    };
    const box = el.getBoundingClientRect();
    return {
      name: (el.getAttribute('aria-label') || visibleText(el) || '').trim().replace(/\s+/g, ' ').slice(0, 40),
      tag: el.tagName,
      ring: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2,
      inSidebar: Boolean(el.closest('.shell-sidebar')),
      inMain: Boolean(el.closest('main')),
      onScreen: box.bottom > 0 && box.top < window.innerHeight && box.right > 0 && box.left < window.innerWidth,
    };
  });

test.describe('app shell, desktop', () => {
  test('tab order: skip link, then the sidebar top to bottom, every stop with a visible focus ring, then the page', async ({ page }) => {
    await signUpUI(page, newUser('tabs'));
    await page.reload(); // start from the top of a freshly loaded page
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.keyboard.press('Tab');
    expect((await focused(page)).name).toBe('Skip to content');
    const stops = [];
    for (let i = 0; i < 40; i += 1) {
      await page.keyboard.press('Tab');
      const now = await focused(page);
      if (now.inMain) break;
      expect(now.inSidebar, `${now.name} is outside the sidebar`).toBe(true);
      expect(now.ring, `${now.name} has no visible focus ring`).toBe(true);
      expect(now.onScreen, `${now.name} is off screen`).toBe(true);
      stops.push(now.name);
    }
    expect(stops.slice(0, 7)).toEqual(['Huddle', 'Notifications, none unread', 'Switch to dark theme', 'Dashboard', 'Chat', 'Notes', 'Files']);
    expect(stops.slice(-4)).toEqual(['Query lab', 'Design system', 'Profile', 'Sign out']);
    expect(stops).not.toContain('Menu'); // the phone menu button is not a stop on a wide screen
  });

  test('the skip link jumps past the sidebar', async ({ page }) => {
    await signUpUI(page, newUser('skip'));
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
    await page.keyboard.press('Tab');
    expect((await focused(page)).inMain).toBe(true);
  });

  test('choosing a page by keyboard moves focus to its heading, and marks the link as current', async ({ page }) => {
    await signUpUI(page, newUser('keynav'));
    const nav = page.getByRole('navigation', { name: 'Main' });
    await nav.getByRole('link', { name: 'Notes', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/notes$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    await expect(nav.getByRole('link', { name: 'Notes', exact: true })).toHaveAttribute('aria-current', 'page');
  });

  test('landmarks: one banner, one main navigation, one main', async ({ page }) => {
    await signUpUI(page, newUser('marks'));
    await expect(page.getByRole('banner')).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(1);
    await expect(page.getByRole('main')).toHaveCount(1);
  });
});

test.describe('app shell, phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('one short bar; the menu opens, Escape closes it and focus goes back to the button', async ({ page }) => {
    await signUpUI(page, newUser('phonebar'));
    const bar = await page.getByRole('banner').boundingBox();
    expect(bar.height).toBeLessThanOrEqual(64); // Day 17's header wrapped to about 190px here
    const menu = page.getByRole('button', { name: 'Menu' });
    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav).toBeHidden();

    await menu.focus();
    await page.keyboard.press('Enter');
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(nav).toBeVisible();
    await page.keyboard.press('Tab'); // Huddle
    await page.keyboard.press('Tab'); // bell
    await page.keyboard.press('Tab'); // theme
    await page.keyboard.press('Tab');
    expect((await focused(page)).name).toBe('Dashboard');
    await page.keyboard.press('Escape');
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(nav).toBeHidden();
    await expect(menu).toBeFocused();
  });

  test('picking a page closes the menu and focuses the new heading', async ({ page }) => {
    await signUpUI(page, newUser('phonenav'));
    await page.getByRole('button', { name: 'Menu' }).click();
    const files = page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Files', exact: true });
    await files.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/files$/);
    await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  });

  test('tabbing out of the open menu closes it, so it never covers what has focus (WCAG 2.4.11)', async ({ page }) => {
    await signUpUI(page, newUser('phoneout'));
    const menu = page.getByRole('button', { name: 'Menu' });
    await menu.focus();
    await page.keyboard.press('Enter');
    for (let i = 0; i < 40; i += 1) {
      await page.keyboard.press('Tab');
      if ((await focused(page)).inMain) break;
    }
    const now = await focused(page);
    expect(now.inMain).toBe(true);
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    expect(now.onScreen).toBe(true);
  });

  for (const theme of ['light', 'dark']) {
    test(`open menu: no axe violations (WCAG 2.2) and no sideways scrolling at 320px, ${theme}`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('huddle-theme', t), theme);
      await signUpUI(page, newUser(`menu${theme}`));
      await page.setViewportSize({ width: 320, height: 720 });
      await page.getByRole('button', { name: 'Menu' }).click();
      await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(violations.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    });
  }
});
