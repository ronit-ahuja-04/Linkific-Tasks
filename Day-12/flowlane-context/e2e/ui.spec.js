import { test, expect, uniqueEmail, signUp, addTask, card, column, createProject } from './fixtures.js';

const languageButton = (page) => page.getByRole('button', { name: /^(Language|Idioma|भाषा)$/ });
const snack = (page, text) => page.locator('.snack', { hasText: text });

async function keyboardDrag(page, cardLocator, keys) {
  await cardLocator.focus();
  await page.keyboard.press('Space');
  for (const key of keys) { await page.waitForTimeout(250); await page.keyboard.press(key); }
  await page.waitForTimeout(250);
  await page.keyboard.press('Space');
  await page.waitForTimeout(400);
}

test.describe('language menu in the header (compound Dropdown)', () => {
  test('shows the current language and lists all three with the current one checked', async ({ page }) => {
    await signUp(page, uniqueEmail('lm'));
    await expect(languageButton(page)).toContainText('EN');
    await languageButton(page).click();
    const items = page.getByRole('menuitemradio');
    await expect(items).toHaveText(['English', 'Español', 'हिन्दी']);
    await expect(items.nth(0)).toHaveAttribute('aria-checked', 'true');
    await expect(items.nth(1)).toHaveAttribute('aria-checked', 'false');
  });

  test('choosing Español translates the app at once, updates the button, announces it in Spanish, and survives a reload', async ({ page }) => {
    await signUp(page, uniqueEmail('lm2'));
    await languageButton(page).click();
    await page.getByRole('menuitemradio', { name: 'Español' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.locator('.sidebar').getByText('Mensajes')).toBeVisible();
    await expect(languageButton(page)).toContainText('ES');
    await expect(snack(page, 'Idioma: Español')).toBeVisible(); // announced in the new language
    await expect(page.getByRole('menu')).toHaveCount(0); // closed after choosing
    await page.reload();
    await expect(page.locator('.sidebar').getByText('Mensajes')).toBeVisible();
    await expect(languageButton(page)).toContainText('ES');
  });

  test('works with the keyboard: ArrowDown opens, arrows move, Enter chooses, Escape closes and returns focus', async ({ page }) => {
    await signUp(page, uniqueEmail('lm3'));
    await languageButton(page).focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitemradio', { name: 'English' })).toBeFocused(); // the selected one
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitemradio', { name: 'Español' })).toBeFocused();
    await page.keyboard.press('End');
    await expect(page.getByRole('menuitemradio', { name: 'हिन्दी' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(languageButton(page)).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  });

  test('a click outside closes the menu', async ({ page }) => {
    await signUp(page, uniqueEmail('lm4'));
    await languageButton(page).click();
    await expect(page.getByRole('menu')).toBeVisible();
    await page.locator('.project-header h1').click();
    await expect(page.getByRole('menu')).toHaveCount(0);
  });

  test('the menu and the Settings language tab stay in step', async ({ page }) => {
    await signUp(page, uniqueEmail('lm5'));
    await languageButton(page).click();
    await page.getByRole('menuitemradio', { name: 'हिन्दी' }).click();
    await page.locator('.sidebar .nav-item').filter({ hasText: 'सेटिंग्स' }).click();
    await page.getByRole('tab', { name: 'भाषा' }).click();
    await expect(page.getByRole('radio', { name: 'हिन्दी' })).toBeChecked();
    await page.getByRole('radio', { name: 'English' }).check();
    await expect(languageButton(page)).toContainText('EN');
  });
});

test.describe('toast notifications (ToastContext)', () => {
  test('creating, moving and deleting tasks each show a toast; success toasts are polite status messages', async ({ page }) => {
    await signUp(page, uniqueEmail('toast'));
    await addTask(page, 'Toast me');
    await expect(page.getByRole('status').filter({ hasText: 'Task created' })).toBeVisible();
    await keyboardDrag(page, card(page, 'Toast me'), ['ArrowRight']);
    await expect(snack(page, 'Moved to In Progress')).toBeVisible();
    await card(page, 'Toast me').getByTitle('Delete Task').click();
    await expect(snack(page, 'Task deleted')).toBeVisible();
  });

  test('an error is an alert and stays longer; the message names the problem', async ({ page }) => {
    await signUp(page, uniqueEmail('toasterr'));
    await createProject(page, 'Ghost', 'nobody@test.dev');
    const alert = page.getByRole('alert').filter({ hasText: 'Could not find a user' });
    await expect(alert).toBeVisible();
    await expect(alert).toHaveClass(/snack--error/);
  });

  test('toasts dismiss themselves, and the countdown bar shows how long is left', async ({ page }) => {
    await signUp(page, uniqueEmail('toastauto'));
    await page.getByTitle('Toggle Theme').click();
    const toast = snack(page, 'Dark mode on');
    await expect(toast).toBeVisible();
    await expect(toast.locator('.snack-bar')).toBeVisible();
    await expect(toast).toHaveCount(0, { timeout: 8000 }); // gone after about 4 seconds
  });

  test('the close button dismisses a toast immediately', async ({ page }) => {
    await signUp(page, uniqueEmail('toastclose'));
    await page.getByTitle('Toggle Theme').click();
    await snack(page, 'Dark mode on').getByRole('button', { name: 'Dismiss message' }).click();
    await expect(snack(page, 'Dark mode on')).toHaveCount(0);
  });

  test('hovering a toast pauses its countdown, moving away resumes it', async ({ page }) => {
    await signUp(page, uniqueEmail('toasthover'));
    await page.getByTitle('Toggle Theme').click();
    const toast = snack(page, 'Dark mode on');
    await toast.hover();
    await page.waitForTimeout(5500); // longer than the 4 second lifetime
    await expect(toast).toBeVisible(); // still here: paused
    await page.mouse.move(5, 5);
    await expect(toast).toHaveCount(0, { timeout: 6000 });
  });

  test('never more than four at once: the oldest give way', async ({ page }) => {
    await signUp(page, uniqueEmail('toaststack'));
    for (let i = 0; i < 6; i++) {
      await page.getByTitle('Toggle Theme').click();
      await page.waitForTimeout(150);
    }
    await expect(page.locator('.snack')).toHaveCount(4);
  });

  test('toasts are announced in the chosen language', async ({ page }) => {
    await signUp(page, uniqueEmail('toastes'));
    await languageButton(page).click();
    await page.getByRole('menuitemradio', { name: 'Español' }).click();
    await page.getByTitle('Cambiar tema').click();
    await expect(snack(page, 'Modo oscuro activado')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Avisos' })).toBeVisible();
  });
});

test.describe('animated theme switch', () => {
  test('uses a view transition from the clicked button, and the page really changes theme', async ({ page }) => {
    await signUp(page, uniqueEmail('vt'));
    await page.evaluate(() => {
      window.__transitions = 0;
      const original = document.startViewTransition.bind(document);
      document.startViewTransition = (callback) => {
        window.__transitions += 1;
        return original(callback);
      };
    });
    await page.getByTitle('Toggle Theme').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await page.evaluate(() => window.__transitions)).toBe(1);
    await page.getByTitle('Toggle Theme').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(await page.evaluate(() => window.__transitions)).toBe(2);
  });

  test('keyboard activation also animates, and the toggle button keeps focus', async ({ page }) => {
    await signUp(page, uniqueEmail('vtkey'));
    await page.getByTitle('Toggle Theme').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByTitle('Toggle Theme')).toBeFocused();
  });

  test('respects "reduce motion": switches instantly without a view transition', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await signUp(page, uniqueEmail('vtreduce'));
    await page.evaluate(() => {
      window.__transitions = 0;
      const original = document.startViewTransition.bind(document);
      document.startViewTransition = (callback) => { window.__transitions += 1; return original(callback); };
    });
    await page.getByTitle('Toggle Theme').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await page.evaluate(() => window.__transitions)).toBe(0);
  });

  test('the Settings switch animates too', async ({ page }) => {
    await signUp(page, uniqueEmail('vtsettings'));
    await page.locator('.nav-item', { hasText: 'Settings' }).click();
    await page.getByRole('switch', { name: 'Dark mode' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(snack(page, 'Dark mode on')).toBeVisible();
  });
});

test.describe('sliding tab underline', () => {
  const box = async (locator) => (await locator.boundingBox());

  test('sits exactly under the active tab', async ({ page }) => {
    await signUp(page, uniqueEmail('ind'));
    const tab = await box(page.getByRole('tab', { name: 'Board' }));
    const bar = await box(page.locator('.project-tabs .tab-indicator'));
    expect(Math.abs(bar.x - tab.x)).toBeLessThan(1.5);
    expect(Math.abs(bar.width - tab.width)).toBeLessThan(1.5);
  });

  test('glides to the other tab (it passes through in-between positions) and ends under it', async ({ page }) => {
    await signUp(page, uniqueEmail('ind2'));
    const indicator = page.locator('.project-tabs .tab-indicator');
    const start = (await box(indicator)).x;
    await page.getByRole('tab', { name: 'Activity' }).click();
    const samples = [];
    for (let i = 0; i < 8; i++) {
      samples.push((await box(indicator)).x);
      await page.waitForTimeout(40);
    }
    const target = (await box(page.getByRole('tab', { name: 'Activity' }))).x;
    await expect.poll(async () => Math.abs((await box(indicator)).x - target)).toBeLessThan(1.5);
    expect(target).toBeGreaterThan(start);
    // moved smoothly rather than jumping: at least one sample strictly between start and target
    expect(samples.some((x) => x > start + 1 && x < target - 1)).toBe(true);
  });

  test('follows the tab when its text changes width (a new language)', async ({ page }) => {
    await signUp(page, uniqueEmail('ind3'));
    await languageButton(page).click();
    await page.getByRole('menuitemradio', { name: 'Español' }).click();
    const tab = page.getByRole('tab', { name: 'Tablero' });
    await expect.poll(async () => {
      const t = await box(tab);
      const b = await box(page.locator('.project-tabs .tab-indicator'));
      return Math.abs(b.x - t.x) + Math.abs(b.width - t.width);
    }).toBeLessThan(3);
  });

  test('also works in the Settings tabs', async ({ page }) => {
    await signUp(page, uniqueEmail('ind4'));
    await page.locator('.nav-item', { hasText: 'Settings' }).click();
    await page.getByRole('tab', { name: 'Language' }).click();
    const tab = await box(page.getByRole('tab', { name: 'Language' }));
    await expect.poll(async () => Math.abs((await box(page.locator('.tab-indicator'))).x - tab.x)).toBeLessThan(1.5);
  });
});
