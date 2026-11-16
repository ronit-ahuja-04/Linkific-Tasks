import { test, expect, uniqueEmail, signUp, signOut, signIn, sidebarProject, addTask, card } from './fixtures.js';

async function openSettings(page) {
  await page.locator('.sidebar .nav-item', { hasText: /^\s*(Settings|Ajustes|सेटिंग्स)\s*$/ }).click();
}
async function pickLanguage(page, label) {
  await page.getByRole('tab', { name: /Language|Idioma|भाषा/ }).click();
  await page.getByRole('radio', { name: label }).check();
}

test.describe('language context (i18n)', () => {
  test('switches the whole interface to Spanish, keeps it after a reload, and sets <html lang>', async ({ page }) => {
    await signUp(page, uniqueEmail('es'));
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await openSettings(page);
    await pickLanguage(page, 'Español');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.getByRole('heading', { name: 'Ajustes' })).toBeVisible();
    await expect(page.locator('.sidebar').getByText('Mensajes')).toBeVisible();
    await expect(page.locator('.sidebar').getByText('Tus proyectos')).toBeVisible();
    await page.reload();
    await expect(page.locator('.sidebar').getByText('Mensajes')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  });

  test('the board, tabs, task panel and chat are translated; user content is left alone', async ({ page }) => {
    await signUp(page, uniqueEmail('es2'));
    await addTask(page, 'Tarea real escrita por mí', { description: 'Texto del usuario' });
    await openSettings(page);
    await pickLanguage(page, 'Español');
    await page.getByRole('button', { name: /Volver al panel/ }).click();
    await expect(page.getByRole('tab', { name: 'Tablero' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Actividad' })).toBeVisible();
    await expect(page.locator('.column-title')).toHaveText(['Por hacer', 'En curso', 'Hecho']);
    await expect(page.getByRole('button', { name: 'Añadir tarea' })).toBeVisible();
    await expect(card(page, 'Tarea real escrita por mí')).toBeVisible(); // what the user typed is never translated
    await page.getByRole('tab', { name: 'Actividad' }).click();
    await expect(page.getByPlaceholder('Escribe un mensaje...')).toBeVisible();
  });

  test('Hindi works too, and switching back to English restores everything', async ({ page }) => {
    await signUp(page, uniqueEmail('hi'));
    await openSettings(page);
    await pickLanguage(page, 'हिन्दी');
    await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
    await expect(page.getByRole('heading', { name: 'सेटिंग्स' })).toBeVisible();
    await pickLanguage(page, 'English');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('the sign-in page follows the saved language after signing out', async ({ page }) => {
    await signUp(page, uniqueEmail('es3'));
    await openSettings(page);
    await pickLanguage(page, 'Español');
    await page.getByRole('button', { name: 'Mi perfil' }).click();
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByRole('heading', { name: 'Bienvenido de nuevo' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeVisible();
  });
});

test.describe('theme context', () => {
  test('the saved theme also applies on the sign-in page, because the provider sits above the router', async ({ page }) => {
    await signUp(page, uniqueEmail('dark'));
    await page.getByTitle('Toggle Theme').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await signOut(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('the theme is saved on the profile, so a fresh browser gets it after signing in', async ({ page, browser }) => {
    const email = uniqueEmail('profile');
    await signUp(page, email);
    await page.getByTitle('Toggle Theme').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.waitForTimeout(800); // let the profile write finish
    const fresh = await browser.newContext(); // no localStorage: only the profile can supply the theme
    const other = await fresh.newPage();
    await other.route((url) => !['127.0.0.1', 'localhost'].includes(url.hostname), (route) => route.fulfill({ status: 200, body: '' }));
    await signIn(other, email);
    await expect(other.locator('html')).toHaveAttribute('data-theme', 'dark');
    await fresh.close();
  });
});

test.describe('compound Tabs component', () => {
  test('project tabs: arrow keys, Home and End switch views, and only the open tab is in the Tab order', async ({ page }) => {
    await signUp(page, uniqueEmail('tabs'));
    const board = page.getByRole('tab', { name: 'Board' });
    const activity = page.getByRole('tab', { name: 'Activity' });
    await expect(board).toHaveAttribute('aria-selected', 'true');
    await expect(board).toHaveAttribute('tabindex', '0');
    await expect(activity).toHaveAttribute('tabindex', '-1');
    await board.focus();
    await page.keyboard.press('ArrowRight');
    await expect(activity).toBeFocused();
    await expect(activity).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByPlaceholder('Type a message...')).toBeVisible();
    await page.keyboard.press('Home');
    await expect(board).toBeFocused();
    await expect(page.locator('.board-columns')).toBeVisible();
    await page.keyboard.press('End');
    await expect(activity).toBeFocused();
  });

  test('the tab panel is linked to its tab for screen readers', async ({ page }) => {
    await signUp(page, uniqueEmail('aria'));
    const panel = page.getByRole('tabpanel');
    await expect(panel).toHaveCount(1);
    const labelledBy = await panel.getAttribute('aria-labelledby');
    await expect(page.locator(`[id="${labelledBy}"]`)).toHaveText(/Board/);
  });

  test('the Settings tabs use the same component, uncontrolled, with arrow keys', async ({ page }) => {
    await signUp(page, uniqueEmail('settingstabs'));
    await openSettings(page);
    const appearance = page.getByRole('tab', { name: 'Appearance' });
    await expect(appearance).toHaveAttribute('aria-selected', 'true');
    await appearance.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Language' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('radio', { name: 'English' })).toBeChecked();
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('switch', { name: 'Dark mode' })).toBeVisible();
  });
});

test.describe('context and Redux working together', () => {
  test('after signing out and in as someone else, Redux thunks act as the NEW user (the Context -> Redux bridge)', async ({ page }) => {
    const first = uniqueEmail('one');
    const second = uniqueEmail('two');
    await signUp(page, first);
    await signOut(page);
    await signUp(page, second);
    // creating a project runs a Redux thunk that asks the AuthContext who is signed in
    await page.locator('.sidebar .nav-item', { hasText: 'New Project' }).click();
    await page.getByPlaceholder('e.g. Website Redesign').fill('Second users project');
    await page.getByRole('button', { name: 'Create Project' }).click();
    await expect(sidebarProject(page, 'Second users project')).toHaveCount(1);
    await page.reload();
    await expect(sidebarProject(page, 'Second users project')).toHaveCount(1);
    await signOut(page);
    await signIn(page, first);
    await expect(sidebarProject(page, 'Second users project')).toHaveCount(0); // never leaks to the first user
  });
});
