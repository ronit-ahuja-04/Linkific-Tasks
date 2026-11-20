import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// WCAG 2.1 AA checks on every kind of page, in both colour schemes
for (const scheme of ['light', 'dark'] as const) {
  for (const path of ['/', '/blog', '/blog/what-is-nextjs', '/about', '/rendering', '/no-such-page']) {
    test(`no accessibility violations on ${path} (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(path);
      if (path === '/rendering') await expect(page.getByTestId('ssr-stamp')).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(' ')}`)).toEqual([]);
    });
  }
}
