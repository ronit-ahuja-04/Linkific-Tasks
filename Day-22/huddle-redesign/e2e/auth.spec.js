import { test, expect, newUser, signUpUI, signInUI, linkFromEmail, clientFor, navLink } from './fixtures';

test.describe('sign up, sign in, sign out', () => {
  test('sign-up creates the account AND its profile (a database trigger), then sign out and back in', async ({ page }) => {
    const user = newUser('signup');
    await signUpUI(page, user);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(user.fullName.split(' ')[0]);
    await expect(page.getByTestId('stat-my_notes')).toBeVisible(); // the dashboard asked the database (rpc) for numbers
    await expect(page.getByRole('navigation', { name: 'Main' })).toContainText(user.username); // the profile row exists: the trigger made it
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await signInUI(page, user);
    await expect(page.getByTestId('stat-my_notes')).toBeVisible();
  });

  test('a wrong password says so, once and plainly', async ({ page }) => {
    const user = newUser('wrongpw');
    await clientFor(user, { signUp: true });
    await page.goto('/login');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password', { exact: true }).fill('Not-The-Password-1');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Email or password is incorrect');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('registering with a short password is refused with a message', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Email').fill('short@example.com');
    await page.getByLabel('Password', { exact: true }).fill('abc');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByRole('alert').first()).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });

  test('an anonymous visitor is sent to the login page and returned to the page they wanted', async ({ page }) => {
    const user = newUser('guard');
    await clientFor(user, { signUp: true });
    await page.goto('/notes');
    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password', { exact: true }).fill(user.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/notes$/);
  });

  test('a reload keeps you signed in (the session lives in localStorage and is renewed by supabase-js)', async ({ page }) => {
    await signUpUI(page, newUser('reload'));
    await page.reload();
    await expect(page.getByTestId('stat-my_notes')).toBeVisible();
    const keys = await page.evaluate(() => Object.keys(localStorage));
    expect(keys.some((k) => k.endsWith('-auth-token'))).toBe(true);
  });
});

test.describe('magic link and password reset (real emails, caught by Mailpit)', () => {
  test('a magic link signs you in without a password', async ({ page }) => {
    const user = newUser('magic');
    await page.goto('/login');
    await page.getByLabel('Email').fill(user.email);
    await page.getByRole('button', { name: 'Email me a magic link' }).click();
    await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
    await expect.poll(() => linkFromEmail(user.email), { timeout: 15000 }).toBeTruthy();
    const link = await linkFromEmail(user.email);
    await page.goto(link); // Supabase verifies it, then redirects to /auth/callback with a code supabase-js exchanges for a session
    await expect(page.getByTestId('stat-my_notes')).toBeVisible({ timeout: 15000 });
  });

  test('forgot password: the same answer for everyone, a reset link, a new password that works', async ({ page }) => {
    const user = newUser('reset');
    await clientFor(user, { signUp: true });
    await page.goto('/forgot-password');
    await page.getByLabel('Email').fill(user.email);
    await page.getByRole('button', { name: 'Send reset link' }).click();
    await expect(page.getByRole('status')).toContainText('If an account exists');
    await expect.poll(() => linkFromEmail(user.email), { timeout: 15000 }).toBeTruthy();
    await page.goto(await linkFromEmail(user.email));
    await expect(page).toHaveURL(/\/auth\/reset/);
    const next = 'Brand-New-Pass-2027';
    await page.getByLabel('New password', { exact: true }).fill(next);
    await page.getByLabel('Confirm new password', { exact: true }).fill(next);
    await page.getByRole('button', { name: 'Update password' }).click();
    await expect(page.getByRole('status').or(page.getByRole('link', { name: /continue|open|go to/i })).first()).toBeVisible();
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await signInUI(page, { ...user, password: next });
    await expect(page.getByTestId('stat-my_notes')).toBeVisible();
  });

  test('forgot password gives the same answer for an address that has no account', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByLabel('Email').fill('nobody.at.all@example.com');
    await page.getByRole('button', { name: 'Send reset link' }).click();
    await expect(page.getByRole('status')).toContainText('If an account exists');
  });

  test('a reset link that is invalid explains itself', async ({ page }) => {
    await page.goto('/auth/reset');
    await expect(page.getByRole('alert')).toContainText('invalid or expired');
  });
});

test.describe('profile', () => {
  const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

  test('edit the profile; a taken username is refused; the avatar goes to the PUBLIC bucket and shows', async ({ page }) => {
    const [user, other] = [newUser('prof'), newUser('taken')];
    await clientFor(other, { signUp: true });
    await signUpUI(page, user);
    await navLink(page, 'Profile').click();
    await page.getByLabel('Bio').fill('I like Postgres.');
    await page.getByRole('button', { name: /save/i }).first().click();
    await expect(page.getByText(/saved|updated/i).first()).toBeVisible();

    await page.getByLabel('Username').fill(other.username);
    await page.getByRole('button', { name: /save/i }).first().click();
    await expect(page.getByText('That username is taken.')).toBeVisible();

    await page.locator('input[type="file"]').first().setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: PNG });
    const img = page.locator('.avatar img').first();
    await expect(img).toBeVisible({ timeout: 15000 });
    const src = await img.getAttribute('src');
    expect(src).toContain('/storage/v1/object/public/avatars/'); // a public URL: anyone can open it
    expect((await fetch(src)).status).toBe(200);
    await page.reload();
    await expect(page.locator('.avatar img').first()).toBeVisible();
  });

  test('a file that is not an image is refused before it is sent', async ({ page }) => {
    await signUpUI(page, newUser('badavatar'));
    await navLink(page, 'Profile').click();
    await page.locator('input[type="file"]').first().setInputFiles({ name: 'notes.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') });
    await expect(page.getByRole('alert').first()).toBeVisible();
  });

  test('theme toggle switches and persists', async ({ page }) => {
    await signUpUI(page, newUser('theme'));
    await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('sign out of all devices ends every session', async ({ page, browser }) => {
    const user = newUser('everywhere');
    await clientFor(user, { signUp: true });
    const phone = await browser.newPage();
    await signInUI(phone, user);
    await signInUI(page, user);
    await navLink(page, 'Profile').click();
    await page.getByRole('button', { name: /all devices/i }).click();
    await expect(page).toHaveURL(/\/login/);
    await phone.reload();
    await expect(phone).toHaveURL(/\/login/);
    await phone.close();
  });
});
