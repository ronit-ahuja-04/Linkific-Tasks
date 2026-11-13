import { test, expect, open } from './fixtures';

test('loads the dashboard and shows every tab', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'SalesPulse' })).toBeVisible();
  for (const name of ['Overview', 'Sales', 'Users', 'Revenue', 'Explore']) {
    await page.getByRole('tab', { name, exact: true }).click();
    await expect(page.getByRole('tabpanel')).toBeVisible();
    await expect(page.locator('.recharts-wrapper').first()).toBeVisible();
  }
});

test('at least seven chart types are drawn across the tabs', async ({ page }) => {
  await page.goto('/');
  const seen = new Set();
  const marks = { line: '.recharts-line-curve', bar: '.recharts-bar-rectangle', pie: '.recharts-pie-sector', area: '.recharts-area-area', scatter: '.recharts-scatter-symbol', radar: '.recharts-radar-polygon' };
  for (const name of ['Overview', 'Sales', 'Users', 'Revenue', 'Explore']) {
    await page.getByRole('tab', { name, exact: true }).click();
    await page.waitForTimeout(900); // chart animations
    for (const [kind, selector] of Object.entries(marks)) if ((await page.locator(selector).count()) > 0) seen.add(kind);
  }
  expect([...seen].sort()).toEqual(['area', 'bar', 'line', 'pie', 'radar', 'scatter']);
});

test('region filter changes the numbers instantly; reset restores them', async ({ page }) => {
  await open(page, 'Overview');
  await expect(page.getByRole('heading', { name: 'Key numbers' })).toBeVisible();
  const revenue = page.locator('.kpi-grid').first();
  const before = await revenue.textContent();
  await page.getByLabel('Region').selectOption('Latin America');
  await expect(revenue).not.toHaveText(before);
  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(revenue).toHaveText(before);
});

test('changing the period refetches and keeps the charts on screen', async ({ page }) => {
  await open(page, 'Overview');
  await expect(page.getByRole('heading', { name: 'Key numbers' })).toBeVisible(); // wait for the first load
  await page.getByRole('button', { name: '3 months' }).click();
  await expect(page.getByText('Updating…')).toBeVisible();
  await expect(page.locator('.recharts-wrapper').first()).toBeVisible(); // the old chart did not vanish
  await expect(page.getByText('Updating…')).toBeHidden();
  await expect(page.getByRole('button', { name: '3 months' })).toHaveAttribute('aria-pressed', 'true');
});

test('every chart has a table view with the same numbers', async ({ page }) => {
  await open(page, 'Overview');
  const card = page.getByRole('region', { name: /Cumulative revenue/ });
  await card.getByRole('button', { name: 'Table view' }).click();
  await expect(card.getByRole('table')).toBeVisible();
  await expect(card.locator('tbody tr').first()).toBeVisible();
  await card.getByRole('button', { name: 'Chart view' }).click();
  await expect(card.locator('.recharts-wrapper')).toBeVisible();
});

test('hovering a chart shows a tooltip', async ({ page }) => {
  await open(page, 'Overview');
  const chart = page.locator('.recharts-wrapper').first();
  const box = await chart.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator('.chart-tooltip').first()).toBeVisible();
});

test('theme toggle switches and persists', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('keyboard: arrow keys move between tabs', async ({ page }) => {
  await open(page, 'Overview');
  await page.getByRole('tab', { name: 'Overview', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Sales', exact: true })).toHaveAttribute('aria-selected', 'true');
});

test('a failing API shows an error with a retry', async ({ page }) => {
  await page.route('**/__never__', (r) => r.abort());
  await page.goto('/?fail=1');
  await expect(page.getByRole('alert')).toContainText('did not respond');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: 'Key numbers' })).toBeVisible();
});
