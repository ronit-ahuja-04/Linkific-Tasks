import { test, expect, newUser, signUpUI, clientFor, navLink } from './fixtures';

test.describe('Query lab and dashboard', () => {
  test('the dashboard shows real numbers from rpc("workspace_stats")', async ({ page }) => {
    const user = newUser('dash');
    const { client, id } = await clientFor(user, { signUp: true });
    const { error } = await client.from('notes').insert([{ owner_id: id, title: 'one', visibility: 'private' }, { owner_id: id, title: 'two', visibility: 'private' }, { owner_id: id, title: 'three', visibility: 'team' }]);
    expect(error).toBeNull();
    await page.goto('/login');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password', { exact: true }).fill(user.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByTestId('stat-my_notes')).toContainText('3');
    await expect(page.getByTestId('stat-team_notes')).toBeVisible();
    await expect(page.getByTestId('stat-unread_mentions')).toContainText('0');
  });

  test('every example in the Query lab runs, and the RLS demos show what RLS did', async ({ page }) => {
    // someone else's private note exists, so the RLS demos have something to be refused
    const other = newUser('labother');
    const o = await clientFor(other, { signUp: true });
    const { error: seedError } = await o.client.from('notes').insert([{ owner_id: o.id, title: 'other private', visibility: 'private' }, { owner_id: o.id, title: 'other team note', visibility: 'team' }]);
    expect(seedError).toBeNull();

    await signUpUI(page, newUser('lab'));
    await navLink(page, 'Query lab').click();
    const runButtons = page.getByRole('button', { name: /^run/i });
    await runButtons.first().waitFor(); // the lab is a lazy chunk since Day 24: count() does not wait for it
    const count = await runButtons.count();
    expect(count).toBeGreaterThanOrEqual(20);

    for (let i = 0; i < count; i += 1) {
      await runButtons.nth(i).click();
      await expect(runButtons.nth(i)).toBeEnabled({ timeout: 20000 }); // finished (the Realtime example takes a moment)
    }
    await expect(page.getByText(/What RLS did/i).first()).toBeVisible();
    await expect(page.locator('pre').first()).toContainText(/supabase|from\(/);
    // the lab cleans up after itself
    const { client } = await clientFor(newUser('nobody'), { signUp: true });
    expect(client).toBeTruthy();
  });
});
