import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { newAdventurer, signInAs } from './helpers';

/** WCAG 2.1 A and AA checks with axe on every kind of page (several pages per test, so a longer time budget) */
test.describe.configure({ timeout: 60_000 });
// Audited with "reduce motion" on: entrance fades are skipped then, so axe always measures the final colours (with
// fades running, a half-transparent heading really is lower contrast for that instant).
test.use({ reducedMotion: 'reduce' });

async function audit(page: Page, label: string) {
  // Entrance animations fade content in (and the animation engine loads a moment after the page). Mid-fade, text really
  // is lower contrast, so audit the settled page: wait until every faded-in HTML element is fully opaque.
  await page.waitForLoadState('load');
  // Motion runs some animations in JavaScript (inline styles) and some through the browser's Web Animations API, so
  // wait for both: no finite animation still running (Pip's endless idle loops are ignored), and nothing half-faded.
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.effect?.getTiming().iterations === Infinity || a.playState !== 'running') &&
    [...document.querySelectorAll<HTMLElement>('body [style*="opacity"]')]
      .filter((el) => !el.closest('svg, [aria-hidden="true"]'))
      .every((el) => getComputedStyle(el).opacity === '1'),
  );
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).exclude('nextjs-portal').analyze();
  expect(results.violations.map((v) => `${label}: ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target.join(' ')}`)).toEqual([]);
}

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
