import { test, expect, newUser, signUpUI, clientFor, navLink } from './fixtures';

async function openNotes(page) {
  await navLink(page, 'Notes').click();
  await expect(page.getByRole('heading', { name: 'Notes', exact: true }).first()).toBeVisible();
}

test.describe('notes (CRUD against Postgres)', () => {
  test('create, edit and delete a note; tags are a many-to-many relationship', async ({ page }) => {
    const T = `Sprint sync ${Date.now()}`; // teammates' notes are visible too, so the title must be unique
    await signUpUI(page, newUser('crud'));
    await openNotes(page);
    await page.getByRole('button', { name: 'New note' }).click();
    await page.getByLabel('Title').fill(T);
    await page.getByLabel('Body').fill('Review the release checklist and plan the demo.');
    await page.getByLabel('Tags').fill('meeting, release');
    await page.getByRole('button', { name: 'Create note' }).click();
    const card = page.locator('article, li').filter({ hasText: T }).first();
    await expect(card).toBeVisible();
    await expect(card).toContainText('meeting');
    await expect(card).toContainText('#release');

    await page.getByRole('button', { name: `Edit ${T}` }).click();
    await page.getByLabel('Title').fill(`${T} v2`);
    await page.getByLabel('Tags').fill('meeting');
    await page.getByRole('button', { name: 'Save changes' }).click();
    const edited = page.locator('article, li').filter({ hasText: `${T} v2` }).first();
    await expect(edited).toBeVisible();
    await expect(edited).not.toContainText('#release'); // the tag link was removed from the join table

    await page.getByRole('button', { name: `Delete ${T} v2` }).click();
    await page.getByRole('button', { name: 'Yes, delete' }).click();
    await expect(page.getByText(`${T} v2`)).toHaveCount(0);
  });

  test('full-text search ranks matches, understands word forms and highlights safely', async ({ page }) => {
    const user = newUser('fts');
    const { client, id } = await clientFor(user, { signUp: true });
    const { error } = await client.from('notes').insert([
      { owner_id: id, title: 'Running plan', body: 'We are running the migration on Friday.' },
      { owner_id: id, title: 'Lunch', body: 'Pizza at noon. <script>window.__pwned = true</script>' },
      { owner_id: id, title: 'Postgres tips', body: 'Indexes make queries run faster. Run EXPLAIN to see the plan.' },
    ]);
    expect(error).toBeNull();
    await signUpUI(page, newUser('ftsview'));
    await clientFor(user); // (the notes above are private: sign in as that user to see them)
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.goto('/login');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password', { exact: true }).fill(user.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await openNotes(page);
    await page.getByLabel('Full-text search').fill('run');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.locator('mark').first()).toBeVisible(); // "running" and "run" both match the word "run"
    await expect(page.getByText('Running plan').first()).toBeVisible();
    await expect(page.getByText('Postgres tips').first()).toBeVisible();
    await expect(page.getByText('Lunch')).toHaveCount(0);
    await page.getByRole('button', { name: 'Clear search' }).click();
    await page.getByLabel('Full-text search').fill('pizza');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('Lunch').first()).toBeVisible(); // the matching note is listed, its <script> is inert text
    expect(await page.evaluate(() => window.__pwned)).toBeUndefined();
  });

  test('filters and pagination use .eq .gt .lt .ilike .order .range under the hood', async ({ page }) => {
    const user = newUser('filters');
    const { client, id } = await clientFor(user, { signUp: true });
    const { error } = await client.from('notes').insert(Array.from({ length: 8 }, (_, i) => ({ owner_id: id, title: `Filter note ${i + 1}`, priority: i % 6, body: 'x' })));
    expect(error).toBeNull();
    await page.goto('/login');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password', { exact: true }).fill(user.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await openNotes(page);
    expect(await page.locator('article:has-text("Filter note")').count()).toBeLessThanOrEqual(6); // 6 per page (.range)
    await page.getByRole('button', { name: /next/i }).click();
    await expect(page.getByText(/Filter note/).first()).toBeVisible();
    await page.getByRole('button', { name: /More filters/ }).click(); // the rarer filters sit in a panel since Day 22
    await page.getByLabel('Name contains').fill('Filter note 3');
    await page.getByRole('button', { name: 'Apply filters' }).click();
    const cards = page.getByTestId('note-card');
    await expect(cards.filter({ hasText: 'Filter note 3' })).toHaveCount(1);
    await expect(cards.filter({ hasText: 'Filter note 1' })).toHaveCount(0);
    await expect(page.getByRole('list', { name: 'Active filters' })).toContainText('Name: Filter note 3'); // shown as a removable chip
  });
});

test.describe('notes are protected by RLS, and update live', () => {
  test('a teammate sees my TEAM notes (live) but never my private ones', async ({ page, other }) => {
    const [a, b] = [newUser('nta'), newUser('ntb')];
    await signUpUI(page, a);
    await signUpUI(other, b);
    await openNotes(other);
    await expect(other.getByText(/live/i).first()).toBeVisible({ timeout: 15000 }); // the Realtime channel is connected

    await openNotes(page);
    for (const [title, visibility] of [['Private diary', 'private'], ['Team roadmap', 'team']]) {
      await page.getByRole('button', { name: 'New note' }).click();
      await page.getByLabel('Title').fill(title);
      await page.getByLabel('Who can read it').selectOption(visibility);
      await page.getByRole('button', { name: 'Create note' }).click();
      await expect(page.getByText(title).first()).toBeVisible();
    }
    await expect(other.getByText('Team roadmap').first()).toBeVisible({ timeout: 15000 }); // arrived without a reload
    await other.reload();
    await expect(other.getByText('Team roadmap').first()).toBeVisible();
    await expect(other.getByText('Private diary')).toHaveCount(0);
    // and no edit or delete buttons for notes that are not mine
    await expect(other.getByRole('button', { name: 'Delete Team roadmap' })).toHaveCount(0);
  });
});
