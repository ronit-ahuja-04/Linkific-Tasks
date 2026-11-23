import { test, expect, newUser, signUpUI, navLink } from './fixtures';

// Keyboard-only flows through the redesigned components, and the accessibility tree itself (ARIA snapshots:
// what a screen reader is given, compared with what we expect it to be given).

test.describe('keyboard only', () => {
  test('notes: the quick chips and the filters panel work from the keyboard', async ({ page }) => {
    await signUpUI(page, newUser('kbnotes'));
    await navLink(page, 'Notes').click();
    const mine = page.getByRole('button', { name: 'Mine' });
    await mine.focus();
    await page.keyboard.press('Space');
    await expect(mine).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('heading', { level: 2, name: 'My notes' })).toBeVisible();
    const more = page.getByRole('button', { name: /More filters/ });
    await more.focus();
    await page.keyboard.press('Enter');
    await expect(more).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Tab'); // the panel follows its button
    await expect(page.getByLabel('Name contains')).toBeFocused();
  });

  test('chat: write and send with the keyboard; focus stays in the message box', async ({ page }) => {
    await signUpUI(page, newUser('kbchat'));
    await navLink(page, 'Chat').click();
    await page.getByRole('button', { name: 'New room' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByLabel('Room name')).toBeFocused(); // the form takes focus as it opens
    await page.keyboard.type(`Keys ${Date.now().toString(36)}`);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const box = page.getByLabel('Message', { exact: true });
    await box.focus();
    await page.keyboard.type('sent with the keyboard');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('log', { name: 'Messages' })).toContainText('sent with the keyboard');
    await expect(box).toBeFocused();
    await expect(box).toHaveValue('');
  });

  test('a toast is announced: its text lands in a live region that was already on the page', async ({ page }) => {
    await signUpUI(page, newUser('kbtoast'));
    await navLink(page, 'Notes').click();
    await page.getByRole('button', { name: 'New note' }).click();
    await page.getByLabel('Title').fill('Announced');
    await page.getByRole('button', { name: 'Create note' }).click();
    await expect(page.getByRole('region', { name: 'Notifications' })).toContainText('Note created');
    await expect(page.locator('[aria-live="polite"][aria-atomic="true"]')).toContainText('Note created');
  });
});

test.describe('the accessibility tree (ARIA snapshots)', () => {
  test('sign in: one h1, labelled fields, the actions in reading order', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('main')).toMatchAriaSnapshot(`
      - main:
        - link "Huddle"
        - paragraph: /calm place/
        - heading "Sign in" [level=1]
        - textbox "Email"
        - textbox "Password"
        - button "Show password"
        - paragraph:
          - link "Forgot your password?"
        - button "Sign in"
        - button "Email me a magic link"
        - paragraph:
          - link "Create an account"
    `);
  });

  test('the sidebar: pages, then developer tools, then the account', async ({ page }) => {
    await signUpUI(page, newUser('ariaside'));
    await expect(page.getByRole('navigation', { name: 'Main' })).toMatchAriaSnapshot(`
      - list:
        - listitem:
          - link "Dashboard"
        - listitem:
          - link "Chat"
        - listitem:
          - link "Notes"
        - listitem:
          - link "Files"
      - list "Developer":
        - listitem:
          - link "Query lab"
        - listitem:
          - link "Design system"
      - list:
        - listitem:
          - link "Profile"
        - listitem:
          - button "Sign out"
    `);
  });

  test('a chat room: the room is the h1, messages are a log holding a list, then the message box', async ({ page }) => {
    await signUpUI(page, newUser('ariaroom'));
    await navLink(page, 'Chat').click();
    await page.getByRole('button', { name: 'New room' }).click();
    const name = `Tree ${Date.now().toString(36)}`;
    await page.getByLabel('Room name').fill(name);
    await page.getByRole('button', { name: 'Create room' }).click();
    await page.getByLabel('Message', { exact: true }).fill('first');
    await page.getByLabel('Message', { exact: true }).press('Enter');
    await expect(page.getByRole('log', { name: 'Messages' })).toContainText('first');
    // one "Attach a file" button only: the real file input behind it is hidden from screen readers
    await expect(page.getByRole('main')).toMatchAriaSnapshot(`
      - main:
        - link "All rooms"
        - heading "${name}" [level=1]
        - region "${name}":
          - log "Messages":
            - list:
              - listitem:
                - paragraph: first
          - combobox "Message"
          - button "Attach a file"
          - button "Send"
        - complementary "About this room"
    `);
    await expect(page.getByRole('button', { name: 'Attach a file' })).toHaveCount(1);
  });
});
