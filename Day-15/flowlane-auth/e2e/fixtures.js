import { test as base, expect } from '@playwright/test';

export const API = 'http://127.0.0.1:4100/api';

/** Every test fails if the page logs a console error or warning, or throws an uncaught exception */
export const test = base.extend({
  page: async ({ page }, use) => {
    const problems = [];
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'verbose' && text.startsWith('[DOM]')) problems.push(text);
      // The browser itself logs "Failed to load resource: 401/409/..." for a failed request. Those are the
      // expected failure paths this suite exercises on purpose (wrong password, expired token, ...), and
      // the app handles them. Every other console error or warning still fails the test.
      else if ((type === 'error' || type === 'warning') && !/^Failed to load resource: the server responded with a status of (400|401|403|404|409|429)/.test(text)) {
        problems.push(`console.${type}: ${text}`);
      }
    });
    page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
    await use(page);
    expect(problems, 'console problems').toEqual([]);
  },
});
export { expect };

let counter = 0;
/** A fresh, valid user for each test so tests never depend on each other */
export function newUser(label = 'user') {
  counter += 1;
  const stamp = `${Date.now().toString(36)}${counter}`;
  return { name: `Test ${label}`, email: `${label}.${stamp}@example.com`, password: 'Sturdy-Pass-2026' };
}

/** The demo accounts the server seeds when SEED_DEMO=true */
export const DEMO = { email: 'demo@flowlane.dev', password: 'Demo-Pass-123' };
export const ADMIN = { email: 'admin@flowlane.dev', password: 'Admin-Pass-123' };

/** All messages the server "sent" (the dev outbox), newest last */
export async function outbox(request) {
  const response = await request.get(`${API}/dev/outbox`);
  return (await response.json()).messages;
}
/** The newest message to an address, or undefined */
export async function lastMessageTo(request, email) {
  return (await outbox(request)).filter((m) => m.to === email).at(-1);
}
/** The token inside a link such as http://host/reset-password?token=abc */
export const tokenFromLink = (link) => new URL(link).searchParams.get('token');

export async function signIn(page, { email, password }, { remember = false } = {}) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  if (remember) await page.getByLabel('Remember me').check();
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  // normally /dashboard, or the page that sent you to the login form (the app returns you there)
  await page.waitForURL((url) => !url.pathname.startsWith('/login'));
}

export async function register(page, user) {
  await page.goto('/register');
  await page.getByLabel('Name').fill(user.name);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByLabel('Confirm password').fill(user.password);
  await page.getByRole('button', { name: /create account|register|sign up/i }).click();
  await page.waitForURL('**/dashboard');
}
