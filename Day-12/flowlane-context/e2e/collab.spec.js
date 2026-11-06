import { test, expect, uniqueEmail, signUp, signOut, sidebarProject, column, card, addTask, createProject } from './fixtures.js';

const nameOf = (email) => email.split('@')[0];

async function keyboardDrag(page, cardLocator, keys) {
  await cardLocator.focus();
  await page.keyboard.press('Space');
  for (const key of keys) { await page.waitForTimeout(250); await page.keyboard.press(key); }
  await page.waitForTimeout(250);
  await page.keyboard.press('Space');
  await page.waitForTimeout(400);
}

async function invite(page, email) {
  const input = page.getByPlaceholder('Email address');
  // after an error toast the invite box stays open so the email can be corrected
  if (!(await input.isVisible())) await page.getByRole('button', { name: 'Invite', exact: true }).click();
  await input.fill(email);
  await page.getByRole('button', { name: 'Send Invite' }).click();
}

const toast = (page, text) => page.locator('.toast', { hasText: text });
const snack = (page, text) => page.locator('.snack', { hasText: text });

/** A owns "Team Alpha"; B has been invited and has accepted. Returns both pages and emails. */
async function team(page, newUserPage) {
  const emailA = uniqueEmail('alice');
  const emailB = uniqueEmail('bob');
  const b = await newUserPage('B');
  await signUp(page, emailA);
  await signUp(b, emailB);
  await createProject(page, 'Team Alpha');
  await expect(page.getByRole('heading', { name: 'Team Alpha' })).toBeVisible();
  await invite(page, emailB);
  await expect(snack(page, `Invitation sent to ${nameOf(emailB)}!`)).toBeVisible();
  await expect(toast(b, 'invited you to')).toContainText('Team Alpha');
  await toast(b, 'invited you to').getByRole('button', { name: 'Accept' }).click();
  await expect(snack(b, 'You joined Team Alpha!')).toBeVisible();
  await sidebarProject(b, 'Team Alpha').click();
  await expect(b.getByRole('heading', { name: 'Team Alpha' })).toBeVisible();
  return { a: page, b, emailA, emailB };
}

test.describe('invitations', () => {
  test('invite, accept, and the owner is told that the new member joined', async ({ page, newUserPage }) => {
    const { a, emailB } = await team(page, newUserPage);
    await expect(toast(a, 'joined project "Team Alpha"')).toContainText(nameOf(emailB));
    await expect(a.locator('.project-users .avatar')).toHaveCount(2); // both members in the header
  });

  test('the invitation toast disappears once accepted, and the project stays after a reload', async ({ page, newUserPage }) => {
    const { b } = await team(page, newUserPage);
    await expect(toast(b, 'invited you to')).toHaveCount(0);
    await b.reload();
    await expect(sidebarProject(b, 'Team Alpha')).toHaveCount(1);
  });

  test('declining removes the invitation, and the person can be invited again', async ({ page, newUserPage }) => {
    const emailC = uniqueEmail('carol');
    const c = await newUserPage('C');
    await signUp(page, uniqueEmail('owner'));
    await signUp(c, emailC);
    // someone can only be invited once their profile exists: wait until the owner can see them
    await page.locator('.nav-item', { hasText: 'Messages' }).click();
    await expect(page.getByText(emailC, { exact: true })).toBeVisible();
    await page.locator('.sidebar .nav-item', { hasText: 'My First Project' }).click();
    await invite(page, emailC);
    await toast(c, 'invited you to').getByRole('button', { name: 'Decline' }).click();
    await expect(toast(c, 'invited you to')).toHaveCount(0);
    await c.reload();
    await expect(c.getByText('Your Projects')).toBeVisible();
    await expect(toast(c, 'invited you to')).toHaveCount(0);
    await invite(page, emailC);
    await expect(snack(page, 'Invitation sent')).toBeVisible();
    await expect(toast(c, 'invited you to')).toBeVisible();
  });

  test('explains when the email is unknown or the person is already a member', async ({ page, newUserPage }) => {
    const { a, emailB } = await team(page, newUserPage);
    await invite(a, 'nobody-registered@test.dev');
    await expect(a.getByRole('alert').filter({ hasText: 'No user found with that email' })).toBeVisible();
    await invite(a, emailB);
    await expect(a.getByRole('alert').filter({ hasText: `${nameOf(emailB)} is already in this project!` })).toBeVisible();
  });

  test('the invite box closes when you click elsewhere', async ({ page }) => {
    await signUp(page, uniqueEmail('inv'));
    await page.getByRole('button', { name: 'Invite' }).click();
    await expect(page.getByPlaceholder('Email address')).toBeVisible();
    await page.locator('.project-header h1').click();
    await expect(page.getByPlaceholder('Email address')).toHaveCount(0);
  });
});

