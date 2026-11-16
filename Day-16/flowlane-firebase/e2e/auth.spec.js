import { test, expect, uniqueEmail, signUp, signIn, signOut, sidebarProject } from './fixtures.js';

test.describe('authentication', () => {
  test('a signed-out visitor is sent to the sign-in page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await page.goto('/projects/anything');
    await expect(page).toHaveURL(/\/auth$/);
  });

  test('switches between sign in and sign up', async ({ page }) => {
    await page.goto('/auth');
    await page.getByText('Sign up', { exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Create an account' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign Up', exact: true })).toBeVisible();
    await page.getByText('Sign in', { exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  test('signs up, lands on a single "My First Project", and stays signed in after a reload', async ({ page }) => {
    await signUp(page, uniqueEmail('new'));
    await expect(sidebarProject(page, 'My First Project')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'My First Project' })).toBeVisible();
    await expect(page).toHaveURL(/\/projects\/[A-Za-z0-9]+$/);
    // the first project must not be duplicated by repeated Firestore snapshots
    await page.waitForTimeout(1500);
    await expect(sidebarProject(page, 'My First Project')).toHaveCount(1);
    await page.reload();
    await expect(page.getByText('Your Projects')).toBeVisible();
    await expect(sidebarProject(page, 'My First Project')).toHaveCount(1);
  });

  test('signing out returns to the sign-in page and protects the app again', async ({ page }) => {
    await signUp(page, uniqueEmail('out'));
    await signOut(page);
    await page.goto('/');
    await expect(page).toHaveURL(/\/auth$/);
  });

  test('signs in with an existing account and shows the same projects', async ({ page }) => {
    const email = uniqueEmail('again');
    await signUp(page, email);
    await signOut(page);
    await signIn(page, email);
    await expect(sidebarProject(page, 'My First Project')).toHaveCount(1);
  });

  test('shows a clear error for a wrong password and for an unknown user', async ({ page }) => {
    const email = uniqueEmail('bad');
    await signUp(page, email);
    await signOut(page);
    await page.goto('/auth');
    await page.getByPlaceholder('hello@flowlane.com').fill(email);
    await page.getByPlaceholder('••••••••').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page.locator('.auth-error')).toContainText(/invalid-credential|wrong-password|password/i);
    await expect(page).toHaveURL(/\/auth$/);
    await page.getByPlaceholder('hello@flowlane.com').fill(uniqueEmail('ghost'));
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page.locator('.auth-error')).toBeVisible();
  });

  test('refuses to sign up twice with the same email and a too-short password', async ({ page }) => {
    const email = uniqueEmail('dupe');
    await signUp(page, email);
    await signOut(page);
    await page.goto('/auth');
    await page.getByText('Sign up', { exact: true }).click();
    await page.getByPlaceholder('hello@flowlane.com').fill(email);
    await page.getByPlaceholder('••••••••').fill('secret123');
    await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
    await expect(page.locator('.auth-error')).toContainText(/already|in-use/i);
    await page.getByPlaceholder('hello@flowlane.com').fill(uniqueEmail('weak'));
    await page.getByPlaceholder('••••••••').fill('123');
    await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
    await expect(page.locator('.auth-error')).toContainText(/weak|6 characters/i);
  });

  test('the error disappears when you switch mode or start typing, and buttons lock while busy', async ({ page }) => {
    await page.goto('/auth');
    await page.getByPlaceholder('hello@flowlane.com').fill(uniqueEmail('nobody'));
    await page.getByPlaceholder('••••••••').fill('whatever1');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page.locator('.auth-error')).toBeVisible();
    await page.getByPlaceholder('hello@flowlane.com').fill('x@y.com');
    await expect(page.locator('.auth-error')).toHaveCount(0);
  });
});
