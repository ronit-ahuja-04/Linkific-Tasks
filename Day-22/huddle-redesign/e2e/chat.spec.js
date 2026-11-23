import { test, expect, newUser, signUpUI, navLink } from './fixtures';

const roomName = () => `Lounge ${Date.now().toString(36)}`;

async function createRoom(page, name, { isPrivate = false } = {}) {
  await navLink(page, 'Chat').click();
  await page.getByText('New room', { exact: true }).click(); // the form is a collapsed section
  await page.getByLabel('Room name').fill(name);
  if (isPrivate) await page.getByLabel(/private/i).check();
  await page.getByRole('button', { name: /create room/i }).click();
  await expect(page.getByRole('heading', { name: new RegExp(name) })).toBeVisible();
}

async function joinRoom(page, name) {
  await navLink(page, 'Chat').click();
  await page.getByRole('main').getByRole('link', { name: new RegExp(name) }).click(); // the chat page's list (the sidebar lists joined rooms too)
  await expect(page.getByRole('heading', { name: new RegExp(name) })).toBeVisible();
}

const send = async (page, text) => {
  const box = page.getByLabel('Message', { exact: true });
  await box.fill(text);
  await box.press('Enter');
};
const log = (page) => page.getByRole('log', { name: 'Messages' });

test.describe('two people in a room, live', () => {
  test('messages, edits and deletes appear in the other window without a reload (Realtime postgres_changes)', async ({ page, other }) => {
    const [a, b] = [newUser('cha'), newUser('chb')];
    const name = roomName();
    await signUpUI(page, a);
    await signUpUI(other, b);
    await createRoom(page, name);
    await joinRoom(other, name);

    await send(page, 'hello from A');
    await expect(log(other)).toContainText('hello from A');
    await send(other, 'hi back from B');
    await expect(log(page)).toContainText('hi back from B');
    await expect(log(page)).toContainText(b.username); // the author came with the message: an embedded relationship

    // edit: B sees the new text; delete: it disappears
    await page.getByRole('button', { name: /Edit your message from/ }).click();
    const editBox = page.getByRole('textbox', { name: 'Edit message' });
    await editBox.fill('hello from A (edited)');
    await page.getByRole('button', { name: 'Save', exact: true }).click(); // (Enter adds a line in this box)
    await expect(log(other)).toContainText('hello from A (edited)');
    await expect(log(other)).toContainText(/edited/i);
    await page.getByRole('button', { name: /Delete your message from/ }).first().click();
    await page.getByRole('group', { name: 'Confirm delete' }).getByRole('button', { name: /yes|delete|confirm/i }).click();
    await expect(log(other)).not.toContainText('hello from A (edited)');
  });

  test('Presence shows who is online and Broadcast shows who is typing (nothing is stored in the database)', async ({ page, other }) => {
    const [a, b] = [newUser('pra'), newUser('prb')];
    const name = roomName();
    await signUpUI(page, a);
    await signUpUI(other, b);
    await createRoom(page, name);
    await joinRoom(other, name);
    await expect(page.locator('.chat-online')).toContainText(b.username, { timeout: 15000 });
    await expect(other.locator('.chat-online')).toContainText(a.username);
    await other.getByLabel('Message', { exact: true }).pressSequentially('typing something', { delay: 30 });
    await expect(page.locator('.chat-typing')).toContainText(`${b.username} is typing`);
    await other.getByLabel('Message', { exact: true }).fill('');
    await expect(page.locator('.chat-typing')).toBeEmpty({ timeout: 8000 }); // it clears by itself after a few seconds
  });

  test('an @mention creates a notification (a database trigger) that reaches the bell live; Mark all read clears it', async ({ page, other }) => {
    const [a, b] = [newUser('mna'), newUser('mnb')];
    const name = roomName();
    await signUpUI(page, a);
    await signUpUI(other, b);
    await createRoom(page, name);
    await joinRoom(other, name);
    await expect(other.getByRole('button', { name: 'Notifications, none unread' })).toBeVisible();

    await send(page, `welcome @${b.username}!`);
    await expect(other.getByRole('button', { name: 'Notifications, 1 unread' })).toBeVisible({ timeout: 15000 });
    await other.getByRole('button', { name: /Notifications, 1 unread/ }).click();
    await expect(other.getByRole('region', { name: 'Notification list' })).toContainText('welcome');
    await other.getByRole('button', { name: 'Mark all read' }).click();
    await expect(other.getByRole('button', { name: 'Notifications, none unread' })).toBeVisible();
  });

  test('an unread badge builds up for a room you are not looking at, and resets when you open it', async ({ page, other }) => {
    const [a, b] = [newUser('una'), newUser('unb')];
    const name = roomName();
    await signUpUI(page, a);
    await signUpUI(other, b);
    await createRoom(page, name);
    await joinRoom(other, name);
    await navLink(other, 'Notes').click(); // B looks at something else
    await navLink(other, 'Chat').click();
    await other.waitForTimeout(1500); // let the new Realtime channel become live before the messages are sent
    await send(page, 'one');
    await expect(log(page)).toContainText('one'); // the composer ignores Enter while a message is still sending
    await send(page, 'two');
    await expect(log(page)).toContainText('two');
    await expect(other.locator('.chat-unread')).toHaveText('2', { timeout: 15000 });
    await other.getByRole('main').getByRole('link', { name: new RegExp(name) }).click();
    await expect(other.locator('.chat-unread')).toHaveCount(0);
  });

  test('message text is shown as text, never as HTML', async ({ page, other }) => {
    const name = roomName();
    await signUpUI(page, newUser('xsa'));
    await signUpUI(other, newUser('xsb'));
    await createRoom(page, name);
    await joinRoom(other, name);
    await send(page, '<img src=x onerror="window.__pwned = true"> <b>bold?</b>');
    await expect(log(other)).toContainText('<b>bold?</b>');
    expect(await other.evaluate(() => window.__pwned)).toBeUndefined();
    expect(await other.locator('.chat-messages b').count()).toBe(0);
  });
});

test.describe('rooms and files', () => {
  test('a private room is invisible to other people (Row Level Security), even by its address', async ({ page, other }) => {
    const name = roomName();
    await signUpUI(page, newUser('pva'));
    await signUpUI(other, newUser('pvb'));
    await createRoom(page, name, { isPrivate: true });
    const roomUrl = page.url();
    await send(page, 'private words');
    await navLink(other, 'Chat').click();
    await expect(other.getByRole('link', { name: new RegExp(name) })).toHaveCount(0);
    await other.goto(new URL(roomUrl).pathname);
    await expect(other.getByText('private words')).toHaveCount(0);
  });

  test('a file attached to a message downloads for the other person through a short-lived signed URL', async ({ page, other }) => {
    const name = roomName();
    await signUpUI(page, newUser('fla'));
    await signUpUI(other, newUser('flb'));
    await createRoom(page, name);
    await joinRoom(other, name);
    await page.locator('input[type="file"]').first().setInputFiles({ name: 'plan.txt', mimeType: 'text/plain', buffer: Buffer.from('the secret plan') });
    await send(page, 'see the attachment');
    await expect(log(other)).toContainText('plan.txt', { timeout: 15000 });
    const downloadPromise = other.waitForEvent('download');
    await other.getByRole('button', { name: /plan\.txt/ }).or(other.getByRole('link', { name: /plan\.txt/ })).first().click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('plan.txt');
    const stream = await download.createReadStream();
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    expect(Buffer.concat(chunks).toString()).toBe('the secret plan');
  });
});
