import { test, expect, uniqueEmail, signUp, signIn, signOut, emailsTo, latestCode, disableUser, STRONG } from './fixtures';

test.describe('sign-in page features', () => {
  test('Remember me is ticked by default; "Forgot password?" is on sign in only; the strength meter is on sign up only', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.getByLabel('Remember me')).toBeChecked();
    await expect(page.getByRole('link', { name: 'Forgot password?' })).toBeVisible();
    await expect(page.getByRole('meter')).toHaveCount(0);
    await page.getByText('Sign up', { exact: true }).click();
    await expect(page.getByRole('link', { name: 'Forgot password?' })).toHaveCount(0);
    await page.getByPlaceholder('••••••••').fill('abc');
    await expect(page.getByText('Strength: Too weak')).toBeVisible();
    await page.getByPlaceholder('••••••••').fill(STRONG);
    await expect(page.getByText(/Strength: (Good|Strong)/)).toBeVisible();
  });

  test('the show/hide button reveals the password', async ({ page }) => {
    await page.goto('/auth');
    const password = page.getByPlaceholder('••••••••');
    await expect(password).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Show password' }).click();
    await expect(password).toHaveAttribute('type', 'text');
  });

  test('a wrong password gives a friendly message', async ({ page }) => {
    const email = uniqueEmail('wrong');
    await signUp(page, email, STRONG);
    await signOut(page);
    await page.getByPlaceholder('hello@flowlane.com').fill(email);
    await page.getByPlaceholder('••••••••').fill('Not-The-Password-1');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page.getByText('Incorrect email or password.')).toBeVisible();
  });
});

test.describe('protected routes', () => {
  test('a signed-out visitor is sent to sign in and returned to the page they wanted', async ({ page }) => {
    const email = uniqueEmail('guard');
    await signUp(page, email, STRONG);
    await signOut(page);
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/auth$/);
    await page.getByPlaceholder('hello@flowlane.com').fill(email);
    await page.getByPlaceholder('••••••••').fill(STRONG);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page).toHaveURL(/\/settings$/);
  });

  test('a signed-in user is bounced away from the sign-in page', async ({ page }) => {
    await signUp(page, uniqueEmail('bounce'), STRONG);
    await page.goto('/auth');
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(page.getByText('Your Projects')).toBeVisible();
  });
});

test.describe('remember me (Firebase persistence)', () => {
  test('ticked: a new tab is still signed in. Unticked: a new tab starts signed out', async ({ page, context }) => {
    const remembered = uniqueEmail('remember');
    await page.goto('/auth');
    await page.getByText('Sign up', { exact: true }).click();
    await page.getByPlaceholder('hello@flowlane.com').fill(remembered);
    await page.getByPlaceholder('••••••••').fill(STRONG);
    await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
    await expect(page.getByText('Your Projects')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'My First Project' })).toBeVisible();
    const second = await context.newPage();
    await second.goto('/');
    await expect(second.getByText('Your Projects')).toBeVisible();
    await second.close();
    await signOut(page);

    const session = uniqueEmail('session');
    await page.getByText('Sign up', { exact: true }).click();
    await page.getByPlaceholder('hello@flowlane.com').fill(session);
    await page.getByPlaceholder('••••••••').fill(STRONG);
    await page.getByLabel('Remember me').uncheck();
    await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
    await expect(page.getByText('Your Projects')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'My First Project' })).toBeVisible();
    const third = await context.newPage(); // a new tab has an empty sessionStorage
    await third.goto('/');
    await expect(third).toHaveURL(/\/auth$/);
    await third.close();
  });
});

test.describe('email verification', () => {
  test('sign up shows the banner, the emailed link verifies it, and the banner goes away', async ({ page, request }) => {
    const email = uniqueEmail('verify');
    await signUp(page, email, STRONG);
    await expect(page.getByText(/Please confirm your email address/)).toBeVisible();
    await expect.poll(async () => (await emailsTo(request, email)).some((m) => m.requestType === 'VERIFY_EMAIL')).toBe(true);
    const code = await latestCode(request, email, 'VERIFY_EMAIL');
    await page.goto(`/auth/action?mode=verifyEmail&oobCode=${code}`);
    await expect(page.getByRole('heading', { name: 'Email verified' })).toBeVisible();
    await page.getByRole('link', { name: 'Continue' }).or(page.getByRole('button', { name: 'Continue' })).click();
    await expect(page.getByText('Your Projects')).toBeVisible();
    await expect(page.getByText(/Please confirm your email address/)).toBeHidden();
  });

  test('"Resend email" sends another message', async ({ page, request }) => {
    const email = uniqueEmail('resend');
    await signUp(page, email, STRONG);
    await expect.poll(async () => (await emailsTo(request, email)).length).toBe(1);
    await page.getByRole('button', { name: 'Resend email' }).click();
    await expect(page.getByText('Verification email sent')).toBeVisible();
    await expect.poll(async () => (await emailsTo(request, email)).length).toBe(2);
  });

  test('"I\'ve verified" says so when it is not yet true', async ({ page }) => {
    await signUp(page, uniqueEmail('notyet'), STRONG);
    await page.getByRole('button', { name: "I've verified" }).click();
    await expect(page.getByText('Still not verified. Open the link in the email first.')).toBeVisible();
  });

  test('an invalid link explains itself', async ({ page }) => {
    await page.goto('/auth/action?mode=verifyEmail&oobCode=nonsense');
    await expect(page.getByRole('heading', { name: 'This link did not work' })).toBeVisible();
    await page.goto('/auth/action');
    await expect(page.getByRole('heading', { name: 'Invalid link' })).toBeVisible();
  });
});

