import { test, expect, newUser, signUpUI, navLink } from './fixtures';

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

test.describe('files (Supabase Storage)', () => {
  test('upload to the private bucket, share with a signed link, download, delete', async ({ page }) => {
    await signUpUI(page, newUser('files'));
    await navLink(page, 'Files').click();
    await page.getByLabel('Choose files to upload').setInputFiles({ name: 'plan.txt', mimeType: 'text/plain', buffer: Buffer.from('the plan') });
    const row = page.getByTestId('file-row').filter({ hasText: 'plan.txt' });
    await expect(row).toBeVisible();

    // a signed URL: a temporary link that works without logging in
    await row.getByRole('button', { name: /share link/i }).click();
    const link = page.locator('input[readonly], code, a').filter({ hasText: /token=/ }).or(page.locator('input[readonly]')).first();
    await expect(link).toBeVisible();
    const url = (await link.inputValue().catch(() => null)) ?? (await link.textContent());
    expect(url).toContain('/storage/v1/object/sign/attachments/');
    expect(url).toContain('token=');
    const response = await fetch(url);
    expect(response.ok).toBe(true);
    expect(await response.text()).toBe('the plan');
    await expect(page.getByTestId('countdown')).toBeVisible();

    // download through the SDK
    const download = page.waitForEvent('download');
    await row.getByRole('button', { name: /download/i }).click();
    expect((await download).suggestedFilename()).toBe('plan.txt');

    // delete removes the bytes AND the row
    await row.getByRole('button', { name: /delete/i }).click();
    await page.getByRole('button', { name: /yes|confirm/i }).click();
    await expect(page.getByTestId('file-row').filter({ hasText: 'plan.txt' })).toHaveCount(0);
    expect((await fetch(url)).ok, 'the signed link no longer finds the file').toBe(false);
  });

  test('a file over 10 MiB is refused before anything is sent', async ({ page }) => {
    await signUpUI(page, newUser('big'));
    await navLink(page, 'Files').click();
    await page.getByLabel('Choose files to upload').setInputFiles({ name: 'huge.bin', mimeType: 'application/octet-stream', buffer: Buffer.alloc(11 * 1024 * 1024) });
    await expect(page.getByRole('region', { name: 'Notifications' })).toContainText(/10/); // the error toast is shown...
    await expect(page.locator('[aria-live="assertive"]')).toContainText(/10/); // ...and announced at once (Day 22: an always-present live region)
    await expect(page.getByTestId('file-row')).toHaveCount(0);
  });

  test('public vs private: an avatar URL opens without logging in; a private object does not', async ({ page }) => {
    await signUpUI(page, newUser('buckets'));
    await navLink(page, 'Profile').click();
    await page.locator('input[type="file"]').first().setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: PNG });
    await expect(page.locator('.avatar img').first()).toBeVisible({ timeout: 15000 });
    await navLink(page, 'Files').click();
    await page.getByLabel('Choose files to upload').setInputFiles({ name: 'secret.txt', mimeType: 'text/plain', buffer: Buffer.from('s') });
    await expect(page.getByTestId('file-row').filter({ hasText: 'secret.txt' })).toBeVisible();
    await page.getByText('Under the hood: storage calls, and public vs private buckets').click(); // the demo lives in the collapsed panel since Day 22
    await page.getByRole('button', { name: /try to open it without a signature/i }).click();
    await expect(page.getByTestId('private-result')).toContainText(/refused|400|404/i);
    await page.getByRole('button', { name: /open my avatar without signing in/i }).click();
    await expect(page.getByTestId('public-result')).toContainText(/opened/i);
  });
});
