import { expect, test } from '@playwright/test';
import { logQuest, newAdventurer, registerNew, visible } from './helpers';

test.describe('home page', () => {
  test('explains the game and shows the Guild hall leaderboard, highest XP first', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Intern Quest: your internship as a role-playing game');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Your internship, as a role-playing game.');
    const first = page.locator('.board-card').first();
    await expect(first).toContainText('#1');
    await expect(first).toContainText('Ronit');
    await expect(first).toContainText('Level 9 Adept');
    await first.click();
    await expect(page).toHaveURL('/c/ronit');
  });

  test('signed out it offers sign-in; signed in it offers your journal', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Start your quest' }).first()).toBeVisible();
    await registerNew(page, 'Home Visitor');
    await expect(page.getByRole('link', { name: 'Open my journal' })).toBeVisible();
    await expect(page.locator('.account-name')).toHaveText('Home Visitor');
  });
});

test.describe('character sheets: SEO and status codes', () => {
  test('each sheet has its own title, description, canonical URL and Open Graph / Twitter tags', async ({ page }) => {
    await page.goto('/c/ronit');
    await expect(page).toHaveTitle('Ronit · Level 9 Adept | Intern Quest');
    const meta = (selector: string) => page.locator(selector).first().getAttribute('content');
    expect(await meta('meta[name="description"]')).toMatch(/^Ronit has completed 20 quests and earned 4,055 XP, strongest in React/);
    expect(await meta('meta[property="og:type"]')).toBe('profile');
    expect(await meta('meta[name="twitter:card"]')).toBe('summary_large_image');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/c\/ronit$/);
  });

  test('the share card is a generated 1200×630 PNG', async ({ page, request }) => {
    await page.goto('/c/ronit');
    const imageUrl = await page.locator('meta[property="og:image"]').first().getAttribute('content');
    expect(imageUrl).toMatch(/\/c\/ronit\/opengraph-image/);
    expect(await page.locator('meta[property="og:image:width"]').first().getAttribute('content')).toBe('1200');
    const image = await request.get(new URL(imageUrl ?? '').pathname + new URL(imageUrl ?? '').search);
    expect(image.status()).toBe(200);
    expect(image.headers()['content-type']).toBe('image/png');
    const bytes = await image.body();
    expect(bytes.subarray(1, 4).toString()).toBe('PNG');
    expect(bytes.readUInt32BE(16)).toBe(1200); // width, from the PNG header
    expect(bytes.readUInt32BE(20)).toBe(630); // height
  });

  test('an unknown handle shows the not-found page and tells search engines not to index it, at /c/… and /@…', async ({ page }) => {
    // a "soft 404": status 200 (the shell has started streaming), but noindex and the not-found page; see the README
    for (const path of ['/c/nobody-at-all', '/@nobody-at-all']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: /off the map/ })).toBeVisible();
      await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content', 'noindex');
    }
  });

  test('a private character is not found either, and is left out of the sitemap', async ({ page, request }) => {
    const handle = await newAdventurer(page);
    await page.goto('/character');
    await visible(page.getByLabel(/Public character sheet/)).uncheck();
    await visible(page.getByRole('button', { name: 'Save character' })).click();
    await page.waitForURL('/character?notice=saved');
    await page.goto(`/c/${handle}`);
    await expect(page.getByRole('heading', { name: /off the map/ })).toBeVisible();
    expect(await (await request.get('/sitemap.xml')).text()).not.toContain(`/c/${handle}`);
  });

  test('a sheet is fresh right after a change, even when it was cached a moment ago', async ({ page, browser }) => {
    const handle = await newAdventurer(page);
    await logQuest(page, { title: 'First of many' });
    await page.getByRole('button', { name: 'Back to my journal' }).click();
    const visitor = await browser.newPage();
    await visitor.goto(`/c/${handle}`);
    await expect(visible(visitor.locator('.quests'))).toContainText('First of many'); // the sheet is now cached
    await logQuest(page, { title: 'Second already' });
    await page.getByRole('link', { name: 'See my sheet' }).click(); // a link on the reward screen
    await expect(visible(page.locator('.quests'))).toContainText('Second already'); // the author sees it at once
    await visitor.reload();
    await expect(visible(visitor.locator('.quests'))).toContainText('Second already'); // and so does everyone else
  });
});

test.describe('sitemap and robots', () => {
  test('the sitemap lists the home page and public sheets', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    expect(xml).toContain('<loc>http://localhost:3121</loc>');
    expect(xml).toContain('<loc>http://localhost:3121/c/ronit</loc>');
  });

  test('robots.txt keeps crawlers out of private pages and the API', async ({ request }) => {
    const text = await (await request.get('/robots.txt')).text();
    for (const path of ['/journal', '/character', '/guild', '/api/']) expect(text).toContain(`Disallow: ${path}`);
    expect(text).toContain('Sitemap: http://localhost:3121/sitemap.xml');
  });
});
