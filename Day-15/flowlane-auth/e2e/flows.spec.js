import { test, expect, newUser, register, signIn, lastMessageTo, tokenFromLink, DEMO } from './fixtures';

test.describe('password reset', () => {
  test('forgot password sends a link; resetting works once, signs out other devices, and the new password logs in', async ({ page, browser, request }) => {
    const user = newUser('reset');
    await register(page, user);
    // a second device signed in with the same account
    const other = await browser.newContext();
    const otherPage = await other.newPage();
    await signIn(otherPage, user);
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/login$/); // the app navigates only after the logout request finished

    await page.goto('/forgot-password');
    await page.getByLabel('Email').fill(user.email);
    await page.getByRole('button', { name: /send|reset/i }).click();
    await expect(page.getByText(/If an account exists/)).toBeVisible();

    const mail = await lastMessageTo(request, user.email);
    expect(mail.subject).toMatch(/reset/i);
    const link = mail.link.replace(/^https?:\/\/[^/]+/, '');
    await page.goto(link);
    await page.getByLabel('New password', { exact: true }).fill('Brand-New-Pass-2027');
    await page.getByLabel('Confirm new password').fill('Brand-New-Pass-2027');
    await page.getByRole('button', { name: /reset|save|change/i }).click();
    await expect(page.getByText(/password (has been )?(reset|changed|updated)/i).first()).toBeVisible();

    // the reset link cannot be used twice
    await page.goto(link);
    await page.getByLabel('New password', { exact: true }).fill('Another-Pass-2028');
    await page.getByLabel('Confirm new password').fill('Another-Pass-2028');
    await page.getByRole('button', { name: /reset|save|change/i }).click();
    await expect(page.getByRole('alert')).toBeVisible();

    // the old password no longer works, the new one does
    await page.goto('/login');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password', { exact: true }).fill(user.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText(/incorrect/);
    await page.getByLabel('Password', { exact: true }).fill('Brand-New-Pass-2027');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    // the other device was signed out by the reset: its next refresh fails
    await otherPage.reload();
    await expect(otherPage).toHaveURL(/\/login/);
    await other.close();
  });

  test('forgot password answers the same for an email that does not exist', async ({ page, request }) => {
    await page.goto('/forgot-password');
    await page.getByLabel('Email').fill('ghost@example.com');
    await page.getByRole('button', { name: /send|reset/i }).click();
    await expect(page.getByText(/If an account exists/)).toBeVisible();
    expect(await lastMessageTo(request, 'ghost@example.com')).toBeUndefined();
  });

  test('a reset page without a token explains what to do', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.getByText(/link|token/i).first()).toBeVisible();
  });
});

test.describe('GitHub sign-in (OAuth authorization-code flow, fake provider)', () => {
  test('Continue with GitHub signs you in as the GitHub user, and again as the same user', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Continue with GitHub/ }).click();
    await page.waitForURL('**/dashboard');
    await expect(page.getByText('The Octocat').first()).toBeVisible();
    const url = page.url();
    expect(url).not.toMatch(/token|code=/); // nothing secret in the address bar
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.getByRole('button', { name: /Continue with GitHub/ }).click();
    await page.waitForURL('**/dashboard');
    await expect(page.getByText('The Octocat').first()).toBeVisible();
    await page.getByRole('link', { name: 'Security' }).click();
    await expect(page.getByText('octocat@example.com').first()).toBeVisible();
  });

  test('a failed OAuth callback returns to login with a message', async ({ page }) => {
    await page.goto('/login?error=oauth_failed');
    await expect(page.getByText('GitHub sign-in failed. Please try again.')).toBeVisible();
  });

  test('a forged callback (wrong state) is rejected', async ({ page }) => {
    await page.goto('/api/auth/github/callback?code=fake-code&state=forged');
    await expect(page).toHaveURL(/\/login\?error=oauth_failed/);
  });
});

test.describe('the board behind the login', () => {
  test('create a project and tasks, move them, delete them', async ({ page }) => {
    const user = newUser('board');
    await register(page, user);
    await page.getByLabel('New project name').fill('E2E Launch');
    await page.getByRole('button', { name: 'Create project' }).click();
    await page.getByRole('button', { name: /^E2E Launch/ }).click();
    await page.getByLabel('New task title').fill('Write tests');
    await page.getByRole('button', { name: 'Add task' }).click();
    await expect(page.locator('.task-title', { hasText: 'Write tests' })).toBeVisible();
    await page.getByLabel('Move Write tests to').selectOption({ index: 1 });
    await expect(page.locator('[data-status="doing"] .task-title', { hasText: 'Write tests' })).toBeVisible();
    await page.getByLabel('Move Write tests to').selectOption({ index: 2 });
    await expect(page.locator('[data-status="done"] .task-title', { hasText: 'Write tests' })).toBeVisible();
    await page.reload();
    await expect(page.locator('[data-status="done"] .task-title', { hasText: 'Write tests' })).toBeVisible(); // the project stays selected, the data is on the server
    await page.getByRole('button', { name: 'Delete Write tests' }).click();
    await expect(page.locator('.task-title', { hasText: 'Write tests' })).toHaveCount(0);
  });

  test('users only see their own projects', async ({ page }) => {
    const user = newUser('privacy');
    await register(page, user);
    await expect(page.getByText('Website launch')).toHaveCount(0); // the demo user's project
    await expect(page.getByText('No projects yet')).toBeVisible();
  });
});

test.describe('sessions', () => {
  test('the Security page lists your sessions, and signing one out logs that device out', async ({ page, browser }) => {
    const user = newUser('sessions');
    await register(page, user);
    const other = await browser.newContext();
    const otherPage = await other.newPage();
    await signIn(otherPage, user);

    await page.getByRole('link', { name: 'Security' }).click();
    await expect(page.getByText('This device')).toHaveCount(1);
    await expect(page.locator('.session-item')).toHaveCount(2);
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await page.getByRole('button', { name: 'Confirm sign out' }).click();
    await expect(page.locator('.session-item')).toHaveCount(1);

    await otherPage.reload(); // that device's refresh token was revoked
    await expect(otherPage).toHaveURL(/\/login/);
    await other.close();
  });

  test('Refresh now renews the token and the counter goes up', async ({ page }) => {
    await signIn(page, DEMO);
    await page.getByRole('link', { name: 'Security' }).click();
    await page.getByRole('button', { name: 'Refresh now' }).click();
    await expect(page.getByText(/Silent refreshes so far:/)).toContainText('1');
  });
});

test('a theme switch persists and the pages stay readable at phone width', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/login');
  await page.getByRole('button', { name: /dark theme/i }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  for (const path of ['/login', '/register', '/forgot-password']) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${path} overflows`).toBeLessThanOrEqual(1);
  }
  await signIn(page, DEMO);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
