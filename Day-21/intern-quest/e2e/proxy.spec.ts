import { expect, test } from '@playwright/test';
import { registerNew } from './helpers';

test.describe('proxy.ts', () => {
  for (const path of ['/journal', '/journal/new', '/character', '/guild']) {
    test(`signed out, ${path} redirects to sign-in and remembers where you were going`, async ({ request }) => {
      const response = await request.get(`${path}?from=test`, { maxRedirects: 0 });
      expect(response.status()).toBe(307);
      const location = new URL(response.headers().location ?? '', 'http://localhost');
      expect(location.pathname).toBe('/login');
      expect(location.searchParams.get('next')).toBe(`${path}?from=test`);
    });
  }

  test('after signing in you land where you were going', async ({ page }) => {
    await page.goto('/journal');
    await page.waitForURL(/\/login\?next=%2Fjournal/);
    await page.getByLabel('Email').fill('ronit@example.com');
    await page.getByLabel('Password').fill('demo-password-123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('/journal');
  });

  test('a signed-in intern is turned away from /guild', async ({ page }) => {
    await registerNew(page);
    const response = await page.request.get('/guild', { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toContain('/journal?notice=mentors-only');
  });

  test('/@handle is rewritten to the character sheet (the address bar keeps /@handle); bad or unknown handles are not found', async ({ page, request }) => {
    const response = await page.goto('/@ronit');
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL('/@ronit');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Ronit is a level 9 Adept.');
    expect((await request.get('/@Not_A_Handle!')).status()).toBe(404);
    // not a valid handle: never rewritten, no such route: a real 404
    // a valid handle nobody has: rewritten, then the sheet finds no character (a soft 404, see game.spec.ts)
    await page.goto('/@nobody-at-all');
    await expect(page.getByRole('heading', { name: /off the map/ })).toBeVisible();
  });

  test('every response gets a unique x-request-id and the security headers, pages and API alike', async ({ request }) => {
    const ids = new Set<string>();
    for (const path of ['/', '/login', '/api/quests', '/c/ronit']) {
      const response = await request.get(path, { maxRedirects: 0 });
      const headers = response.headers();
      expect(headers['x-request-id'], path).toMatch(/^[0-9a-f-]{36}$/);
      ids.add(headers['x-request-id'] ?? '');
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['x-frame-options']).toBe('DENY');
      expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(headers['permissions-policy']).toContain('camera=()');
    }
    expect(ids.size).toBe(4);
  });

  test('the proxy is not the only lock: the API still refuses a signed-out caller', async ({ request }) => {
    expect((await request.get('/api/quests')).status()).toBe(401);
    expect((await request.post('/api/badges', { data: { handle: 'ronit', name: 'Sneaky' } })).status()).toBe(401);
  });
});
