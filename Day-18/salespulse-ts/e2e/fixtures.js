import { test as base, expect } from '@playwright/test';

/** Every test fails if the page logs a console error or warning, or throws an uncaught exception */
export const test = base.extend({
  page: async ({ page }, use) => {
    const problems = [];
    page.on('console', (msg) => {
      const type = msg.type();
      if (type === 'verbose' && msg.text().startsWith('[DOM]')) problems.push(msg.text());
      else if (type === 'error' || type === 'warning') problems.push(`console.${type}: ${msg.text()}`);
    });
    page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
    await use(page);
    expect(problems, 'console problems').toEqual([]);
  },
});
export { expect };

/** Open the app on a given tab (tabs are buttons with role=tab) */
export async function open(page, tab = 'Overview') {
  await page.goto('/');
  await page.getByRole('tab', { name: tab, exact: true }).click();
}
