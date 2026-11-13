import { test, expect, open } from './fixtures';

const settle = (page) => page.waitForTimeout(1000); // chart animations

test('Sales: clicking a bar inspects that month; the menu and Clear agree', async ({ page }) => {
  await open(page, 'Sales');
  await settle(page);
  const select = page.getByLabel('Inspect a month');
  await expect(select).toHaveValue('');
  await page.locator('.recharts-bar-rectangle').nth(3).click({ force: true });
  await expect(select).not.toHaveValue('');
  await expect(page.getByRole('region', { name: 'Month details' })).toContainText('Best region');
  await page.getByRole('button', { name: 'Clear selection' }).click();
  await expect(select).toHaveValue('');
  await select.selectOption({ index: 2 }); // the keyboard path does the same
  await expect(page.getByRole('region', { name: 'Month details' })).toContainText('Best region');
});

test('Sales: switching to category and grouped changes the legend', async ({ page }) => {
  await open(page, 'Sales');
  await page.getByRole('button', { name: 'Category', exact: true }).click();
  await page.getByRole('button', { name: 'Grouped' }).click();
  await settle(page);
  await expect(page.locator('.recharts-legend-wrapper').first()).toContainText('Software');
  await expect(page.getByRole('button', { name: 'Grouped' })).toHaveAttribute('aria-pressed', 'true');
});

test('Sales: the Brush zooms the line chart and Reset zoom restores it', async ({ page }) => {
  await open(page, 'Sales');
  await settle(page);
  const reset = page.getByRole('button', { name: 'Reset zoom' });
  await expect(reset).toBeDisabled();
  const handle = page.locator('.recharts-brush-traveller').first();
  await handle.scrollIntoViewIfNeeded(); // it sits below the first screen: the mouse must be over it
  const box = await handle.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 300, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(reset).toBeEnabled();
  await expect(page.getByText(/Showing .* \(\d+ months\)/)).not.toContainText('(12 months)');
  await reset.click();
  await expect(page.getByText(/Showing .* \(12 months\)/)).toBeVisible();
});

test('Users: the three charts are synchronized and the granularity switches', async ({ page }) => {
  await open(page, 'Users');
  await settle(page);
  const first = page.locator('.recharts-wrapper').first();
  const box = await first.boundingBox();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height / 2);
  await expect(page.locator('.chart-tooltip')).toHaveCount(3); // one tooltip per synchronized chart
  await page.getByRole('button', { name: 'Daily' }).click();
  await expect(page.getByRole('button', { name: 'Daily' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText(/Weekends average \d+% fewer visitors/)).toBeVisible();
});

test('Revenue: clicking a slice drills down; the button list does the same by keyboard', async ({ page }) => {
  await open(page, 'Revenue');
  await settle(page);
  await expect(page.getByText('Select a slice to drill down')).toBeVisible();
  await page.locator('.recharts-pie-sector').first().click({ force: true });
  await expect(page.getByText('Select a slice to drill down')).toBeHidden();
  await expect(page.getByRole('region', { name: 'Drill-down' })).toContainText('Monthly revenue in');
  await page.getByRole('button', { name: 'Clear selection' }).first().click();
  await expect(page.getByText('Select a slice to drill down')).toBeVisible();
  await page.getByRole('button', { name: /^Europe/ }).click();
  await expect(page.getByRole('region', { name: 'Drill-down' })).toContainText('Europe');
  await page.getByRole('button', { name: 'Category', exact: true }).click();
  await expect(page.getByText('Select a slice to drill down')).toBeVisible(); // switching resets the selection
});

test('Explore: pin a product from the chart or the menu; hide a radar series', async ({ page }) => {
  await open(page, 'Explore');
  await settle(page);
  await page.locator('.recharts-scatter-symbol').first().click({ force: true });
  await expect(page.getByText(/Pinned product/)).toBeVisible();
  await page.getByRole('button', { name: 'Unpin' }).click();
  await page.getByLabel('Pin a product').selectOption({ index: 3 });
  await expect(page.getByRole('button', { name: 'Unpin' })).toBeVisible();
  await page.getByLabel('Log scale').check();
  await settle(page);
  await expect(page.locator('.recharts-scatter-symbol').first()).toBeVisible();
  const software = page.getByRole('button', { name: 'Software' });
  await expect(software).toHaveAttribute('aria-pressed', 'true');
  await software.click();
  await expect(software).toHaveAttribute('aria-pressed', 'false');
});

test('a category filter scopes every tab (one series left)', async ({ page }) => {
  await open(page, 'Overview');
  await page.getByLabel('Category').selectOption('Hardware');
  await page.getByRole('tab', { name: 'Explore', exact: true }).click();
  await settle(page);
  await expect(page.getByLabel('Pin a product').locator('option')).toHaveCount(11); // None + 10 hardware products
  await page.getByRole('tab', { name: 'Revenue', exact: true }).click();
  await page.getByRole('button', { name: 'Category', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Hardware/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Software/ })).toHaveCount(0);
});

test('phone width: no horizontal page scroll on any tab', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/');
  for (const name of ['Overview', 'Sales', 'Users', 'Revenue', 'Explore']) {
    await page.getByRole('tab', { name, exact: true }).click();
    await settle(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${name} overflows horizontally`).toBeLessThanOrEqual(1);
  }
});
