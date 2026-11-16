import AxeBuilder from '@axe-core/playwright';
import { test, expect, uniqueEmail, signUp, sidebarProject, card, addTask, createProject } from './fixtures.js';

// A real 1x1 PNG, so the browser can actually decode what it downloads
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const image = (name, buffer = PNG, mimeType = 'image/png') => ({ name, mimeType, buffer });

const nameOf = (email) => email.split('@')[0];
const toast = (page, text) => page.locator('.toast', { hasText: text });
const snack = (page, text) => page.locator('.snack', { hasText: text });

async function openProfile(page) {
  await page.getByRole('button', { name: 'My profile' }).click();
  await expect(page.getByRole('heading', { name: 'My Profile' })).toBeVisible();
}
const photoSrc = (page) => page.getByRole('img', { name: 'Your profile photo' }).getAttribute('src');
/**
 * Does Cloud Storage (the emulator) still serve this download URL? Resolves to 'served' or 'gone'. A deleted file
 * is a 404 on real Storage and a 403 on the emulator (the rules apply once the file no longer exists): both mean gone.
 */
const served = async (request, url) => ((await request.get(url)).status() === 200 ? 'served' : 'gone');

async function invite(page, email) {
  const input = page.getByPlaceholder('Email address');
  if (!(await input.isVisible())) await page.getByRole('button', { name: 'Invite', exact: true }).click();
  await input.fill(email);
  await page.getByRole('button', { name: 'Send Invite' }).click();
}
/** A owns "Team Alpha"; B has been invited and has accepted */
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
  await toast(b, 'invited you to').getByRole('button', { name: 'Accept' }).click();
  await expect(snack(b, 'You joined Team Alpha!')).toBeVisible();
  await sidebarProject(b, 'Team Alpha').click();
  await expect(b.getByRole('heading', { name: 'Team Alpha' })).toBeVisible();
  return { a: page, b, emailA, emailB };
}

