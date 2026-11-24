import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/**
 * axe, WCAG 2.1 A and AA, on the page as it is now. Shared by a11y.spec.ts and the Day 23 tests that audit error,
 * loading and offline states. Use with `test.use({ reducedMotion: 'reduce' })` (see a11y.spec.ts for why).
 */
export async function audit(page: Page, label: string) {
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