test.describe('forgot and reset password', () => {
  test('request a link, choose a new password once, then sign in with it', async ({ page, request }) => {
    const email = uniqueEmail('reset');
    await signUp(page, email, STRONG);
    await signOut(page);
    await page.getByRole('link', { name: 'Forgot password?' }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await page.getByLabel('Email').fill(email);
    await page.getByRole('button', { name: 'Send reset link' }).click();
    await expect(page.getByText(`If an account exists for ${email}`)).toBeVisible();
    await expect.poll(() => latestCode(request, email, 'PASSWORD_RESET')).toBeTruthy();
    const code = await latestCode(request, email, 'PASSWORD_RESET');

    await page.goto(`/auth/action?mode=resetPassword&oobCode=${code}`);
    await expect(page.getByText(`Resetting the password for ${email}`)).toBeVisible();
    await page.getByLabel('New password', { exact: true }).fill('abc');
    await page.getByLabel('Confirm new password').fill('abc');
    await page.getByRole('button', { name: 'Save new password' }).click();
    await expect(page.getByRole('heading', { name: 'Password updated' })).toBeHidden(); // a weak password is refused
    const next = 'Brand-New-Pass-2027';
    await page.getByLabel('New password', { exact: true }).fill(next);
    await page.getByLabel('Confirm new password').fill(next);
    await page.getByRole('button', { name: 'Save new password' }).click();
    await expect(page.getByRole('heading', { name: 'Password updated' })).toBeVisible();

    // the link works once
    await page.goto(`/auth/action?mode=resetPassword&oobCode=${code}`);
    await expect(page.getByRole('heading', { name: 'Invalid link' })).toBeVisible();

    // the old password is gone, the new one works
    await page.goto('/auth');
    await page.getByPlaceholder('hello@flowlane.com').fill(email);
    await page.getByPlaceholder('••••••••').fill(STRONG);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page.getByText('Incorrect email or password.')).toBeVisible();
    await page.getByPlaceholder('••••••••').fill(next);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page.getByText('Your Projects')).toBeVisible();
  });

  test('forgot password gives the same answer for an email that does not exist', async ({ page, request }) => {
    const ghost = uniqueEmail('ghost');
    await page.goto('/forgot-password');
    await page.getByLabel('Email').fill(ghost);
    await page.getByRole('button', { name: 'Send reset link' }).click();
    await expect(page.getByText(`If an account exists for ${ghost}`)).toBeVisible();
    expect(await emailsTo(request, ghost)).toEqual([]);
  });
});

test.describe('sessions that end', () => {
  test('inactivity signs you out with a notice', async ({ page }) => {
    await page.clock.install();
    await signUp(page, uniqueEmail('idle'), STRONG);
    await page.clock.fastForward('31:00'); // the default idle limit is 30 minutes
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByText('You were signed out after a period of inactivity.')).toBeVisible();
  });

  test('activity keeps the session alive', async ({ page }) => {
    await page.clock.install();
    await signUp(page, uniqueEmail('active'), STRONG);
    await page.clock.fastForward('20:00');
    await page.mouse.click(300, 300); // any interaction resets the idle timer
    await page.clock.fastForward('20:00');
    await expect(page.getByText('Your Projects')).toBeVisible();
  });

  test('when the account is switched off, the next check of the session signs you out with a notice', async ({ page, request }) => {
    const email = uniqueEmail('revoked');
    await signUp(page, email, STRONG);
    await expect(page.getByText(/Please confirm your email address/)).toBeVisible();
    await disableUser(request, email);
    await page.getByRole('button', { name: "I've verified" }).click(); // asks Firebase to reload the user: it refuses
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByText('Your session expired. Please sign in again.')).toBeVisible();
  });
});

test.describe('Security tab', () => {
  test('shows the decoded ID token, counts down, refreshes, and the API verifies the same token', async ({ page }) => {
    const email = uniqueEmail('security');
    await signUp(page, email, STRONG);
    await page.goto('/settings');
    await page.getByRole('tab', { name: 'Security' }).click();
    await expect(page.getByText(email).first()).toBeVisible();
    await expect(page.getByText(/securetoken\.google\.com\/demo-flowlane/)).toBeVisible();
    const before = await page.getByText(/expires in/i).first().textContent();
    expect(before).toMatch(/\d+:\d\d/);
    await page.getByRole('button', { name: 'Refresh token now' }).click();
    await expect(page.getByText('eyJ')).toHaveCount(0); // the raw token is never rendered
    await page.getByRole('button', { name: 'Ask the API' }).click();
    await expect(page.getByText(/emulator-unsigned/)).toBeVisible(); // the server verified the signature path it uses in the emulator
  });
});
