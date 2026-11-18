import AxeBuilder from '@axe-core/playwright';
import { test, expect, open } from './fixtures';

const TABS = ['Overview', 'Sales', 'Users', 'Revenue', 'Explore'];

for (const theme of ['light', 'dark']) {
  for (const tab of TABS) {
    test(`axe WCAG 2.1 AA: ${tab} (${theme})`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('salespulse-theme', t), theme);
      await open(page, tab);
      await page.waitForTimeout(1200); // let the chart animations and the tab underline finish
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
    });
  }
}
