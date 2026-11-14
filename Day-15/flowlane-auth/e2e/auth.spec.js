import { test, expect, newUser, register, signIn, lastMessageTo, tokenFromLink, DEMO, ADMIN, API } from './fixtures';

test.describe('register, sign in, sign out', () => {
  test('registering signs you in, shows the dashboard and asks you to verify your email', async ({ page, request }) => {
    const user = newUser('reg');
    await register(page, user);
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
    await expect(page.getByText('Verify your email to secure your account.')).toBeVisible();
    const mail = await lastMessageTo(request, user.email);
    expect(mail.subject).toMatch(/verify/i);
    expect(mail.link).toContain('/verify-email?token=');
  });

  test('the verification link verifies the email and the banner goes away', async ({ page, request }) => {
    const user = newUser('verify');
    await register(page, user);
    const mail = await lastMessageTo(request, user.email);
    await page.goto(`/verify-email?token=${tokenFromLink(mail.link)}`);
    await expect(page.getByText(/verified/i).first()).toBeVisible();
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
    await expect(page.getByText('Verify your email to secure your account.')).toBeHidden();
    // a verification link works once
    await page.goto(`/verify-email?token=${tokenFromLink(mail.link)}`);
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('a wrong password gives one generic message, and the same message for an unknown email', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(DEMO.email);
    await page.getByLabel('Password', { exact: true }).fill('Wrong-Password-1');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    const alert = page.getByRole('alert');
    await expect(alert).toHaveText(/Email or password is incorrect/);
    await page.getByLabel('Email').fill('nobody@example.com');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(alert).toHaveText(/Email or password is incorrect/);
    await expect(page).toHaveURL(/\/login$/);
  });

  test('form validation shows inline errors and focuses the first bad field', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByLabel('Name')).toBeFocused();
    await expect(page.getByLabel('Name')).toHaveAttribute('aria-invalid', 'true');
    await page.getByLabel('Name').fill('Ada Lovelace');
    await page.getByLabel('Email').fill('ada@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password1');
    await page.getByLabel('Confirm password').fill('password1');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText(/common|too easy|guess/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });

  test('a duplicate email is refused', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Name').fill('Someone Else');
    await page.getByLabel('Email').fill(DEMO.email);
    await page.getByLabel('Password', { exact: true }).fill('Sturdy-Pass-2026');
    await page.getByLabel('Confirm password').fill('Sturdy-Pass-2026');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText(/already/i).first()).toBeVisible();
  });

  test('the password strength meter reacts as you type', async ({ page }) => {
    await page.goto('/register');
    const password = page.getByLabel('Password', { exact: true });
    await password.fill('abc');
    await expect(page.getByText(/Strength: Too weak/)).toBeVisible();
    await password.fill('Tr1cky-Horse-Battery-77');
    await expect(page.getByText(/Strength: (Good|Strong)/)).toBeVisible();
  });

  test('the show/hide button reveals the password', async ({ page }) => {
    await page.goto('/login');
    const password = page.getByLabel('Password', { exact: true });
    await expect(password).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: /show password/i }).first().click();
    await expect(password).toHaveAttribute('type', 'text');
  });

  test('logout ends the session: the dashboard is no longer reachable, even with Back', async ({ page }) => {
    await signIn(page, DEMO);
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe('protected routes and persistence', () => {
  test('an anonymous visitor is sent to login and returned to the page they wanted', async ({ page }) => {
    await page.goto('/security');
    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel('Email').fill(DEMO.email);
    await page.getByLabel('Password', { exact: true }).fill(DEMO.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/security$/);
    await expect(page.getByRole('heading', { name: 'Session inspector' })).toBeVisible();
  });

  test('signed-in users are bounced away from the login page', async ({ page }) => {
    await signIn(page, DEMO);
    await page.goto('/login');
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('a reload keeps you signed in (the refresh cookie), and the token is not in browser storage', async ({ page, context }) => {
    await signIn(page, DEMO);
    await page.reload();
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
    const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }) + document.cookie);
    expect(stored).not.toMatch(/eyJ/); // a JWT always starts with eyJ
    expect(stored).not.toContain('fl_refresh');
    const cookie = (await context.cookies()).find((c) => c.name === 'fl_refresh');
    expect(cookie, 'refresh cookie exists').toBeTruthy();
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.sameSite).toBe('Strict');
    expect(cookie.path).toBe('/api/auth');
  });

  test('"Remember me" makes the refresh cookie persistent; without it, it is a session cookie', async ({ page, context }) => {
    await signIn(page, DEMO, { remember: false });
    let cookie = (await context.cookies()).find((c) => c.name === 'fl_refresh');
    expect(cookie.expires).toBe(-1);
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/login/);
    await signIn(page, DEMO, { remember: true });
    cookie = (await context.cookies()).find((c) => c.name === 'fl_refresh');
    const days = (cookie.expires - Date.now() / 1000) / 86400;
    expect(days).toBeGreaterThan(29);
    expect(days).toBeLessThan(31);
  });

  test('members cannot open the admin page; admins can', async ({ page }) => {
    await signIn(page, DEMO);
    await expect(page.getByRole('link', { name: 'Admin' })).toHaveCount(0);
    await page.goto('/admin');
    await expect(page.getByText('You do not have access to this page.')).toBeVisible();
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/login/);
    await signIn(page, ADMIN);
    await page.getByRole('link', { name: 'Admin' }).click();
    await expect(page.getByRole('cell', { name: DEMO.email })).toBeVisible();
  });

  test('an unknown address shows the not-found page', async ({ page }) => {
    await page.goto('/nope');
    await expect(page.getByText(/not found|404/i).first()).toBeVisible();
  });
});