test.describe('shared board', () => {
  test('tasks and moves sync live between members; members cannot create, edit or delete', async ({ page, newUserPage }) => {
    const { a, b } = await team(page, newUserPage);
    await addTask(a, 'Realtime task');
    await expect(card(b, 'Realtime task')).toBeVisible(); // no reload needed
    await expect(toast(b, 'created a new task: Realtime task')).toBeVisible();

    // members see no owner-only controls
    await expect(b.getByRole('button', { name: 'Add Task' })).toHaveCount(0);
    await expect(b.getByRole('button', { name: 'Delete Project' })).toHaveCount(0);
    await expect(card(b, 'Realtime task').getByTitle('Delete Task')).toHaveCount(0);
    await expect(card(b, 'Realtime task').getByTitle('Edit Task')).toHaveCount(0);
    await card(b, 'Realtime task').click();
    await expect(b.locator('.modal-content h2')).toHaveText('Realtime task');
    await expect(b.locator('.modal-content').getByRole('button', { name: 'Edit Task' })).toHaveCount(0);
    await expect(b.locator('.modal-content').getByRole('button', { name: 'Delete Task' })).toHaveCount(0);
    await b.locator('.modal-content > div').first().locator('button').click();

    // ...but they can move cards, and the owner sees it live
    await keyboardDrag(b, card(b, 'Realtime task'), ['ArrowRight']);
    await expect(column(a, 'inprogress').locator('.task-card', { hasText: 'Realtime task' })).toBeVisible();
    await expect(column(a, 'todo').locator('.column-count')).toHaveText('0');
  });

  test('deleting a task and editing it are visible to the other member immediately', async ({ page, newUserPage }) => {
    const { a, b } = await team(page, newUserPage);
    await addTask(a, 'Edit me');
    await expect(card(b, 'Edit me')).toBeVisible();
    await card(a, 'Edit me').click();
    await a.locator('.modal-content').getByRole('button', { name: 'Edit Task' }).click();
    await a.getByPlaceholder('Task Title').fill('Edited live');
    await a.locator('.modal-content select').selectOption('high');
    await a.getByRole('button', { name: 'Update Task' }).click();
    await expect(card(b, 'Edited live').locator('.task-priority')).toHaveText('high');
    await a.locator('.modal-content > div').first().locator('button').click();
    await card(a, 'Edited live').getByTitle('Delete Task').click();
    await expect(card(b, 'Edited live')).toHaveCount(0);
  });

  test('assigning a member notifies them; they see it in the notifications page and clicking it opens the project', async ({ page, newUserPage }) => {
    const { a, b, emailB } = await team(page, newUserPage);
    await addTask(a, 'Assign me');
    await card(a, 'Assign me').click();
    await a.locator('.modal-content').getByRole('button', { name: 'Edit Task' }).click();
    await a.locator('.avatar-group button', { hasText: '+' }).click();
    await a.locator('div', { hasText: new RegExp(`^${nameOf(emailB)}$`) }).last().click();
    await a.getByRole('button', { name: 'Update Task' }).click();
    await expect(toast(b, 'assigned you to a task: Assign me')).toBeVisible();
    await expect(card(b, 'Assign me').locator('.avatar')).toHaveCount(2); // owner (default) + Bob

    await b.getByRole('button', { name: 'Notifications' }).click();
    // scoped to the page content: the matching toast may still be on screen and is a different element
    const notification = b.locator('main').locator('div', { hasText: 'assigned you to a task: Assign me' }).last();
    await expect(notification).toBeVisible();
    await notification.click();
    await expect(b).toHaveURL(/\/projects\//);
    await b.getByRole('button', { name: 'Notifications' }).click();
    await expect(b.locator('main').getByText('assigned you to a task: Assign me')).toHaveCount(0); // dismissed by clicking
  });

  test('"Clear All" empties the notifications page', async ({ page, newUserPage }) => {
    const { a, b } = await team(page, newUserPage);
    await addTask(a, 'One');
    await addTask(a, 'Two');
    await expect(toast(b, 'created a new task: Two')).toBeVisible();
    await b.getByRole('button', { name: 'Notifications' }).click();
    // scoped to the page content: a matching toast may still be on screen as well
    await expect(b.locator('main').getByText('created a new task: One')).toBeVisible();
    await b.getByRole('button', { name: 'Clear All' }).click();
    await expect(b.getByText("You're all caught up!")).toBeVisible();
    await b.reload();
    await b.getByRole('button', { name: 'Notifications' }).click();
    await expect(b.getByText("You're all caught up!")).toBeVisible();
  });

  test('the owner can delete the project; the other member is moved away without errors', async ({ page, newUserPage }) => {
    const { a, b } = await team(page, newUserPage);
    await a.getByRole('button', { name: 'Delete Project' }).click();
    await a.locator('.modal-content', { hasText: 'This action cannot be undone' }).getByRole('button', { name: 'Delete Project' }).click();
    await expect(sidebarProject(a, 'Team Alpha')).toHaveCount(0);
    await expect(sidebarProject(b, 'Team Alpha')).toHaveCount(0);
    await expect(b.getByRole('heading', { name: 'My First Project' })).toBeVisible();
  });

  test('assigning someone else as owner when creating a project: they become the owner, you do not', async ({ page, newUserPage }) => {
    const { a, b, emailB } = await team(page, newUserPage);
    await createProject(a, 'Bobs Project', emailB);
    await expect(snack(a, 'Created project "Bobs Project"!')).toBeVisible();
    await expect(toast(b, 'assigned you as the owner')).toBeVisible();
    await sidebarProject(b, 'Bobs Project').click();
    await expect(b.getByRole('button', { name: 'Add Task' })).toBeVisible(); // owner
    await expect(b.getByRole('button', { name: 'Delete Project' })).toBeVisible();
    await expect(a.getByRole('button', { name: 'Add Task' })).toHaveCount(0); // creator is only a member
    await expect(a.getByRole('button', { name: 'Delete Project' })).toHaveCount(0);
  });
});

test.describe('chat', () => {
  test('project chat: messages appear live, a red dot flags new activity, and it clears when opened', async ({ page, newUserPage }) => {
    const { a, b } = await team(page, newUserPage);
    await a.getByText('Activity', { exact: true }).click();
    await expect(a.getByText('No messages yet. Say hi!')).toBeVisible();
    await a.getByPlaceholder('Type a message...').fill('hello team');
    await a.getByRole('button', { name: 'Send message' }).click();
    await expect(a.locator('.chat-messages', { hasText: 'hello team' })).toBeVisible();

    // B is on the board: the Activity tab shows a dot, then the message after opening it
    await expect(b.locator('.tab', { hasText: 'Activity' }).locator('span')).toBeVisible();
    await expect(toast(b, 'sent a message: hello team')).toBeVisible();
    await b.getByText('Activity', { exact: true }).click();
    await expect(b.locator('.chat-messages', { hasText: 'hello team' })).toBeVisible();
    await expect(b.locator('.tab', { hasText: 'Activity' }).locator('span')).toHaveCount(0);

    await b.getByPlaceholder('Type a message...').fill('hi Alice');
    await b.getByPlaceholder('Type a message...').press('Enter');
    await expect(a.locator('.chat-messages', { hasText: 'hi Alice' })).toBeVisible();
    await expect(b.getByPlaceholder('Type a message...')).toHaveValue('');
  });

  test('the send button is disabled for an empty message', async ({ page }) => {
    await signUp(page, uniqueEmail('chat'));
    await page.getByText('Activity', { exact: true }).click();
    await expect(page.locator('.chat-send-btn')).toBeDisabled();
    await page.getByPlaceholder('Type a message...').fill('   ');
    await expect(page.locator('.chat-send-btn')).toBeDisabled();
    await page.getByPlaceholder('Type a message...').fill('real text');
    await expect(page.locator('.chat-send-btn')).toBeEnabled();
  });

  test('direct messages: unread badge for the recipient, cleared when they open Messages', async ({ page, newUserPage }) => {
    const { a, b, emailB, emailA } = await team(page, newUserPage);
    await a.locator('.nav-item', { hasText: 'Messages' }).click();
    await expect(a.getByText('Select a person to start chatting.')).toBeVisible();
    await a.getByPlaceholder('Search people...').fill(nameOf(emailB));
    await a.getByText(emailB, { exact: true }).click();
    await a.getByPlaceholder('Type a message...').fill('private hello');
    await a.getByPlaceholder('Type a message...').press('Enter');
    await expect(a.locator('.chat-messages', { hasText: 'private hello' })).toBeVisible();

    const badge = b.locator('.nav-item', { hasText: 'Messages' }).locator('span');
    await expect(badge).toHaveText('1');
    await expect(toast(b, 'sent you a message: private hello')).toBeVisible();
    await b.locator('.nav-item', { hasText: 'Messages' }).click();
    await expect(badge).toHaveCount(0);
    await b.getByText(emailA, { exact: true }).click();
    await expect(b.locator('.chat-messages', { hasText: 'private hello' })).toBeVisible();
    await b.getByPlaceholder('Type a message...').fill('private reply');
    await b.getByPlaceholder('Type a message...').press('Enter');
    await expect(a.locator('.chat-messages', { hasText: 'private reply' })).toBeVisible();
  });

  test('the people search filters the list and says when nobody matches', async ({ page, newUserPage }) => {
    const { a, emailB } = await team(page, newUserPage);
    await a.locator('.nav-item', { hasText: 'Messages' }).click();
    await a.getByPlaceholder('Search people...').fill(nameOf(emailB));
    await expect(a.getByText(emailB, { exact: true })).toBeVisible();
    await a.getByPlaceholder('Search people...').fill('zzz-nobody');
    await expect(a.getByText('No users found.')).toBeVisible();
  });
});
