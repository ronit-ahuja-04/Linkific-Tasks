import { test, expect, uniqueEmail, signUp, column, card, addTask } from './fixtures.js';

/** Keyboard drag and drop: focus the card, Space to lift, arrows to move, Space to drop */
async function keyboardDrag(page, cardLocator, keys) {
  await cardLocator.focus();
  await page.keyboard.press('Space');
  for (const key of keys) {
    await page.waitForTimeout(250);
    await page.keyboard.press(key);
  }
  await page.waitForTimeout(250);
  await page.keyboard.press('Space');
  await page.waitForTimeout(400);
}

test.describe('board tasks', () => {
  test.beforeEach(async ({ page }) => {
    await signUp(page, uniqueEmail('board'));
  });

  test('starts with three empty columns in order', async ({ page }) => {
    await expect(page.locator('.column-title')).toHaveText(['To Do', 'In Progress', 'Done']);
    for (const status of ['todo', 'inprogress', 'done']) {
      await expect(column(page, status).locator('.column-count')).toHaveText('0');
    }
    await expect(column(page, 'todo').getByRole('button', { name: 'Add Task' })).toBeVisible();
    await expect(column(page, 'done').getByRole('button', { name: 'Add Task' })).toHaveCount(0);
  });

  test('creates a task only when it has a title, and keeps it after a reload', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Task' }).click();
    await expect(page.getByRole('button', { name: 'Create Task' })).toBeDisabled(); // no title yet
    await page.getByPlaceholder('Task Title').fill('   '); // spaces only
    await expect(page.getByRole('button', { name: 'Create Task' })).toBeDisabled();
    await expect(page.locator('.task-card')).toHaveCount(0);

    await page.getByPlaceholder('Task Title').fill('Write the report');
    await page.getByPlaceholder('Add a more detailed description...').fill('Quarterly numbers');
    await page.locator('.modal-content select').selectOption('high');
    await page.getByRole('button', { name: 'Create Task' }).click();

    await expect(page.getByPlaceholder('Task Title')).toHaveCount(0); // panel closed
    await expect(card(page, 'Write the report')).toBeVisible();
    await expect(card(page, 'Write the report').locator('.task-priority')).toHaveText('high');
    await expect(column(page, 'todo').locator('.column-count')).toHaveText('1');
    await page.reload();
    await expect(card(page, 'Write the report')).toBeVisible();
    await expect(column(page, 'todo').locator('.column-count')).toHaveText('1');
  });

  test('closing or cancelling a draft creates nothing', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Task' }).click();
    await page.getByPlaceholder('Task Title').fill('Never saved');
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('.task-card')).toHaveCount(0);
    await page.getByRole('button', { name: 'Add Task' }).click();
    await page.getByPlaceholder('Task Title').fill('Also never saved');
    await page.locator('.modal-content > div').first().locator('button').click(); // the X
    await expect(page.locator('.task-card')).toHaveCount(0);
    await page.getByRole('button', { name: 'Add Task' }).click();
    await expect(page.getByPlaceholder('Task Title')).toHaveValue(''); // a fresh draft each time
  });

  test('a priority change in the draft is respected, defaulting to medium', async ({ page }) => {
    await addTask(page, 'Default priority');
    await addTask(page, 'Low one', { priority: 'low' });
    await expect(card(page, 'Default priority').locator('.task-priority')).toHaveText('medium');
    await expect(card(page, 'Low one').locator('.task-priority')).toHaveText('low');
  });

  test('opens a task, edits it, and saves the changes', async ({ page }) => {
    await addTask(page, 'Original title', { description: 'Original description' });
    await card(page, 'Original title').click();
    await expect(page.locator('.modal-content h2')).toHaveText('Original title');
    await expect(page.getByText('Original description')).toBeVisible();
    await page.locator('.modal-content').getByRole('button', { name: 'Edit Task' }).click();
    await page.getByPlaceholder('Task Title').fill('Renamed task');
    await page.locator('.modal-content select').selectOption('low');
    await page.getByRole('button', { name: 'Update Task' }).click();
    await expect(page.locator('.modal-content h2')).toHaveText('Renamed task');
    await page.locator('.modal-content > div').first().locator('button').click();
    await expect(card(page, 'Renamed task').locator('.task-priority')).toHaveText('low');
    await page.reload();
    await expect(card(page, 'Renamed task')).toBeVisible();
    await expect(card(page, 'Original title')).toHaveCount(0);
  });

  test('cancelling an edit throws the changes away', async ({ page }) => {
    await addTask(page, 'Keep me');
    await card(page, 'Keep me').click();
    await page.locator('.modal-content').getByRole('button', { name: 'Edit Task' }).click();
    await page.getByPlaceholder('Task Title').fill('Thrown away');
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('.modal-content h2')).toHaveText('Keep me');
  });

  test('deletes a task from the card and from the panel', async ({ page }) => {
    await addTask(page, 'Delete from card');
    await addTask(page, 'Delete from panel');
    await card(page, 'Delete from card').getByTitle('Delete Task').click();
    await expect(card(page, 'Delete from card')).toHaveCount(0);
    await card(page, 'Delete from panel').click();
    await page.locator('.modal-content').getByRole('button', { name: 'Delete Task' }).click();
    await expect(page.locator('.task-card')).toHaveCount(0);
    await expect(column(page, 'todo').locator('.column-count')).toHaveText('0');
    await page.reload();
    await expect(page.locator('.task-card')).toHaveCount(0);
  });

  test('moves a card to another column with the keyboard and keeps it there after a reload', async ({ page }) => {
    await addTask(page, 'Mover');
    await keyboardDrag(page, card(page, 'Mover'), ['ArrowRight']);
    await expect(column(page, 'inprogress').locator('.task-card', { hasText: 'Mover' })).toBeVisible();
    await expect(column(page, 'todo').locator('.column-count')).toHaveText('0');
    await expect(column(page, 'inprogress').locator('.column-count')).toHaveText('1');
    await page.reload();
    await expect(column(page, 'inprogress').locator('.task-card', { hasText: 'Mover' })).toBeVisible();
  });

  test('reorders cards inside a column', async ({ page }) => {
    await addTask(page, 'First');
    await addTask(page, 'Second');
    await addTask(page, 'Third');
    await expect(column(page, 'todo').locator('.task-title')).toHaveText(['First', 'Second', 'Third']);
    await keyboardDrag(page, card(page, 'Third'), ['ArrowUp', 'ArrowUp']);
    await expect(column(page, 'todo').locator('.task-title')).toHaveText(['Third', 'First', 'Second']);
    await page.reload();
    await expect(column(page, 'todo').locator('.task-title')).toHaveText(['Third', 'First', 'Second']);
  });

  test('a finished task cannot be moved back out of Done', async ({ page }) => {
    await addTask(page, 'Finish me');
    await keyboardDrag(page, card(page, 'Finish me'), ['ArrowRight', 'ArrowRight']);
    await expect(column(page, 'done').locator('.task-card', { hasText: 'Finish me' })).toBeVisible();
    await keyboardDrag(page, card(page, 'Finish me'), ['ArrowLeft']);
    await expect(column(page, 'done').locator('.task-card', { hasText: 'Finish me' })).toBeVisible();
    await expect(column(page, 'inprogress').locator('.column-count')).toHaveText('0');
    await page.reload();
    await expect(column(page, 'done').locator('.task-card', { hasText: 'Finish me' })).toBeVisible();
  });

  test('typing a title and then changing the assignees does not wipe what you typed', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Task' }).click();
    await page.getByPlaceholder('Task Title').fill('Keep this title');
    await page.getByPlaceholder('Add a more detailed description...').fill('and this text');
    // a new task starts assigned to its creator
    await expect(page.locator('.avatar-group > img')).toHaveCount(1);
    await page.locator('.avatar-group button', { hasText: '+' }).click();
    await page.getByText('Assign to...').locator('xpath=following-sibling::div').first().click(); // unassign yourself
    await expect(page.locator('.avatar-group > img')).toHaveCount(0);
    await expect(page.getByPlaceholder('Task Title')).toHaveValue('Keep this title');
    await expect(page.getByPlaceholder('Add a more detailed description...')).toHaveValue('and this text');
    await page.getByText('Assign to...').locator('xpath=following-sibling::div').first().click(); // assign again
    await expect(page.locator('.avatar-group > img')).toHaveCount(1);
    await page.getByRole('button', { name: 'Create Task' }).click();
    await expect(card(page, 'Keep this title')).toBeVisible();
    await expect(card(page, 'Keep this title').locator('.avatar')).toHaveCount(1);
  });

  test('the board survives switching tabs and projects', async ({ page }) => {
    await addTask(page, 'Persistent');
    await page.getByText('Activity', { exact: true }).click();
    await expect(page.getByPlaceholder('Type a message...')).toBeVisible();
    await page.locator('.tab', { hasText: 'Board' }).click();
    await expect(card(page, 'Persistent')).toBeVisible();
  });
});
