import AxeBuilder from '@axe-core/playwright';
import { test, expect, newUser, signUpUI, navLink, openPage } from './fixtures';

// Day 22: the full WCAG 2.2 AA rule set (Day 17 checked 2.1), in both themes, including the states that only
// appear after a click (an open room, open forms, the filters panel).
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const PAGES = ['Dashboard', 'Chat', 'Notes', 'Files', 'Query lab', 'Profile'];

async function audit(page, label) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const summary = violations.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
  expect(summary, `${label} has accessibility violations`).toEqual([]);
}

const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.describe('accessibility (axe, WCAG 2.2 AA)', () => {
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
      for (const name of PAGES) {
        await navLink(page, name).click();
        await expect(page.locator('h1').first()).toBeVisible();
        await page.waitForLoadState('networkidle');
        await audit(page, `${name} (${theme})`);
      }
    });

    test(`states behind a click in ${theme}: a room, the forms, the filters, the bell`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('huddle-theme', t), theme);
      await signUpUI(page, newUser(`a11ystate${theme}`));
      await navLink(page, 'Chat').click();
      await page.getByRole('button', { name: 'New room' }).click();
      await audit(page, `Chat, New room form (${theme})`);
      await page.getByLabel('Room name').fill(`Axe ${theme} ${Date.now().toString(36)}`);
      await page.getByRole('button', { name: 'Create room' }).click();
      await expect(page.getByLabel('Message', { exact: true })).toBeVisible(); // (an empty log has no height, so wait for the box)
      await page.getByLabel('Message', { exact: true }).fill('hello from the axe check'); // (no @: a real user might match it, and Enter would pick them from the list)
      await page.getByLabel('Message', { exact: true }).press('Enter');
      await expect(page.getByRole('log', { name: 'Messages' })).toContainText('hello');
      await audit(page, `Chat room with a message (${theme})`);
      await page.getByRole('button', { name: /^Notifications/ }).click();
      await audit(page, `Notification panel open (${theme})`);
      await page.keyboard.press('Escape');
      await navLink(page, 'Notes').click();
      await page.getByRole('button', { name: /More filters/ }).click();
      await page.getByRole('button', { name: 'New note' }).click();
      await audit(page, `Notes, filters and the new-note form open (${theme})`);
    });
  }

  test('no horizontal scrolling at 320px, the width WCAG 1.4.10 names (= 1280px at 400% zoom)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await signUpUI(page, newUser('mobile'));
    for (const name of PAGES) {
      await openPage(page, name); // the navigation is behind the Menu button on a phone
      await expect(navLink(page, name, { includeHidden: true })).toHaveAttribute('aria-current', 'page'); // the menu has closed again
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(400); // lazy route chunks: let the new page replace the old one before measuring
      const wide = await overflow(page);
      const culprits = wide > 0 ? await page.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1).slice(0, 4).map((e) => `${e.tagName}.${e.className}`)) : [];
      expect(wide, `${name} overflows horizontally (${culprits.join(', ')})`).toBeLessThanOrEqual(0);
    }
  });

  test('text at 200% (WCAG 1.4.4): every page still fits and nothing scrolls sideways', async ({ page }) => {
    await signUpUI(page, newUser('bigtext'));
    // the browser's text-size setting: everything is in rem, so doubling the root size doubles all text
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    for (const name of PAGES) {
      await openPage(page, name); // (a client-side route change: the style tag stays)
      await expect(page.locator('h1').first()).toBeVisible();
      await page.waitForLoadState('networkidle');
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe('32px');
      expect(await overflow(page), `${name} at 200% text`).toBeLessThanOrEqual(0);
    }
  });
});

test.describe('motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('"reduce motion" turns our animations off (WCAG 2.3.3 guidance)', async ({ page }) => {
    await page.goto('/login');
    const durations = await page.evaluate(() => ['--duration-fast', '--duration-base', '--duration-slow'].map((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim()));
    expect(durations).toEqual(['0ms', '0ms', '0ms']);
  });
});