test.describe('tokens at work', () => {
  test('an expired access token is refreshed once, transparently, and the request is retried', async ({ page }) => {
    await signIn(page, DEMO);
    let refreshes = 0;
    page.on('request', (r) => { if (r.url().endsWith('/api/auth/refresh')) refreshes += 1; });
    let blocked = false;
    await page.route('**/api/projects', async (route) => {
      if (!blocked) {
        blocked = true;
        return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: { code: 'token_expired', message: 'Token expired' } }) });
      }
      return route.continue();
    });
    await page.getByRole('link', { name: 'Security' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page.getByRole('button', { name: /^Website launch/ })).toBeVisible();
    expect(refreshes).toBe(1);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('when the refresh fails the user is signed out with a notice (auto-logout)', async ({ page }) => {
    await page.clock.install();
    await signIn(page, DEMO);
    await page.route('**/api/auth/refresh', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: { code: 'refresh_invalid', message: 'Session ended' } }) }));
    await page.clock.fastForward('00:40'); // past the silent refresh moment and the token's expiry
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('Your session expired. Please sign in again.')).toBeVisible();
  });

  test('the access token is renewed silently before it expires and the session carries on', async ({ page }) => {
    await page.clock.install();
    await signIn(page, DEMO);
    await page.getByRole('link', { name: 'Security' }).click();
    await expect(page.getByText(/Silent refreshes so far:/)).toContainText('0');
    await page.clock.fastForward('00:26'); // the silent refresh fires about 6 s before a 30 s token expires
    await expect(page.getByText(/Silent refreshes so far:/)).toContainText('1');
    await expect(page.getByRole('heading', { name: 'Session inspector' })).toBeVisible();
  });
});

test.describe('server-side security, checked against the real API', () => {
  const post = (path, { headers = {}, body } = {}) =>
    fetch(`${API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: body ? JSON.stringify(body) : undefined, redirect: 'manual' });
  const cookieOf = (res) => res.headers.getSetCookie().find((c) => c.startsWith('fl_refresh=')).split(';')[0];

  test('refresh token rotation: a reused (stolen) token kills the whole session', async () => {
    const login = await post('/auth/login', { body: DEMO });
    expect(login.status).toBe(200);
    const first = cookieOf(login);
    const csrf = { 'X-Requested-With': 'fetch' };
    const rotated = await post('/auth/refresh', { headers: { ...csrf, Cookie: first } });
    expect(rotated.status).toBe(200);
    const second = cookieOf(rotated);
    expect(second).not.toBe(first);
    const replay = await post('/auth/refresh', { headers: { ...csrf, Cookie: first } }); // the attacker replays the old token
    expect(replay.status).toBe(401);
    expect((await replay.json()).error.code).toBe('refresh_invalid');
    const legit = await post('/auth/refresh', { headers: { ...csrf, Cookie: second } }); // and now the real user's newer token is dead too
    expect(legit.status).toBe(401);
  });

  test('cookie endpoints refuse requests without the CSRF header', async () => {
    const login = await post('/auth/login', { body: DEMO });
    const res = await post('/auth/refresh', { headers: { Cookie: cookieOf(login) } });
    expect(res.status).toBe(403);
    expect((await res.json()).error.code).toBe('csrf_blocked');
    const foreign = await post('/auth/refresh', { headers: { 'X-Requested-With': 'fetch', Origin: 'https://evil.example', Cookie: cookieOf(login) } });
    expect(foreign.status).toBe(403);
  });

  test('another user cannot read or change your projects, and the answer is a plain 404', async () => {
    const auth = async (body) => {
      const r = await post('/auth/login', { body });
      return (await r.json()).accessToken;
    };
    const demo = await auth(DEMO);
    const admin = await auth(ADMIN);
    const list = await (await fetch(`${API}/projects`, { headers: { Authorization: `Bearer ${demo}` } })).json();
    const id = list.projects[0].id;
    const asAdmin = (path, init = {}) => fetch(`${API}${path}`, { ...init, headers: { Authorization: `Bearer ${admin}`, 'Content-Type': 'application/json' } });
    expect((await asAdmin(`/projects/${id}/tasks`)).status).toBe(404);
    expect((await asAdmin(`/projects/${id}`, { method: 'DELETE' })).status).toBe(404);
    expect((await fetch(`${API}/projects`)).status).toBe(401);
    expect((await fetch(`${API}/admin/users`, { headers: { Authorization: `Bearer ${demo}` } })).status).toBe(403);
  });

  test('a tampered token is rejected', async () => {
    const r = await post('/auth/login', { body: DEMO });
    const token = (await r.json()).accessToken;
    const [h, p, s] = token.split('.');
    const forged = `${h}.${Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(p, 'base64url').toString()), role: 'admin' })).toString('base64url')}.${s}`;
    const res = await fetch(`${API}/admin/users`, { headers: { Authorization: `Bearer ${forged}` } });
    expect(res.status).toBe(401);
  });
});
