import { test, expect, open } from './fixtures';

test('dashboard shows KPIs, bars and the department table', async ({ page }) => {
  await open(page, 'Dashboard');
  await expect(page.getByRole('img', { name: /Engineering: .* users/ }).first()).toBeVisible();
  await expect(page.getByRole('table').first()).toBeVisible();
  await page.getByLabel('Dataset size').selectOption('1000');
  await expect(page.getByText('1,000').first()).toBeVisible();
});

test('search lab: debounce collapses keystrokes into one call', async ({ page }) => {
  await open(page, 'Search lab');
  await page.getByLabel('Type here').pressSequentially('react', { delay: 30 });
  await expect(page.getByText(/Keystrokes: 5/)).toBeVisible();
  await expect(page.getByText(/Search calls: 1/)).toBeVisible();
});

test('methods gallery lists 35+ methods and filters', async ({ page }) => {
  await open(page, 'Methods');
  await expect(page.getByTestId('method-card').first()).toBeVisible();
  expect(await page.getByTestId('method-card').count()).toBeGreaterThanOrEqual(35);
  await page.getByLabel('Search methods').fill('groupBy');
  await expect(page.getByTestId('method-card')).toHaveCount(1);
});

test('profile form: edit, see the change, undo, save', async ({ page }) => {
  await open(page, 'Profile form');
  const first = page.getByLabel('First Name');
  const before = await first.inputValue();
  await first.fill('Zed');
  const changes = page.getByRole('region', { name: 'Changed fields' }).or(page.getByLabel('Changed fields'));
  await expect(changes).toContainText('firstName');
  await page.getByRole('button', { name: 'Undo firstName' }).click();
  await expect(first).toHaveValue(before);
  await first.fill('Zed');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('region', { name: 'Notifications' }).getByText(/Saved Zed/)).toBeVisible();
});

test('profile form: invalid email blocks save', async ({ page }) => {
  await open(page, 'Profile form');
  await page.getByRole('textbox', { name: 'Email' }).fill('nope');
  await expect(page.getByText('Enter a valid email address')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
});

test('benchmark runs and shows a summary', async ({ page }) => {
  await open(page, 'Benchmark');
  await page.getByRole('radio', { name: /1,000/ }).check();
  await page.getByRole('button', { name: 'Run benchmarks' }).click();
  await expect(page.getByText(/Native won \d+ of \d+/)).toBeVisible({ timeout: 40_000 });
});
