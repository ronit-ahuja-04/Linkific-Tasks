import { test, expect, uniqueEmail, signUp, signOut, throughGithubPopup, card, column, STRONG } from './fixtures';

// Firebase's popup needs Google's script loader (see fixtures.js), so these tests use the real network for just that
test.use({ googleScripts: true });

const REPO = 'octocat/hello-flowlane';
const modal = (page) => page.locator('.modal-content, [role="dialog"]').filter({ hasText: 'Import issues from GitHub' });

/** Sign in with GitHub through the emulator's popup and wait for the dashboard */
async function githubSignIn(page, email) {
  await page.goto('/auth');
  await throughGithubPopup(page, () => page.getByRole('button', { name: 'Continue with GitHub' }).click(), { email });
  await expect(page.getByText('Your Projects')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'My First Project' })).toBeVisible();
}

test.describe('GitHub sign-in', () => {
  test('Continue with GitHub signs you in with a GitHub account', async ({ page }) => {
    await githubSignIn(page, uniqueEmail('octo'));
    await page.goto('/settings');
    await page.getByRole('tab', { name: 'Security' }).click();
    await expect(page.getByText(/GitHub/).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Unlink GitHub/i })).toBeVisible();
  });

  test('closing the popup is silent: no error and still on the sign-in page', async ({ page }) => {
    await page.goto('/auth');
    const popupPromise = page.context().waitForEvent('page');
    await page.getByRole('button', { name: 'Continue with GitHub' }).click();
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded');
    await popup.close();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page).toHaveURL(/\/auth$/);
  });
});

test.describe('import GitHub issues as tasks', () => {
  test('after a GitHub sign-in: pick a repository, import issues, see them on the board with a link back, never twice', async ({ page }) => {
    await githubSignIn(page, uniqueEmail('import'));
    await page.getByRole('button', { name: 'Import from GitHub' }).click();
    // already connected through the sign-in, so it goes straight to the repositories
    await expect(page.getByText('Choose a repository')).toBeVisible();
    await expect(page.getByText('octocat/Spoon-Knife')).toBeVisible();
    await expect(page.getByText('Private')).toBeVisible(); // octocat/secret-plans
    await page.getByText(REPO, { exact: true }).click();

    await expect(page.getByText('Choose issues to import')).toBeVisible();
    await expect(page.getByText('Issue 34: Export to CSV')).toBeVisible();
    await expect(page.getByText(/Pull request/)).toHaveCount(0); // pull requests are filtered out
    await page.getByLabel('Select all').check();
    await page.getByRole('button', { name: /^Import 25 issues$/ }).click();
    await expect(page.getByText(`Imported 25 issues from ${REPO}`)).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(column(page, 'todo').locator('.task-card', { hasText: 'Issue 34: Export to CSV' })).toBeVisible();
    const link = card(page, 'Issue 34: Export to CSV').getByRole('link', { name: 'Open issue #34 on GitHub' });
    await expect(link).toHaveAttribute('href', `https://github.com/${REPO}/issues/34`);
    await expect(link).toHaveAttribute('target', '_blank');

    // opening the import again: the imported ones are marked and cannot be picked again
    await page.getByRole('button', { name: 'Import from GitHub' }).click();
    await page.getByText(REPO, { exact: true }).click();
    await expect(page.getByText('Already imported').first()).toBeVisible();
    await page.getByRole('button', { name: 'Load more' }).click();
    await expect(page.getByText('Issue 1:').first()).toBeVisible(); // page 2 is there
    await page.getByLabel('Select all').check();
    await expect(page.getByRole('button', { name: /^Import 5 issues$/ })).toBeVisible(); // only the 5 new ones
  });

  test('an email/password user connects GitHub from the import dialog (the account gets linked)', async ({ page }) => {
    await signUp(page, uniqueEmail('linker'), STRONG);
    await page.getByRole('button', { name: 'Import from GitHub' }).click();
    await expect(page.getByText('Connect your GitHub account')).toBeVisible();
    await expect(page.getByText(/kept only in this tab/)).toBeVisible();
    await throughGithubPopup(page, () => page.getByRole('button', { name: 'Connect GitHub' }).click(), { email: uniqueEmail('gh') });
    await expect(page.getByText('Choose a repository')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.goto('/settings');
    await page.getByRole('tab', { name: 'Security' }).click();
    await expect(page.getByRole('button', { name: /Unlink GitHub/i })).toBeVisible();
  });

  test('a reload forgets the GitHub token (it lives only in memory), so connecting is needed again', async ({ page }) => {
    const email = uniqueEmail('reload');
    await githubSignIn(page, email);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'My First Project' })).toBeVisible();
    await page.getByRole('button', { name: 'Import from GitHub' }).click();
    await expect(page.getByText('Connect your GitHub account')).toBeVisible();
    const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }));
    expect(stored).not.toMatch(/github-token|gho_|FirebaseAuthEmulatorFakeAccessToken/i);
  });

  test('when the API says the GitHub token is rejected, the dialog offers Reconnect', async ({ page }) => {
    const email = uniqueEmail('reject');
    await githubSignIn(page, email);
    let rejected = false;
    await page.route('**/api/github/repos*', (route) => {
      if (rejected) return route.continue();
      rejected = true;
      return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: { code: 'github_token_invalid', message: 'Bad credentials' } }) });
    });
    await page.getByRole('button', { name: 'Import from GitHub' }).click();
    await expect(page.getByText('GitHub no longer accepts your saved access. Reconnect to continue.')).toBeVisible();
    await throughGithubPopup(page, () => page.getByRole('button', { name: 'Reconnect GitHub' }).click(), { email });
    await expect(page.getByText('Choose a repository')).toBeVisible();
  });

  test('an expired Firebase ID token is refreshed once and the request is retried (the axios interceptor)', async ({ page }) => {
    await githubSignIn(page, uniqueEmail('retry'));
    let refreshes = 0;
    page.on('request', (r) => { if (r.url().includes('securetoken.googleapis.com')) refreshes += 1; });
    let blocked = false;
    await page.route('**/api/github/repos*', (route) => {
      if (!blocked) {
        blocked = true;
        return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: { code: 'token_expired', message: 'Token expired' } }) });
      }
      return route.continue();
    });
    await page.getByRole('button', { name: 'Import from GitHub' }).click();
    await expect(page.getByText('Choose a repository')).toBeVisible();
    await expect(page.getByText(REPO, { exact: true })).toBeVisible(); // it worked after the transparent refresh and retry
  });
});

test.describe('Security tab, GitHub methods', () => {
  test('link GitHub, see it listed, forget the token, unlink it again', async ({ page }) => {
    await signUp(page, uniqueEmail('methods'), STRONG);
    await page.goto('/settings');
    await page.getByRole('tab', { name: 'Security' }).click();
    await expect(page.getByRole('button', { name: /Unlink GitHub/i })).toHaveCount(0);
    await throughGithubPopup(page, () => page.getByRole('button', { name: /Link GitHub/i }).click(), { email: uniqueEmail('lnk') });
    await expect(page.getByRole('button', { name: /Unlink GitHub/i })).toBeVisible();
    await page.getByRole('button', { name: /Unlink GitHub/i }).click();
    await expect(page.getByRole('button', { name: /Link GitHub/i })).toBeVisible();
  });
});
