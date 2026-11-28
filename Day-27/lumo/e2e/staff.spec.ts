import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { USERS, pageAs, removeCourseMedia, sql, sqlAs, stamp } from './helpers';

// The staff journey: an instructor builds an island by hand (forms, validation, an upload), sends it for review,
// the admin publishes it, and a learner finds it in Explore. A second test has Wisp draft a unit, which needs the
// generation worker (npm run worker), so it runs only with LUMO_E2E_WORKER=1.
const fixture = (name: string) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
const created: string[] = [];

test.afterAll(async () => {
  // Delete the islands even if removing their files fails.
  await removeCourseMedia(created).catch((e: unknown) => console.warn('media cleanup:', e));
  for (const id of created) {
    sqlAs(
      USERS.admin.id,
      `update courses set status = 'archived' where id = '${id}';
delete from generation_jobs where course_id = '${id}';
delete from courses where id = '${id}';`,
    );
  }
});

async function newIsland(
  page: import('@playwright/test').Page,
  title: string,
  slug: string,
  island: string,
) {
  await page.goto('/studio/new');
  await page.getByLabel('Course title').fill(title);
  await page.getByLabel('Link').fill(slug);
  await page.getByLabel('Island name').fill(island);
  await page.getByText('Nova', { exact: true }).click();
  await page.getByLabel('Summary').fill('Loops from zero, with Nova reading the stars.');
  await page.getByRole('button', { name: 'Create island' }).click();
  await page.waitForURL(/\/studio\/[0-9a-f-]{36}$/);
  const id = page.url().split('/').pop() ?? '';
  created.push(id);
  return page.url();
}

