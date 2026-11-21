import { expect, test } from '@playwright/test';
import { registerNew } from './helpers';



test.describe('email and password', () => {
  test('register signs you in; the session carries your id and the intern role', async ({ page }) => {
    const email = await registerNew(page);
    await expect(page.locator('.account-name')).toHaveText('E2E Hero');
    const session = await (await page.request.get('/api/auth/session')).json();
    expect(session.user).toMatchObject({ email, name: 'E2E Hero', role: 'intern', id: expect.stringMatching(/^[0-9a-f-]{36}$/) });
  });

  test('a failed registration explains each field and keeps what you typed (not the password)', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Name').fill('Keeper');
    await page.getByLabel('Email').fill('keeper@test.invalid');
    await page.getByLabel('Password').fill('short');
    await page.getByRole('button', { name: 'Start your quest' }).click();
    await expect(page.locator('.auth-error')).toHaveText('Check the highlighted fields.');
    await expect(page.locator('#password-hint')).toHaveText('password must be at least 10 characters');
    await expect(page.getByLabel('Name')).toHaveValue('Keeper');
    await expect(page.getByLabel('Email')).toHaveValue('keeper@test.invalid');
    await expect(page.getByLabel('Password')).toHaveValue('');
  });

  test('registering an email twice is refused', async ({ page, browser }) => {
    const email = await registerNew(page);
    const other = await browser.newPage();
    await other.goto('/register');
    await other.getByLabel('Name').fill('Copycat');
    await other.getByLabel('Email').fill(email.toUpperCase());
    await other.getByLabel('Password').fill('another long password');
    await other.getByRole('button', { name: 'Start your quest' }).click();
    await expect(other.locator('.auth-error')).toHaveText('That email is already registered. Sign in instead.');
  });

  test('sign out, then sign in with the seeded demo account; a wrong password is refused politely', async ({ page }) => {
    await registerNew(page);
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
    expect((await (await page.request.get('/api/auth/session')).json())).toBeNull();

    await page.goto('/login');
    await page.getByLabel('Email').fill('ronit@example.com');
    await page.getByLabel('Password').fill('not-the-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.locator('.auth-error')).toHaveText('That email and password do not match.');
    await expect(page.getByLabel('Email')).toHaveValue('ronit@example.com');

    await page.getByLabel('Password').fill('demo-password-123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('/');
    await expect(page.locator('.account-name')).toHaveText('Ronit Ahuja');
  });

  test('the session cookie is http-only (JavaScript can not read it) and SameSite=Lax', async ({ page, context }) => {
    await registerNew(page);
    const cookie = (await context.cookies()).find((c) => c.name.includes('session-token'));
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'Lax', path: '/' });
    expect(await page.evaluate(() => document.cookie)).not.toContain('session-token');
  });
});

test.describe('redirects', () => {
  test('a signed-in visitor to /login goes straight to ?next', async ({ page }) => {
    await registerNew(page);
    // (not ?next=/register: that page also redirects signed-in visitors, onwards to /)
    await page.goto('/login?next=/journal');
    await page.waitForURL('/journal');
  });

  test('?next can not send you off the site after signing in', async ({ page }) => {
    await page.goto('/login?next=https://evil.example/');
    await page.getByLabel('Email').fill('ronit@example.com');
    await page.getByLabel('Password').fill('demo-password-123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('/');
  });
});

test.describe('GitHub', () => {
  test('"Continue with GitHub" goes to GitHub with our client id, callback URL and a CSRF state', async ({ page }) => {
    let authorizeUrl = '';
    await page.route('https://github.com/**', async (route) => {
      authorizeUrl = route.request().url();
      await route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>GitHub (stubbed in the test)</h1>' });
    });
    await page.goto('/login');
    await page.getByRole('button', { name: 'Continue with GitHub' }).click();
    await expect(page.getByRole('heading', { name: 'GitHub (stubbed in the test)' })).toBeVisible();
    const url = new URL(authorizeUrl);
    expect(`${url.origin}${url.pathname}`).toBe('https://github.com/login/oauth/authorize');
    expect(url.searchParams.get('client_id')).toBe('e2e-github-client');
    expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:3121/api/auth/callback/github');
    expect(url.searchParams.get('state') ?? url.searchParams.get('code_challenge')).toBeTruthy();
  });

  test('a GitHub account that clashes with a password account shows a clear message', async ({ page }) => {
    await page.goto('/login?error=github-email-taken');
    await expect(page.locator('.auth-error')).toContainText('already registered with a password');
  });
});

test.describe('the API sees the session', () => {
  test('signed out: 401; signed in: my data; mentor code: the role changes after signing in again', async ({ page }) => {
    expect((await page.request.get('/api/quests')).status()).toBe(401);
    const email = await registerNew(page, 'Future Mentor');
    expect((await page.request.get('/api/quests')).status()).toBe(200);
    expect((await page.request.get('/api/character')).status()).toBe(404); // no character yet

    expect((await page.request.post('/api/mentor', { data: { code: 'wrong-code' } })).status()).toBe(403);
    expect((await page.request.post('/api/mentor', { data: { code: 'demo-mentor' } })).status()).toBe(200);

    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible(); // wait until the sign-out has finished
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('a long test password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('/');
    expect((await (await page.request.get('/api/auth/session')).json()).user.role).toBe('mentor');
    await expect(page.locator('.account-name')).toHaveText('🛡️ Future Mentor');
  });
});
