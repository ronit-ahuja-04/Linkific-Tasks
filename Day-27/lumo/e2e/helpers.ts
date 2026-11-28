import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { expect, type Browser, type Page } from '@playwright/test';

// The tests set up time travel (due reviews, a lapsed flame) and clean up with SQL, so they must never touch a
// hosted project: refuse unless the app points at the local stack.
const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
if (!/^VITE_SUPABASE_URL=["']?http:\/\/(127\.0\.0\.1|localhost)/m.test(env)) {
  throw new Error('The e2e tests only run against the local Supabase stack (npm run env:local).');
}

/** Run SQL as postgres in the local database container and return the unaligned output. */
export function sql(query: string): string {
  return execSync(
    `export DOCKER_HOST=\${DOCKER_HOST:-unix://$HOME/.colima/default/docker.sock}; ` +
      `C=$(docker ps --format '{{.Names}}' | grep '^supabase_db_lumo'); ` +
      `docker exec -i $C psql -U postgres -d postgres -tA -v ON_ERROR_STOP=1`,
    { input: query, encoding: 'utf8', shell: '/bin/zsh' },
  ).trim();
}

/** Run SQL as a given user (for steps that go through RLS, like deleting a live course as the admin). */
export function sqlAs(userId: string, query: string): string {
  return sql(`begin;
select set_config('request.jwt.claims', '{"sub":"${userId}","role":"authenticated"}', true);
${query}
commit;`);
}

export const PASSWORD = 'lumo-demo-123';
export const USERS = {
  maya: { id: 'a0000000-0000-4000-8000-000000000001', email: 'maya@lumo.local' },
  riya: { id: 'a0000000-0000-4000-8000-000000000003', email: 'riya@lumo.local' },
  admin: { id: 'a0000000-0000-4000-8000-000000000004', email: 'admin@lumo.local' },
} as const;
export const CODE_REEF = {
  id: 'c0000000-0000-4000-8000-000000000001',
  slug: 'javascript-foundations',
};

/** A short unique suffix for names, handles and slugs. */
export const stamp = () => Date.now().toString(36).slice(-5);

/**
 * Collects uncaught page errors, console errors and server errors, to assert none happened. The browser also logs
 * every 4xx response; those are the validation answers the tests provoke on purpose (a taken link is a 409), which
 * the app shows as field errors, so they're left out. 5xx responses always count.
 */
export function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/status of 4\d\d/.test(m.text())) errors.push(m.text());
  });
  page.on('response', (r) => {
    if (r.status() >= 500) errors.push(`${r.status()} ${r.url()}`);
  });
  return errors;
}

export async function signIn(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
}

/** A fresh browser context signed in as someone. */
export async function pageAs(browser: Browser, email: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = watchErrors(page);
  await signIn(page, email);
  return { page, errors, close: () => context.close() };
}

/** Pick an option, press Check, and wait for the feedback. */
export async function answer(page: Page, option: RegExp | number) {
  const radio =
    typeof option === 'number'
      ? page.getByRole('radio').nth(option)
      : page.getByRole('radio', { name: option });
  await radio.click();
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
}

/** Horizontal overflow in px at the current viewport (0 means no sideways scrolling). */
export function overflowX(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

/**
 * Delete a course's files from Storage (deleting the course row leaves them behind, and Storage refuses direct SQL
 * deletes). Uses the local stack's service key from `supabase status`, kept in memory only.
 */
export async function removeCourseMedia(courseIds: string[]) {
  if (!courseIds.length) return;
  const status = execSync('npx supabase status -o env', {
    env: {
      ...process.env,
      DOCKER_HOST:
        process.env.DOCKER_HOST ?? `unix://${process.env.HOME}/.colima/default/docker.sock`,
    },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  const read = (name: string) => status.match(new RegExp(`^${name}="?([^"\\n]+)"?$`, 'm'))?.[1];
  const url = read('API_URL');
  const key = read('SERVICE_ROLE_KEY');
  if (!url || !key || !/^http:\/\/(127\.0\.0\.1|localhost)/.test(url))
    throw new Error('Local stack not found');
  for (const id of courseIds) {
    const names = sql(
      `select name from storage.objects where bucket_id = 'course-media' and name like '${id}/%'`,
    );
    if (!names) continue;
    // Storage's REST API directly (supabase-js needs a WebSocket, which Node 20 lacks).
    const res = await fetch(`${url}/storage/v1/object/course-media`, {
      method: 'DELETE',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefixes: names.split('\n') }),
    });
    if (!res.ok) throw new Error(`Could not remove the files of ${id} (${res.status})`);
  }
}
