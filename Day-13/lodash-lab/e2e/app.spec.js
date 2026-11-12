import { test, expect, open } from './fixtures';

test('loads 10,000 users and shows every tab', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'DataDesk' })).toBeVisible();
  await expect(page.getByText(/10,000 users to search/)).toBeVisible();
  for (const name of ['Directory', 'Dashboard', 'Search lab', 'Profile form', 'Methods', 'Benchmark']) {
    await page.getByRole('tab', { name, exact: true }).click();
    await expect(page.getByRole('tabpanel')).toBeVisible();
  }
});

test('dataset size switch shows a toast and updates the header', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Dataset size').selectOption('1000');
  await expect(page.getByText(/1,000 users to search/)).toBeVisible();
  await expect(page.getByRole('region', { name: 'Notifications' }).getByText('Dataset: 1,000 users')).toBeVisible();
});

test('theme toggle switches and persists', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('keyboard: arrow keys move between tabs', async ({ page }) => {
  await open(page, 'Directory');
  await page.getByRole('tab', { name: 'Directory', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Dashboard', exact: true })).toHaveAttribute('aria-selected', 'true');
});
