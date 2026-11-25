import { test, expect, newUser, signUpUI, navLink } from './fixtures';

/**
 * Day 24, code splitting: every page is its own chunk, downloaded when needed, or earlier when the user signals
 * they are about to go there. The Query lab is used because it is not among the pages prefetched when idle.
 * (These run against the dev server in the normal suite, and against the production build with E2E_PROD=1; module
 * URLs differ, so requests are matched by the page's file name.)
 */
const isLabChunk = (url) => /LabPage[^/]*\.js(x)?(\?|$)/.test(url);

test.describe('lazy pages', () => {
  test('the Query lab is not downloaded until wanted; pointing at its link starts the download before the click', async ({ page }) => {
    const requested = [];
    page.on('request', (request) => { if (isLabChunk(request.url())) requested.push(request.url()); });
    await signUpUI(page, newUser('split'));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(requested).toEqual([]); // the dashboard did not need it

    await navLink(page, 'Query lab').hover();
    await expect.poll(() => requested.length).toBeGreaterThan(0); // preloaded on hover, before any click
    await navLink(page, 'Query lab').click();
    await expect(page.getByRole('heading', { level: 1, name: /Query lab/i })).toBeVisible();
  });

  test('a slow page download shows the loading state inside the shell, then focus moves to the new page heading', async ({ page }) => {
    await signUpUI(page, newUser('slow'));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // hold the Query lab chunk back for a moment, as a slow connection would
    let release;
    const held = new Promise((resolve) => { release = resolve; });
    await page.route((url) => isLabChunk(url.href), async (route) => { await held; await route.continue(); });

    await navLink(page, 'Query lab').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText('Loading the page…')).toBeAttached();
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible(); // the shell stays
    release();
    const heading = page.getByRole('heading', { level: 1, name: /Query lab/i });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused(); // focus waited for the lazy page instead of settling on <main>
  });
});
