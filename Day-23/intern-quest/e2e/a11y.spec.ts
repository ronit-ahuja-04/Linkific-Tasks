import { test } from '@playwright/test';
import { audit } from './axe';
import { newAdventurer, signInAs } from './helpers';

/** WCAG 2.1 A and AA checks with axe on every kind of page (several pages per test, so a longer time budget) */
test.describe.configure({ timeout: 60_000 });
// Audited with "reduce motion" on: entrance fades are skipped then, so axe always measures the final colours (with
// fades running, a half-transparent heading really is lower contrast for that instant).
test.use({ reducedMotion: 'reduce' });

test('public pages have no WCAG 2.1 AA violations', async ({ page }) => {
  for (const path of ['/', '/login', '/register', '/c/ronit', '/c/ada', '/c/grace', '/nowhere']) {
    await page.goto(path);
    await audit(page, path);
  }
});

test('the game pages have no WCAG 2.1 AA violations', async ({ page }) => {
  await newAdventurer(page);
  for (const path of ['/journal', '/journal/new', '/character']) {
    await page.goto(path);
    await audit(page, path);
  }
});

test('the Guild hall has no WCAG 2.1 AA violations', async ({ page }) => {
  await signInAs(page, 'mentor@example.com');
  await page.goto('/guild');
  await audit(page, '/guild');
});
