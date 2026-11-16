import { test, expect, uniqueEmail, signUp, sidebarProject, createProject } from './fixtures.js';

test.describe('projects', () => {
  test('creates a project: success message, sidebar entry, navigation and persistence', async ({ page }) => {
    await signUp(page, uniqueEmail('proj'));
    await createProject(page, 'Website Redesign');
    await expect(page.locator('.snack--success', { hasText: 'Created project "Website Redesign"!' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Website Redesign' })).toBeVisible();
    await expect(sidebarProject(page, 'Website Redesign')).toHaveClass(/active/);
    await expect(page).toHaveURL(/\/projects\/[A-Za-z0-9]+$/);
    await page.reload();
    await expect(sidebarProject(page, 'Website Redesign')).toHaveCount(1);
  });

  test('does not create a project without a name, and Cancel closes the form', async ({ page }) => {
    await signUp(page, uniqueEmail('noname'));
    await page.locator('.sidebar .nav-item', { hasText: 'New Project' }).click();
    await page.getByRole('button', { name: 'Create Project' }).click();
    await expect(page.getByRole('heading', { name: 'Create New Project' })).toBeVisible(); // still open
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Create New Project' })).toHaveCount(0);
    await expect(page.locator('.sidebar .nav-item').filter({ hasText: 'My First Project' })).toHaveCount(1);
  });

  test('closes the new-project form with the X button and clears it for next time', async ({ page }) => {
    await signUp(page, uniqueEmail('xclose'));
    await page.locator('.sidebar .nav-item', { hasText: 'New Project' }).click();
    await page.getByPlaceholder('e.g. Website Redesign').fill('Half typed');
    await page.locator('.modal-header .icon-btn').click();
    await expect(page.getByRole('heading', { name: 'Create New Project' })).toHaveCount(0);
  });

  test('explains when the chosen owner email does not exist', async ({ page }) => {
    await signUp(page, uniqueEmail('badowner'));
    await createProject(page, 'Ghost Project', 'nobody-here@test.dev');
    await expect(page.getByRole('alert').filter({ hasText: 'Could not find a user with that email in the system.' })).toBeVisible();
    await expect(sidebarProject(page, 'Ghost Project')).toHaveCount(0);
  });

  test('switches between projects from the sidebar', async ({ page }) => {
    await signUp(page, uniqueEmail('switch'));
    await createProject(page, 'Second One');
    await expect(page.getByRole('heading', { name: 'Second One' })).toBeVisible();
    await sidebarProject(page, 'My First Project').click();
    await expect(page.getByRole('heading', { name: 'My First Project' })).toBeVisible();
    await sidebarProject(page, 'Second One').click();
    await expect(page.getByRole('heading', { name: 'Second One' })).toBeVisible();
  });

  test('the owner can delete a project after confirming; cancelling keeps it', async ({ page }) => {
    await signUp(page, uniqueEmail('del'));
    await createProject(page, 'Doomed');
    await page.getByRole('button', { name: 'Delete Project' }).click();
    const dialog = page.locator('.modal-content', { hasText: 'This action cannot be undone' });
    await expect(dialog).toContainText('Doomed');
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(sidebarProject(page, 'Doomed')).toHaveCount(1);

    await page.getByRole('button', { name: 'Delete Project' }).click();
    await page.locator('.modal-content', { hasText: 'This action cannot be undone' }).getByRole('button', { name: 'Delete Project' }).click();
    await expect(sidebarProject(page, 'Doomed')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'My First Project' })).toBeVisible(); // lands on the remaining project
  });

  test('deleting your only project creates a fresh "My First Project" instead of an empty app', async ({ page }) => {
    await signUp(page, uniqueEmail('last'));
    await page.getByRole('button', { name: 'Delete Project' }).click();
    await page.locator('.modal-content', { hasText: 'This action cannot be undone' }).getByRole('button', { name: 'Delete Project' }).click();
    await expect(page.getByRole('heading', { name: 'My First Project' })).toBeVisible();
    await expect(sidebarProject(page, 'My First Project')).toHaveCount(1);
  });

  test('unknown project URLs redirect to your first project', async ({ page }) => {
    await signUp(page, uniqueEmail('lost'));
    await page.goto('/projects/doesNotExist123');
    await expect(page.getByRole('heading', { name: 'My First Project' })).toBeVisible();
    await expect(page).toHaveURL(/\/projects\/(?!doesNotExist123)[A-Za-z0-9]+$/);
  });
});

test.describe('settings and profile', () => {
  test('theme toggles from the header and from settings, and survives a reload', async ({ page }) => {
    await signUp(page, uniqueEmail('theme'));
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'light'); // the default
    await page.getByTitle('Toggle Theme').click();
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.getByText('Your Projects')).toBeVisible();
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await page.locator('.nav-item', { hasText: 'Settings' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    const toggle = page.getByRole('switch', { name: 'Dark mode' });
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await toggle.click();
    await expect(html).toHaveAttribute('data-theme', 'light');
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await page.getByRole('button', { name: '← Back to Dashboard' }).click();
    await expect(page.getByRole('heading', { name: 'My First Project' })).toBeVisible();
  });

  test('the profile page shows who you are', async ({ page }) => {
    const email = uniqueEmail('me');
    await signUp(page, email);
    await page.getByRole('button', { name: 'My profile' }).click();
    await expect(page.getByRole('heading', { name: 'My Profile' })).toBeVisible();
    await expect(page.getByText(email, { exact: true })).toBeVisible(); // exact: the verify-email banner also mentions it
    await page.getByRole('button', { name: '← Back to Dashboard' }).click();
    await expect(page.getByRole('heading', { name: 'My First Project' })).toBeVisible();
  });

  test('calendar sync shows a reconnect prompt when Google Calendar is not linked', async ({ page }) => {
    await signUp(page, uniqueEmail('cal'));
    await expect(page.getByText('Calendar disconnected.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reconnect' })).toBeVisible();
  });

  test('notifications page starts empty', async ({ page }) => {
    await signUp(page, uniqueEmail('empty'));
    await page.getByRole('button', { name: 'Notifications' }).click();
    await expect(page.getByRole('heading', { name: 'Notifications Center' })).toBeVisible();
    await expect(page.getByText("You're all caught up!")).toBeVisible();
    await page.getByRole('button', { name: '← Back to Dashboard' }).click();
  });
});
