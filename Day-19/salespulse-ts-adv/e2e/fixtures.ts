import { test as base, expect, type Locator, type Page } from '@playwright/test';

/** Every test fails if the page logs a console error or warning, or throws an uncaught exception */
export const test = base.extend({
  page: async ({ page }, use) => {
    const problems: string[] = [];
    page.on('console', (msg) => {
      // Playwright's types do not list 'verbose' (Chrome's DOM issue hints), so read it as a plain string and keep checking for it
      const type: string = msg.type();
      if (type === 'verbose' && msg.text().startsWith('[DOM]')) problems.push(msg.text());
      else if (type === 'error' || type === 'warning') problems.push(`console.${type}: ${msg.text()}`);
    });
    page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
    await use(page);
    expect(problems, 'console problems').toEqual([]);
  },
});
export { expect };

/** The on-screen rectangle of an element, or a clear failure when it has none (it is not rendered yet) */
export async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Expected the element to be on screen so it has a bounding box');
  return box;
}

/** Open the app on a given tab (tabs are buttons with role=tab) */
export async function open(page: Page, tab = 'Overview') {
  await page.goto('/');
  await page.getByRole('tab', { name: tab, exact: true }).click();
}
