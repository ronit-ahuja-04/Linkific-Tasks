import { test, expect, newUser, clientFor, signInUI, navLink } from './fixtures';

/**
 * Day 24, list optimisation: the Files page is a VIRTUALISED list (react-window) that loads pages of 100 as it is
 * scrolled. 150 file records are made for a new user through their own client (RLS applies as usual); no file bytes
 * are needed, the list only shows the records.
 */
test('150 files: the header counts all, only rows near the screen exist, scrolling loads the next page, the last is reachable', async ({ page }) => {
  const user = newUser('virtual');
  const { client, id } = await clientFor(user, { signUp: true });
  const rows = Array.from({ length: 150 }, (_, i) => ({
    owner_id: id, path: `${id}/v-${String(i + 1).padStart(3, '0')}.txt`, name: `file-${String(i + 1).padStart(3, '0')}.txt`,
    mime: 'text/plain', size: 10, created_at: new Date(Date.UTC(2026, 0, 1) + i * 60_000).toISOString(),
  }));
  const { error } = await client.from('files').insert(rows);
  expect(error).toBeNull();

  await signInUI(page, user);
  await navLink(page, 'Files').click();
  await expect(page.getByText('150 files')).toBeVisible(); // the total, not just what is loaded
  const listed = page.getByRole('listitem').filter({ has: page.getByText(/^file-\d{3}\.txt$/) });
  await expect(listed.first()).toBeVisible();
  // newest first; only a window of rows is in the page, each telling screen readers its place in the whole list
  await expect(page.getByTestId('file-row').first()).toHaveAttribute('aria-setsize', '150');
  await expect(page.getByTestId('file-row').first()).toContainText('file-150.txt');
  expect(await page.getByTestId('file-row').count()).toBeLessThan(40);

  // scroll to the end (the page scrolls, not a box inside it): the second page loads and the oldest file appears.
  // The mouse goes over the list first: over the sidebar, the wheel would scroll the sidebar's own menu.
  const box = await page.getByTestId('file-row').first().boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let i = 0; i < 30 && !(await page.locator('.files-name', { hasText: /^file-001\.txt$/ }).isVisible()); i += 1) {
    await page.mouse.wheel(0, 3000);
    await page.waitForTimeout(150);
  }
  await expect(page.locator('.files-name', { hasText: /^file-001\.txt$/ })).toBeVisible();
  await expect(page.getByTestId('file-row').filter({ hasText: 'file-001.txt' })).toHaveAttribute('aria-posinset', '150');
  expect(await page.getByTestId('file-row').count()).toBeLessThan(40); // still a window, not 150 rows
});

test('chat: scrolling up near the top loads earlier messages by itself (no click), and keeps the reader\'s place', async ({ page }) => {
  const user = newUser('scrollup');
  const { client, id } = await clientFor(user, { signUp: true });
  const { data: room, error } = await client.from('rooms').insert({ name: `Scroll ${Date.now() % 100000}`, is_private: true }).select().single();
  expect(error).toBeNull();
  const start = Date.UTC(2026, 0, 1);
  const messages = Array.from({ length: 120 }, (_, i) => ({ room_id: room.id, user_id: id, body: `history line ${i + 1}`, created_at: new Date(start + i * 60_000).toISOString() }));
  expect((await client.from('messages').insert(messages)).error).toBeNull();

  await signInUI(page, user);
  await page.goto(`/chat/${room.id}`);
  const items = page.locator('[role="log"] li');
  await expect(items).toHaveCount(50); // the newest page
  await expect(page.getByText('history line 120')).toBeVisible();

  // scroll to the top of the conversation, as a reader would; nothing is clicked
  await page.locator('.chat-scroll').evaluate((el) => { el.scrollTop = 0; });
  await expect(items).toHaveCount(100);
  // the place is kept: the reader still sees the messages they scrolled up to, not the top of the new page
  await expect(page.getByText('history line 71', { exact: true })).toBeInViewport();
  await expect(page.getByText('history line 21', { exact: true })).not.toBeInViewport();
});