test('an instructor builds an island, the admin publishes it, a learner finds it', async ({
  browser,
}) => {
  const id = stamp();
  const title = `Loops Lab ${id}`;
  const island = `Mosaic Bay ${id}`;
  const riya = await pageAs(browser, USERS.riya.email);
  const p = riya.page;
  let courseUrl = '';

  await test.step('the new-island form validates before saving', async () => {
    await p.getByRole('link', { name: 'New island' }).click();
    await p.getByRole('button', { name: 'Create island' }).click();
    await expect(p.locator('[role=alert]').first()).toBeVisible();
    await p.getByLabel('Course title').fill('Money Basics');
    await p.getByLabel('Island name').fill('Copy Cove');
    await p.getByRole('button', { name: 'Create island' }).click();
    await expect(p.getByText('Another course already uses this link')).toBeVisible();
  });

  await test.step('the island, a unit and a video lesson are created', async () => {
    courseUrl = await newIsland(p, title, `loops-lab-${id}`, island);
    await p.getByRole('button', { name: 'Add unit' }).click();
    await expect(p.getByText('Give the unit a name')).toBeVisible();
    await p.getByLabel('New unit').fill('Warm-up');
    await p.getByRole('button', { name: 'Add unit' }).click();
    await expect(p.getByRole('heading', { name: 'Warm-up' })).toBeVisible();
    await p.getByRole('button', { name: /Add a lesson to/ }).click();
    await p.getByLabel('Lesson title').fill('Intro bite');
    await p.getByRole('button', { name: 'Add lesson' }).click();
    await p.waitForURL(/lessons\//);
  });

  await test.step('uploads reject the wrong file type and accept a video', async () => {
    const input = p.locator('input[type=file]').first();
    await input.setInputFiles(fixture('notes.txt'));
    await expect(p.locator('[role=alert]').filter({ hasText: 'supported' })).toBeVisible();
    await input.setInputFiles(fixture('bite.mp4'));
    await expect(p.getByText('Video uploaded.')).toBeVisible({ timeout: 30_000 });
    // It plays back through a short-lived signed link from the private bucket.
    const duration = await p.locator('video').evaluate(
      (v: HTMLVideoElement) =>
        new Promise<number>((resolve) => {
          if (v.readyState >= 1) resolve(v.duration);
          v.onloadedmetadata = () => resolve(v.duration);
          v.onerror = () => resolve(-1);
        }),
    );
    expect(duration).toBeGreaterThan(1);
  });

  await test.step('a quiz question is validated and saved with its answer key', async () => {
    await p.goto(courseUrl);
    await p.getByRole('button', { name: /Add a lesson to/ }).click();
    await p.getByLabel('Lesson title').fill('First check');
    await p.getByText('Quiz', { exact: true }).click();
    await p.getByRole('button', { name: 'Add lesson' }).click();
    await p.waitForURL(/lessons\//);
    await p.getByRole('button', { name: 'Add question' }).click();
    const d = p.getByRole('dialog', { name: 'New question' });
    await d.getByLabel('Question', { exact: true }).fill('How many times does this loop run?');
    await d.getByLabel('Option A', { exact: true }).fill('3');
    await d.getByLabel('Option B', { exact: true }).fill(' 3 ');
    await p.getByRole('button', { name: 'Save question' }).click();
    await expect(p.getByText('Same as option 1')).toBeVisible();
    await d.getByLabel('Option B', { exact: true }).fill('4');
    await d.getByLabel('Option A is correct').check();
    await d.getByLabel('Idea it checks').fill('loop count');
    await d.getByLabel('Explanation').fill('i goes 0, 1, 2, then i < 3 is false.');
    await p.getByRole('button', { name: 'Save question' }).click();
    await expect(p.getByText('Question added.')).toBeVisible();
  });

  await test.step('the instructor sends it for review', async () => {
    await p.goto(courseUrl);
    await p.getByRole('button', { name: 'Send for review' }).click();
    await expect(p.getByText('Sent for review')).toBeVisible();
  });

  await test.step('the admin finds it in the review queue and publishes it', async () => {
    const admin = await pageAs(browser, USERS.admin.email);
    await admin.page.goto('/admin');
    await admin.page.getByRole('tab', { name: 'Review queue' }).click();
    await expect(admin.page.getByRole('tabpanel')).toContainText(title);
    await admin.page.goto(courseUrl);
    await admin.page.getByRole('button', { name: 'Publish' }).click();
    await expect(admin.page.getByText('Published').first()).toBeVisible();
    expect(admin.errors).toEqual([]);
    await admin.close();
  });

  await test.step('a learner finds it with search, and filters narrow the results', async () => {
    const maya = await pageAs(browser, USERS.maya.email);
    await maya.page.goto('/explore');
    await maya.page.getByLabel('Search islands').fill(`mosaic bay ${id}`);
    await maya.page.waitForURL(/q=mosaic/);
    await expect(maya.page.getByRole('heading', { name: island })).toBeVisible();
    await maya.page.getByRole('button', { name: 'Money' }).click();
    await expect(maya.page.getByText('No islands found')).toBeVisible();
    await maya.page.getByRole('button', { name: 'Clear search and filters' }).click();
    await expect(maya.page.getByLabel('Search islands')).toHaveValue('');
    expect(maya.errors).toEqual([]);
    await maya.close();
  });

  expect(riya.errors).toEqual([]);
  await riya.close();
});

test('Wisp drafts a unit that stays hidden until every question is checked', async ({
  browser,
}) => {
  test.skip(
    !process.env.LUMO_E2E_WORKER,
    'Needs the generation worker: npm run worker, then LUMO_E2E_WORKER=1',
  );
  test.setTimeout(420_000);
  const id = stamp();
  const riya = await pageAs(browser, USERS.riya.email);
  const p = riya.page;
  const courseUrl = await newIsland(p, `Arrays Atoll ${id}`, `arrays-atoll-${id}`, 'Arrays Atoll');

  await test.step('a topic is required, then the draft runs with live progress', async () => {
    await p.getByRole('button', { name: 'Ask Wisp to draft a unit' }).click();
    await p.getByRole('button', { name: 'Draft the unit' }).click();
    await expect(p.getByText('Tell Wisp what the unit should teach')).toBeVisible();
    await p.getByLabel('Topic').fill('Arrays: lists of values');
    await p.getByRole('button', { name: 'Draft the unit' }).click();
    await expect(p.getByRole('progressbar', { name: 'Draft progress' })).toBeVisible();
    await expect(p.getByText('Wisp drafted a new unit')).toBeVisible({ timeout: 360_000 });
  });

  await test.step('publishing waits until a person has checked every question', async () => {
    await expect(p.getByText(/hidden from learners/)).toBeVisible();
    await expect(p.getByRole('button', { name: 'Publish unit' })).toBeDisabled();
    await p.getByRole('link', { name: 'Quick check' }).click();
    await p.waitForURL(/lessons\//);
    const edits = p.getByRole('button', { name: /^Edit question/ });
    await expect(edits.first()).toBeVisible();
    const n = await edits.count();
    for (let i = 1; i <= n; i++) {
      await p.getByRole('button', { name: `Edit question ${i}` }).click();
      await p.getByRole('button', { name: 'Save question' }).click();
      await expect(p.getByText('Question saved.').first()).toBeVisible();
    }
    await p.goto(courseUrl);
    await p.getByRole('button', { name: 'Publish unit' }).click();
    await expect(p.getByText(/Unit published/)).toBeVisible();
    await expect(p.getByText(/hidden from learners/)).toHaveCount(0);
  });

  expect(
    sql(
      `select count(*) from units u join courses c on c.id = u.course_id where c.slug = 'arrays-atoll-${id}' and u.published`,
    ),
  ).toBe('1');
  expect(riya.errors).toEqual([]);
  await riya.close();
});
