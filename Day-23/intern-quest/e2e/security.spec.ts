import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { signInAs } from './helpers';

/**
 * No server secret may reach the browser. Loads the pages, collects every script the browser downloads, and searches
 * them for the actual secret values from .env.local (not just their names).
 */
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter((line) => /^[A-Z_]+=./.test(line)).map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]),
);
const SECRETS = ['SUPABASE_SERVICE_ROLE_KEY', 'AUTH_SECRET', 'MENTOR_INVITE_CODE', 'DATABASE_URL'];

test('server secrets never appear in the JavaScript sent to browsers', async ({ page }) => {
  const scripts: string[] = [];
  page.on('response', async (response) => {
    if (response.request().resourceType() === 'script') scripts.push(await response.text().catch(() => ''));
  });
  for (const path of ['/', '/login', '/c/ronit']) await page.goto(path, { waitUntil: 'networkidle' });
  await signInAs(page, 'mentor@example.com');
  for (const path of ['/journal', '/journal/new', '/character', '/guild']) await page.goto(path, { waitUntil: 'networkidle' });

  expect(scripts.length).toBeGreaterThan(5);
  const all = scripts.join('\n');
  for (const name of SECRETS) {
    const value = env[name];
    expect(value, `${name} is set in .env.local`).toBeTruthy();
    expect(all.includes(value ?? ''), `${name} leaked into client JavaScript`).toBe(false);
  }
  expect(all).not.toContain('SUPABASE_SERVICE_ROLE_KEY'); // not even the name
});
