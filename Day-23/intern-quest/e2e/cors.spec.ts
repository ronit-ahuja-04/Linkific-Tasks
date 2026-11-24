import { expect, test, type Page } from '@playwright/test';
import { EMBED_ORIGIN } from '../playwright.config';
import { newAdventurer } from './helpers';

/**
 * Day 23, CORS: the quest-card embed site (Day-23/quest-card-embed) runs on ANOTHER ORIGIN and calls this app's API,
 * as a portfolio would. Only EMBED_ORIGIN is on the app's CORS_ALLOWED_ORIGINS list in this run.
 * The same embed files under 127.0.0.1 are a different origin (another host name): the refused case.
 */
const APP = 'http://localhost:3121';
const OTHER_ORIGIN = EMBED_ORIGIN.replace('localhost', '127.0.0.1');
const CARD = '/api/public/characters/ronit';

const lab = async (page: Page, origin = EMBED_ORIGIN) => {
  await page.goto(`${origin}/lab.html?api=${encodeURIComponent(APP)}`);
  await expect(page.locator('#origin')).toHaveText(origin);
};
const run = async (page: Page, id: string) => {
  const section = page.locator('section.case').filter({ has: page.locator(`#r-${id}`) });
  await section.getByRole('button').click();
  const output = page.locator(`#r-${id}`);
  await expect(output).not.toHaveText('Running…');
  await expect(output).toHaveAttribute('data-result', /ok|blocked/);
  return output;
};

test.describe('the public card API from another origin', () => {
  test('the embed site shows a live card (allowed origin), with the data written as text', async ({ page }) => {
    await page.goto(`${EMBED_ORIGIN}/?api=${encodeURIComponent(APP)}`);
    const card = page.getByRole('article', { name: /^Quest card: / });
    await expect(card).toBeVisible();
    await expect(card).toContainText(/level \d+/);
    await expect(card.getByRole('link', { name: 'See the full character sheet' })).toHaveAttribute('href', /\/c\/ronit$/);
  });

  test('the CORS lab from the allowed origin: what works and what is blocked, case by case', async ({ page }) => {
    await lab(page);
    const simple = await run(page, 'simple');
    await expect(simple).toHaveAttribute('data-result', 'ok');
    await expect(simple).toContainText(/x-request-id = [0-9a-f-]{36}/); // exposed on purpose
    await expect(simple).toContainText('access-control-allow-origin = null'); // CORS headers themselves are not readable
    await expect(await run(page, 'preflight')).toHaveAttribute('data-result', 'ok');
    for (const id of ['header', 'method', 'credentials', 'private', 'csrf']) await expect(await run(page, id)).toHaveAttribute('data-result', 'blocked');
  });

  test('the same lab from another origin (127.0.0.1): refused, and the console says it was CORS', async ({ page }) => {
    const console: string[] = [];
    page.on('console', (m) => console.push(m.text()));
    await lab(page, OTHER_ORIGIN);
    await expect(await run(page, 'simple')).toHaveAttribute('data-result', 'blocked');
    await expect(await run(page, 'preflight')).toHaveAttribute('data-result', 'blocked');
    expect(console.some((line) => line.includes(`from origin '${OTHER_ORIGIN}' has been blocked by CORS policy`))).toBe(true);
  });
});

test.describe('the headers, as the server sends them', () => {
  test('an allowed origin: its own origin echoed, Vary: Origin, the request id exposed, never credentials', async ({ request }) => {
    const response = await request.get(CARD, { headers: { Origin: EMBED_ORIGIN } });
    expect(response.status()).toBe(200);
    const h = response.headers();
    expect(h['access-control-allow-origin']).toBe(EMBED_ORIGIN);
    expect(h.vary).toContain('Origin');
    expect(h['access-control-expose-headers']).toBe('X-Request-Id');
    expect(h['access-control-allow-credentials']).toBeUndefined();
    const { card } = await response.json();
    expect(card).toMatchObject({ handle: 'ronit', sheetUrl: expect.stringMatching(/\/c\/ronit$/) });
    expect(Object.keys(card)).not.toContain('email');
  });

  test('another origin: answered (the data is public) but with no Allow-Origin, so its page can not read it', async ({ request }) => {
    const h = (await request.get(CARD, { headers: { Origin: OTHER_ORIGIN } })).headers();
    expect(h['access-control-allow-origin']).toBeUndefined();
    expect(h.vary).toContain('Origin');
  });

  test('preflight: 204 with methods, headers and Max-Age for an allowed origin; 403 for another', async ({ request }) => {
    const ask = (origin: string) => request.fetch(CARD, { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'x-client-name' } });
    const allowed = await ask(EMBED_ORIGIN);
    expect(allowed.status()).toBe(204);
    expect(allowed.headers()).toMatchObject({
      'access-control-allow-origin': EMBED_ORIGIN, 'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'Content-Type, X-Client-Name', 'access-control-max-age': '600',
    });
    const refused = await ask(OTHER_ORIGIN);
    expect(refused.status()).toBe(403);
    expect(refused.headers()['access-control-allow-origin']).toBeUndefined();
  });

  test('the signed-in API sends no CORS headers to anyone, allowed origin included', async ({ request }) => {
    for (const path of ['/api/quests', '/api/character']) {
      const h = (await request.get(path, { headers: { Origin: EMBED_ORIGIN } })).headers();
      expect(h['access-control-allow-origin']).toBeUndefined();
    }
  });
});

test('a forged write from another origin is refused by the server, cookie or not (CSRF; lab case 7)', async ({ page }) => {
  await newAdventurer(page); // signed in at localhost:3121; the cookie also goes along with requests from localhost:4100 (same site)
  // the lab's "simple" text/plain POST, with a VALID quest, sent from the other origin's page with the session cookie.
  // The page can not see the answer (CORS); what matters is that nothing was saved.
  await lab(page);
  await expect(await run(page, 'csrf')).toHaveAttribute('data-result', 'blocked');
  await page.goto(`${APP}/journal`);
  await expect(page.getByRole('heading', { level: 1 }).filter({ visible: true })).toHaveText('Day 1 awaits.');
  // the same forged request, sent directly with the session cookie: the server's own answer is a 403
  const quest = { day: 1, date: '2026-11-24', title: 'Forged', skills: ['react'] };
  const forged = await page.request.post(`${APP}/api/quests`, { headers: { Origin: EMBED_ORIGIN, 'Content-Type': 'text/plain' }, data: JSON.stringify(quest) });
  expect(forged.status()).toBe(403);
  expect(await forged.json()).toEqual({ error: 'Requests that change data are accepted from this site only.' });
  // and from the app's own origin the same request is accepted as before
  const own = await page.request.post(`${APP}/api/quests`, { headers: { Origin: APP, 'Content-Type': 'application/json' }, data: { ...quest, title: 'From the app itself' } });
  expect(own.status()).toBe(201);
});