test.describe('profile photo', () => {
  test('uploads a photo, shows it everywhere, keeps it after a reload, and removes it again', async ({ page, request }) => {
    await signUp(page, uniqueEmail('photo'));
    await openProfile(page);
    await expect(page.getByTestId('avatar-frame')).toContainText(/\w/); // the letter, before any photo
    await expect(page.getByRole('button', { name: 'Remove photo' })).toHaveCount(0);

    await page.getByLabel('Choose a profile photo').setInputFiles(image('me.png'));
    await expect(page.getByRole('img', { name: 'Your profile photo' })).toBeVisible();
    await expect(page.getByText('Profile photo updated').first()).toBeVisible();
    const url = await photoSrc(page);
    expect(url).toContain('/o/avatars%2F');
    expect(await served(request, url)).toBe('served');
    // the avatar in the header changed too
    await expect(page.getByRole('button', { name: 'My profile' })).toHaveCSS('background-image', new RegExp('avatars'));

    await page.reload();
    await expect(page.getByRole('img', { name: 'Your profile photo' })).toHaveAttribute('src', url);

    await page.getByRole('button', { name: 'Remove photo' }).click();
    await expect(page.getByRole('img', { name: 'Your profile photo' })).toHaveCount(0);
    await expect(page.getByText('Profile photo removed').first()).toBeVisible();
    await expect.poll(() => served(request, url)).toBe('gone');
    await page.reload();
    await expect(page.getByRole('img', { name: 'Your profile photo' })).toHaveCount(0);
  });

  test('replacing a photo deletes the old file', async ({ page, request }) => {
    await signUp(page, uniqueEmail('replace'));
    await openProfile(page);
    await page.getByLabel('Choose a profile photo').setInputFiles(image('one.png'));
    await expect(page.getByRole('img', { name: 'Your profile photo' })).toBeVisible();
    const first = await photoSrc(page);
    await page.getByLabel('Choose a profile photo').setInputFiles(image('two.png'));
    await expect(page.getByRole('img', { name: 'Your profile photo' })).not.toHaveAttribute('src', first);
    const second = await photoSrc(page);
    expect(await served(request, second)).toBe('served');
    await expect.poll(() => served(request, first)).toBe('gone');
  });

  test('refuses a non-image and a file over 2 MB without uploading anything', async ({ page }) => {
    await signUp(page, uniqueEmail('badfile'));
    await openProfile(page);
    await page.getByLabel('Choose a profile photo').setInputFiles(image('x.svg', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'), 'image/svg+xml'));
    await expect(page.getByRole('alert')).toHaveText('Choose a PNG, JPEG, GIF or WebP image.');
    await page.getByLabel('Choose a profile photo').setInputFiles(image('big.png', Buffer.alloc(2 * 1024 * 1024 + 1)));
    await expect(page.getByRole('alert')).toHaveText('That image is too big. The limit is 2.0 MB.');
    await expect(page.getByRole('img', { name: 'Your profile photo' })).toHaveCount(0);
  });

  test('a teammate sees the new photo at once, without reloading', async ({ page, newUserPage }) => {
    const { a, b, emailA } = await team(page, newUserPage);
    const headerAvatar = b.locator(`.project-users img.avatar[title*="${emailA}"]`);
    await expect(headerAvatar).toHaveAttribute('src', /ui-avatars/);
    await openProfile(a);
    await a.getByLabel('Choose a profile photo').setInputFiles(image('alice.png'));
    await expect(a.getByRole('img', { name: 'Your profile photo' })).toBeVisible();
    await expect(headerAvatar).toHaveAttribute('src', /o\/avatars%2F/);
  });
});

test.describe('task images', () => {
  async function openTask(page, title) {
    await card(page, title).click();
    await expect(page.getByRole('dialog', { name: 'Task details' })).toBeVisible();
    return page.getByRole('dialog', { name: 'Task details' });
  }

  test('the owner adds an image to a task, it survives a reload, and removing it deletes the file', async ({ page, request }) => {
    await signUp(page, uniqueEmail('attach'));
    await addTask(page, 'Design the logo');
    const dialog = await openTask(page, 'Design the logo');
    await expect(dialog.getByText('No images yet.')).toBeVisible();

    await dialog.getByLabel('Choose an image to attach').setInputFiles(image('sketch.png'));
    const thumb = dialog.getByRole('img', { name: 'Attached image: sketch.png' });
    await expect(thumb).toBeVisible();
    // it really is a picture: the browser decoded it
    await expect.poll(() => thumb.evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
    const url = await thumb.getAttribute('src');
    expect(url).toContain('/o/projects%2F');
    expect(await served(request, url)).toBe('served');
    await expect(dialog.getByRole('link', { name: 'Open sketch.png in a new tab' })).toHaveAttribute('target', '_blank');

    await page.reload();
    const again = await openTask(page, 'Design the logo');
    await expect(again.getByRole('img', { name: 'Attached image: sketch.png' })).toBeVisible();

    await again.getByRole('button', { name: 'Remove sketch.png' }).click();
    await expect(again.getByRole('img', { name: 'Attached image: sketch.png' })).toHaveCount(0);
    await expect.poll(() => served(request, url)).toBe('gone');
  });

  test('deleting the task deletes its images', async ({ page, request }) => {
    await signUp(page, uniqueEmail('taskdel'));
    await addTask(page, 'Temporary');
    const dialog = await openTask(page, 'Temporary');
    await dialog.getByLabel('Choose an image to attach').setInputFiles([image('a.png'), image('b.png')]);
    await expect(dialog.getByTestId('attachment')).toHaveCount(2);
    const urls = await dialog.getByTestId('attachment').locator('img').evaluateAll((imgs) => imgs.map((i) => i.src));
    await dialog.getByRole('button', { name: 'Delete Task' }).click();
    await expect(card(page, 'Temporary')).toHaveCount(0);
    for (const url of urls) await expect.poll(() => served(request, url)).toBe('gone');
  });

  test('refuses a non-image', async ({ page }) => {
    await signUp(page, uniqueEmail('badattach'));
    await addTask(page, 'Notes');
    const dialog = await openTask(page, 'Notes');
    await dialog.getByLabel('Choose an image to attach').setInputFiles({ name: 'notes.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') });
    await expect(dialog.getByRole('alert')).toHaveText('Choose a PNG, JPEG, GIF or WebP image.');
    await expect(dialog.getByTestId('attachment')).toHaveCount(0);
  });

  test('a teammate sees an image appear live and cannot add or remove one', async ({ page, newUserPage }) => {
    const { a, b } = await team(page, newUserPage);
    await addTask(a, 'Shared task');
    await expect(card(b, 'Shared task')).toBeVisible();
    const memberDialog = await openTask(b, 'Shared task');
    await expect(memberDialog.getByText('No images yet.')).toBeVisible();
    await expect(memberDialog.getByRole('button', { name: 'Add image' })).toHaveCount(0);

    const ownerDialog = await openTask(a, 'Shared task');
    await ownerDialog.getByLabel('Choose an image to attach').setInputFiles(image('plan.png'));
    await expect(ownerDialog.getByRole('img', { name: 'Attached image: plan.png' })).toBeVisible();

    // B never reloaded
    const seen = memberDialog.getByRole('img', { name: 'Attached image: plan.png' });
    await expect(seen).toBeVisible();
    await expect.poll(() => seen.evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
    await expect(memberDialog.getByRole('button', { name: 'Remove plan.png' })).toHaveCount(0);
  });

  test('a task that is still a draft explains that it must be created first', async ({ page }) => {
    await signUp(page, uniqueEmail('draft'));
    await page.getByRole('button', { name: 'Add Task' }).click();
    await expect(page.getByText('Create the task first, then you can add images.')).toBeVisible();
  });
});

for (const theme of ['light', 'dark']) {
  test(`photo upload and task images are accessible, ${theme} theme`, async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
    await signUp(page, uniqueEmail('axe'));
    const scan = async (label) => {
      await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {}))));
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const summary = result.violations.map((v) => `${v.id} (${v.impact}) x${v.nodes.length}: ${v.help} -> ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`);
      expect(summary, `accessibility problems on "${label}"`).toEqual([]);
    };
    await openProfile(page);
    await scan('profile, no photo');
    await page.getByLabel('Choose a profile photo').setInputFiles(image('me.png'));
    await expect(page.getByRole('img', { name: 'Your profile photo' })).toBeVisible();
    await scan('profile with a photo');
    await page.getByLabel('Choose a profile photo').setInputFiles(image('x.svg', Buffer.from('<svg/>'), 'image/svg+xml'));
    await expect(page.getByRole('alert')).toBeVisible();
    await scan('profile with an upload error');

    await page.getByRole('button', { name: 'Back' }).click();
    await addTask(page, 'Accessible task');
    const dialog = await (async () => { await card(page, 'Accessible task').click(); return page.getByRole('dialog', { name: 'Task details' }); })();
    await scan('task panel, no images');
    await dialog.getByLabel('Choose an image to attach').setInputFiles(image('a.png'));
    await expect(dialog.getByTestId('attachment')).toHaveCount(1);
    await scan('task panel with an image');
  });
}
