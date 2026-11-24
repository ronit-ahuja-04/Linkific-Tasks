import { expect, test, type Page } from '@playwright/test';
import { logQuest, newAdventurer, newAdventurerAccount, signInAs, visible } from './helpers';

/**
 * Day 23: the failures found by the M1 inventory (docs/ERROR_INVENTORY.md), replayed in a real browser against the
 * production build. Each one must end with a clear message and a button that works again, never a stuck "Saving…".
 */
async function newQuestForm(page: Page, title: string) {
  await visible(page.getByRole('link', { name: /Log day/ })).click();
  await page.waitForURL('/journal/new');
  await visible(page.getByLabel('Title')).fill(title);
  await visible(page.getByRole('button', { name: 'React', exact: true })).click();
}
const publish = (page: Page) => visible(page.getByRole('button', { name: /Publish quest|Saving…/ }));
const formError = (page: Page) => visible(page.locator('.editor .form-error'));

test.describe('a failed save never leaves you stuck (E-1, E-2)', () => {
  test('offline: says nothing was sent, the button works again, the quest is still in the form (C1)', async ({ page, context }) => {
    await newAdventurer(page);
    await newQuestForm(page, 'Offline quest');
    await context.setOffline(true);
    await publish(page).click();
    await expect(formError(page)).toHaveText('You are offline. Nothing was sent: reconnect and try again.');
    await expect(publish(page)).toHaveText('Publish quest');
    await expect(publish(page)).toBeEnabled();
    await expect(visible(page.getByLabel('Title'))).toHaveValue('Offline quest');
    // back online, the same button saves it
    await context.setOffline(false);
    await publish(page).click();
    await expect(page.getByRole('dialog', { name: 'Quest complete!' })).toBeVisible();
  });

  test('a request that never answers ends at the 15 s deadline, and warns it may have been saved (C2)', async ({ page }) => {
    await page.clock.install();
    await newAdventurer(page);
    await newQuestForm(page, 'Hanging quest');
    await page.route('**/api/quests', () => { /* never answered */ });
    await publish(page).click();
    await expect(publish(page)).toHaveText('Saving…');
    await page.clock.fastForward(15_500);
    await expect(formError(page)).toContainText('took too long to answer');
    await expect(formError(page)).toContainText('It may have been saved anyway: check before sending it again.');
    await expect(publish(page)).toBeEnabled();
  });

  test('an HTML error page from the server becomes our message, not a parse error (C3)', async ({ page }) => {
    await newAdventurer(page);
    await newQuestForm(page, 'Broken answer');
    await page.route('**/api/quests', (route) => route.fulfill({ status: 500, contentType: 'text/html', body: '<h1>Internal Server Error</h1>' }));
    await publish(page).click();
    await expect(formError(page)).toHaveText(/^Something broke on our side\. It has been logged/);
  });

  test('a 503 from our API shows the outage message with a reference to quote', async ({ page }) => {
    await newAdventurer(page);
    await newQuestForm(page, 'During an outage');
    await page.route('**/api/quests', (route) => route.fulfill({ status: 503, contentType: 'application/json', headers: { 'x-request-id': '3f2a9c1e-0000-4000-8000-000000000000' }, body: JSON.stringify({ error: 'db' }) }));
    await publish(page).click();
    await expect(formError(page)).toHaveText('Intern Quest can not reach its database right now. Try again in a moment. (ref 3f2a9c1e)');
  });

  test('the session ended while the form was open: it says so, and signing in in a new tab saves the draft (C4, E-10)', async ({ page, context }) => {
    const { email } = await newAdventurerAccount(page);
    await newQuestForm(page, 'Session ended');
    await context.clearCookies();
    await publish(page).click();
    await expect(formError(page)).toContainText('Your session has ended. Sign in again to continue.');
    await expect(visible(page.getByLabel('Title'))).toHaveValue('Session ended');
    // M3 (E-10): a way back that keeps the draft: sign in in a new tab, then publish again here
    const again = formError(page).getByRole('link', { name: 'Sign in again in a new tab' });
    await expect(again).toHaveAttribute('target', '_blank');
    const [tab] = await Promise.all([context.waitForEvent('page'), again.click()]);
    await tab.waitForLoadState();
    await visible(tab.getByLabel('Email')).fill(email);
    await visible(tab.getByLabel('Password')).fill('a long test password');
    await visible(tab.getByRole('button', { name: 'Sign in' })).click();
    await tab.waitForURL('/journal');
    await tab.close();
    await publish(page).click(); // the session cookie set by the other tab is sent with this request: saved
    await expect(page.getByRole('dialog', { name: 'Quest complete!' })).toBeVisible();
  });

  test('deleting offline: the dialog closes and says why (C5)', async ({ page, context }) => {
    await newAdventurer(page);
    await logQuest(page, { title: 'Keep me' });
    await expect(page.getByRole('dialog', { name: 'Quest complete!' })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.waitForURL('/journal');
    await visible(page.getByRole('link', { name: /Keep me/ })).click();
    await visible(page.getByRole('button', { name: 'Delete quest' })).click();
    await context.setOffline(true);
    await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(formError(page)).toHaveText('Could not delete the quest. You are offline. Nothing was sent: reconnect and try again.');
  });

  test('saving the character offline (C6)', async ({ page, context }) => {
    await newAdventurer(page);
    await page.goto('/character');
    await visible(page.getByRole('button', { name: 'Save character' })).waitFor();
    await context.setOffline(true);
    await visible(page.getByRole('button', { name: 'Save character' })).click();
    await expect(visible(page.locator('.form-error'))).toHaveText('You are offline. Nothing was sent: reconnect and try again.');
    await expect(visible(page.getByRole('button', { name: 'Save character' }))).toBeEnabled();
  });
});

test('a mentor\'s note that fails is no longer silent, and the text stays in the box (C7)', async ({ page, context }) => {
  await signInAs(page, 'mentor@example.com');
  await page.goto('/guild');
  const box = visible(page.getByPlaceholder('Leave a note…')).first();
  await box.fill('Nice work on this one');
  await context.setOffline(true);
  await visible(page.getByRole('button', { name: 'Add note' })).first().click();
  await expect(visible(page.locator('.notice'))).toHaveText('Could not add the note (it is still in the box). You are offline. Nothing was sent: reconnect and try again.');
  await expect(page.locator('p.sr-only[role=status]')).toHaveText(/Could not add the note/);
  await expect(box).toHaveValue('Nice work on this one');
});

test.describe('the API and the log', () => {
  test('an unknown /api address answers JSON, not the HTML page (N7)', async ({ request }) => {
    const response = await request.get('/api/nothing-here');
    expect(response.status()).toBe(404);
    expect(response.headers()['content-type']).toContain('application/json');
    expect(await response.json()).toEqual({ error: 'There is no API endpoint at this address.' });
  });

  test('an uncaught error in the page is reported to our log (global listener)', async ({ page }) => {
    await page.goto('/');
    const reported = page.waitForResponse((r) => r.url().endsWith('/api/client-errors'));
    await page.evaluate(() => setTimeout(() => { throw new Error('e2e: thrown from a timer'); }, 0));
    const response = await reported;
    expect(response.status()).toBe(204);
    expect(response.request().postDataJSON()).toMatchObject({ source: 'window', message: 'e2e: thrown from a timer', path: '/' });
  });

  test('outside Vercel the /_vercel analytics scripts are not loaded, so the console stays clean (E-13)', async ({ page }) => {
    const errors: string[] = [];
    const vercel: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('request', (r) => { if (r.url().includes('/_vercel/')) vercel.push(r.url()); });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(vercel).toEqual([]);
    expect(errors).toEqual([]);
  });
});

test.describe('boundaries and offline (M3)', () => {
  test('signing in offline keeps the form and says why, instead of an error page (C9)', async ({ page, context }) => {
    await page.goto('/login');
    await visible(page.getByLabel('Email')).fill('ada@example.com');
    await visible(page.getByLabel('Password')).fill('demo-password-123');
    await context.setOffline(true);
    await visible(page.getByRole('button', { name: 'Sign in' })).click();
    await expect(visible(page.locator('.auth-error'))).toHaveText('You are offline. Nothing was sent: reconnect and try again.');
    await expect(visible(page.getByLabel('Email'))).toHaveValue('ada@example.com');
    await expect(visible(page.getByRole('heading', { level: 1 }))).not.toHaveText(/could not load/);
  });

  test('the reward screen fails to load after a save: it says the quest IS saved, and reports it (C11, E-4)', async ({ page }) => {
    await newAdventurer(page);
    await newQuestForm(page, 'Saved despite the update');
    await page.route('**/_next/static/chunks/**', (route) => route.abort()); // a new deploy: the old chunks are gone
    const reported = page.waitForRequest((r) => r.url().endsWith('/api/client-errors'));
    await publish(page).click();
    const dialog = page.getByRole('dialog', { name: /^Quest saved: \+\d+ XP$/ });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Intern Quest was just updated. Your quest and its XP are saved.');
    expect((await reported).postDataJSON()).toMatchObject({ source: 'boundary', name: 'ChunkLoadError' });
    await page.unroute('**/_next/static/chunks/**');
    await dialog.getByRole('button', { name: 'Back to my journal' }).click();
    await page.waitForURL('/journal');
    await expect(visible(page.getByRole('link', { name: /Saved despite the update/ }))).toBeVisible();
  });

  test('offline: a banner says so, links do not drop you on the browser\'s offline page, and it says when you are back (C10, E-11)', async ({ page, context }) => {
    await newAdventurer(page);
    const banner = page.locator('.offline-banner');
    await expect(banner).toBeHidden();
    await context.setOffline(true);
    await expect(banner).toHaveText(/^You are offline\./);
    await visible(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Character' })).click();
    await expect(banner).toHaveText('You are offline, so that page can not open yet. Reconnect, then try again.');
    await expect(page).toHaveURL(/\/journal$/);
    await expect(visible(page.getByRole('heading', { level: 1 }))).toHaveText('Day 1 awaits.');
    await context.setOffline(false);
    await expect(banner).toHaveText('Back online.');
    await expect(banner).toBeHidden({ timeout: 6000 });
  });
});
