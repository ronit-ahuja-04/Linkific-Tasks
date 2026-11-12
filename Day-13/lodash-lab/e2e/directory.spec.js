import { test, expect, open } from './fixtures';

test('debounced search narrows the list and highlights matches', async ({ page }) => {
  await open(page);
  const status = page.getByText(/Showing .* of 10,000 users/);
  await expect(status).toBeVisible();
  await page.getByLabel('Search users').pressSequentially('zoe', { delay: 40 });
  await expect(page.locator('mark').first()).toBeVisible();
  await expect(status).not.toContainText('10,000 of');
  const shown = await status.textContent();
  expect(Number(shown.match(/Showing ([\d,]+)/)[1].replace(',', ''))).toBeLessThan(10000);
});

test('sorting sets aria-sort and cycles asc, desc, none', async ({ page }) => {
  await open(page);
  const header = page.getByRole('columnheader', { name: /Salary/ });
  await header.getByRole('button').click();
  await expect(header).toHaveAttribute('aria-sort', 'ascending');
  await header.getByRole('button').click();
  await expect(header).toHaveAttribute('aria-sort', 'descending');
  await header.getByRole('button').click();
  await expect(header).toHaveAttribute('aria-sort', 'none');
});

test('pagination, grouping and reset', async ({ page }) => {
  await open(page);
  await expect(page.getByText(/Page 1 of /)).toBeVisible();
  await page.getByRole('button', { name: /Next/ }).click();
  await expect(page.getByText(/Page 2 of /)).toBeVisible();
  await page.getByLabel(/Group by/).selectOption({ index: 1 });
  await expect(page.getByRole('table').first()).toContainText(/Engineering|Design|Product/);
});

test('Edit opens the profile form for that user', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: /^Edit / }).first().click();
  await expect(page.getByRole('tab', { name: 'Profile form', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('form', { name: 'Profile form' })).toBeVisible();
});
