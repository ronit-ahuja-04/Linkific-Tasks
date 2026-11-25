import { test, expect, newUser, signUpUI, navLink } from './fixtures';

/**
 * Day 24, image optimisation, in a real browser (the resizing needs a real canvas): a photo-sized upload is stored and
 * served as small WebP copies, with srcset, fixed dimensions and lazy loading.
 */
async function photo(page, width, height) {
  const base64 = await page.evaluate(({ width, height }) => {
    const canvas = Object.assign(document.createElement('canvas'), { width, height });
    const g = canvas.getContext('2d');
    for (let i = 0; i < 400; i += 1) {
      g.fillStyle = `hsl(${(i * 37) % 360} 70% ${30 + (i % 40)}%)`;
      g.fillRect((i * 7919) % width, (i * 104729) % height, 40 + (i % 120), 40 + (i % 90));
    }
    return canvas.toDataURL('image/jpeg', 0.95).split(',')[1];
  }, { width, height });
  return Buffer.from(base64, 'base64');
}
const bytes = async (url) => (await (await fetch(url)).arrayBuffer()).byteLength;

test('an avatar photo is stored as 64 and 256 px WebP and served with srcset, fixed size and high priority on the profile', async ({ page }) => {
  await page.goto('/login');
  const original = await photo(page, 1600, 1600);
  await signUpUI(page, newUser('webpavatar'));
  await navLink(page, 'Profile').click();
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'me.jpg', mimeType: 'image/jpeg', buffer: original });

  const img = page.locator('.profile-card .avatar img');
  await expect(img).toHaveAttribute('src', /avatar-\d+-64\.webp$/, { timeout: 15000 });
  await expect(img).toHaveAttribute('srcset', /-64\.webp 64w, .+-256\.webp 256w$/);
  await expect(img).toHaveAttribute('sizes', '96px');
  await expect(img).toHaveAttribute('width', '96');
  await expect(img).toHaveAttribute('fetchpriority', 'high');
  // the browser picked a sharp-enough file for 96 px, and it is a fraction of the original
  const shown = await img.evaluate((el) => el.currentSrc);
  expect(shown).toMatch(/-(64|256)\.webp$/);
  const large = (await img.getAttribute('srcset')).split(', ')[1].split(' ')[0];
  expect(await bytes(large)).toBeLessThan(original.length / 10);
  // the small avatar in the sidebar is lazy and sized
  const small = page.locator('.shell-sidebar .avatar img');
  await expect(small).toHaveAttribute('loading', 'lazy');
  await expect(small).toHaveAttribute('width', '32');
});

test('an image file gets a 160 px WebP thumbnail, and the list shows that (lazy, fixed size), not the original', async ({ page }) => {
  await page.goto('/login');
  const original = await photo(page, 2000, 1500);
  await signUpUI(page, newUser('thumbs'));
  await navLink(page, 'Files').click();
  await page.getByLabel('Choose files to upload').setInputFiles({ name: 'holiday.jpg', mimeType: 'image/jpeg', buffer: original });
  const preview = page.getByRole('img', { name: 'Preview of holiday.jpg' });
  await expect(preview).toHaveAttribute('src', /holiday\.jpg\.thumb\.webp/, { timeout: 15000 });
  await expect(preview).toHaveAttribute('loading', 'lazy');
  await expect(preview).toHaveAttribute('width', '56');
  const size = await bytes(await preview.getAttribute('src'));
  expect(size).toBeLessThan(20_000);
  expect(size).toBeLessThan(original.length / 20);
});
