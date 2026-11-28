import { expect, test } from '@playwright/test';
import { CODE_REEF, PASSWORD, USERS, answer, pageAs, sql, stamp, watchErrors } from './helpers';

// The learner journey, from a visitor's taste to a certificate a stranger can verify, and the report the learner
// files on the way reaching the admin.
const id = stamp();
const learner = { name: 'Tess Tester', handle: `tess_${id}`, email: `e2e-${id}@lumo.local` };
const note = `E2E ${id}: the wording could be clearer`;
const learnerId = () => sql(`select id from profiles where handle = '${learner.handle}'`);

test.afterAll(() => {
  sql(`delete from audit_log where target in (select id::text from wisp_flags where learner_text = '${note}');
delete from wisp_flags where learner_text = '${note}';
delete from auth.users where email = '${learner.email}';`);
});

test('a visitor tastes, signs up, learns, forgets, reviews and earns a certificate', async ({
  page,
  browser,
}) => {
  const errors = watchErrors(page);

  await test.step('a visitor tastes Code Reef without an account', async () => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Try a 3-minute taste first' }).click();
    await page.getByRole('link', { name: /Code Reef/ }).click();
    await expect(page.getByText('No account needed')).toBeVisible();
    await expect(page.locator('video')).toHaveCount(1);
    await page.getByRole('button', { name: /Try the questions/ }).click();
    for (let i = 0; i < 5; i++) {
      if (!(await page.getByRole('button', { name: 'Check', exact: true }).isVisible())) break;
      await answer(page, 0);
      await page.getByRole('button', { name: 'Continue' }).click();
    }
    await expect(page.getByRole('heading', { name: /That’s a taste of Code Reef/ })).toBeVisible();
  });

  await test.step('signing up starts the setup chat with Wisp', async () => {
    await page.goto('/register');
    await page.getByLabel('What should Wisp call you?').fill(learner.name);
    await page.getByLabel('Handle').fill(learner.handle);
    await page.getByLabel('Email').fill(learner.email);
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Create my account' }).click();
    await page.waitForURL(/\/setup/);
    await page.getByRole('button', { name: /Code Reef/ }).click();
    await page.getByRole('button', { name: /Regular/ }).click();
    await page.getByRole('button', { name: /Cheeky/ }).click();
    await page.getByRole('button', { name: 'I’m brand new' }).click();
    await page.waitForURL(/\/map\?island=javascript-foundations/);
    expect(
      sql(
        `select wisp_persona, onboarded_at is not null from profiles where handle = '${learner.handle}'`,
      ),
    ).toBe('cheeky|t');
  });

  await test.step('locked stones stay locked; the first lesson is a captioned video', async () => {
    await page
      .getByRole('button', { name: /locked/ })
      .first()
      .click({ force: true });
    await expect(page.getByText(/Locked\. Finish/)).toBeVisible();
    await page.getByRole('button', { name: /start here/ }).click();
    await expect(page.getByRole('heading', { name: 'For-loops in 90 seconds' })).toBeVisible();
    await expect(page.locator('video track[kind="captions"]')).toHaveCount(1);
    await page.getByRole('button', { name: /Finish the lesson|Continue to the questions/ }).click();
    await expect(page.getByRole('heading', { name: /Lantern lit!/ })).toBeVisible();
  });

  await test.step('a wrong answer explains that mistake, and the learner reports the question', async () => {
    await page.getByRole('button', { name: 'Next lesson' }).click();
    await expect(page.getByRole('heading', { name: 'What will this print?' })).toBeVisible();
    await answer(page, /^1 2 3$/);
    await expect(page.getByText('The loop starts where you tell it')).toBeVisible();
    await page.getByRole('button', { name: 'Report a problem' }).click();
    await page.getByLabel('It’s confusing').check();
    await page.getByLabel('Anything else? (optional)').fill(note);
    await page.getByRole('button', { name: 'Send report' }).click();
    await expect(page.getByText(/A person will look at it/)).toBeVisible();
  });

  await test.step('missed questions come back, and a correct finish lights the lantern', async () => {
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.keyboard.press('2');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.getByText('Second chance')).toBeVisible();
    await answer(page, /^0 1 2$/);
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { name: /Lantern lit!/ })).toBeVisible();
    // Light and the flame are awarded by the server, not the browser.
    const [light, flame] = sql(
      `select light, flame_days from profiles where handle = '${learner.handle}'`,
    ).split('|');
    expect(Number(light)).toBeGreaterThan(0);
    expect(Number(flame)).toBe(1);
  });

  await test.step('the next day the fog is back, and a review clears it', async () => {
    sql(`update memory_items set due_at = now() - interval '1 minute', last_review_at = now() - interval '1 day'
         where user_id = '${learnerId()}'`);
    await page.goto(`/map?island=${CODE_REEF.slug}`);
    await expect(page.getByText('The fog is back')).toBeVisible();
    await page.getByRole('link', { name: 'Clear the fog' }).click();
    await page.waitForURL(/\/review/);
    for (let i = 0; i < 10; i++) {
      const check = page.getByRole('button', { name: 'Check', exact: true });
      await expect(
        check.or(page.getByRole('heading', { name: /Fog cleared|Fog pushed back/ })),
      ).toBeVisible();
      if (!(await check.isVisible())) break;
      const forLoop = (await page.getByRole('radio', { name: /^0 1 2$/ }).count()) > 0;
      await answer(page, forLoop ? /^0 1 2$/ : /^nothing$/);
      await page.getByRole('button', { name: 'Continue' }).click();
    }
    await expect(page.getByRole('heading', { name: /Fog cleared|Fog pushed back/ })).toBeVisible();
    await page.getByRole('link', { name: 'Back to the map' }).click();
    await expect(page.getByRole('button', { name: /start here|finished/ }).first()).toBeVisible();
    await expect(page.getByText('The fog is back')).toHaveCount(0);
  });

  await test.step('after days away, a kind welcome back keeps the best flame', async () => {
    sql(`update profiles set last_goal_date = (now() at time zone timezone)::date - 5, flame_days = 7, best_flame = 7
         where handle = '${learner.handle}'`);
    await page.goto(`/map?island=${CODE_REEF.slug}`);
    const dialog = page.getByRole('dialog', { name: /Welcome back/ });
    await expect(dialog).toContainText('best (7 days) is saved');
    await expect(page.getByLabel(/^Flame:/)).toHaveAttribute('aria-label', /^Flame: 0 days/);
    await dialog.getByRole('button', { name: 'Just look around' }).click();
  });

  let code = '';
  await test.step('finishing the island earns a certificate anyone can verify', async () => {
    sql(`insert into lesson_progress (user_id, lesson_id)
         select '${learnerId()}', l.id from lessons l join units u on u.id = l.unit_id
         where u.course_id = '${CODE_REEF.id}' and u.published and l.deleted_at is null
         on conflict do nothing`);
    await page.reload();
    await page.getByRole('button', { name: 'Claim certificate' }).click();
    await page.waitForURL(/\/verify\//);
    code = page.url().split('/').pop() ?? '';
    await expect(page.getByText('Verified Lumo certificate')).toBeVisible();
    await page.goto('/me');
    await expect(page.getByRole('link', { name: /Code Reef/ })).toBeVisible();

    const stranger = await browser.newContext();
    const other = await stranger.newPage();
    await other.goto(`/verify/${code.toLowerCase()}`);
    await expect(other.getByRole('heading', { level: 1 })).toHaveText(learner.name);
    await other.goto('/verify/NOTAREAL01');
    await expect(
      other.getByRole('heading', { name: 'No certificate with this code' }),
    ).toBeVisible();
    await stranger.close();
  });

  await test.step('the admin sees the report with what the learner saw, and closes it', async () => {
    const admin = await pageAs(browser, USERS.admin.email);
    await admin.page.goto('/admin');
    const card = admin.page.locator('li').filter({ hasText: note });
    await expect(card.getByText('What will this print?')).toBeVisible();
    await card.getByLabel('Note (optional)').fill('Reworded the question');
    await card.getByRole('button', { name: 'Fixed it' }).click();
    await expect(admin.page.getByText('Marked as fixed.')).toBeVisible();
    await admin.page.getByRole('tab', { name: 'Activity' }).click();
    await expect(admin.page.getByText('reviewed a report').first()).toBeVisible();
    expect(admin.errors).toEqual([]);
    await admin.close();
  });

  expect(errors).toEqual([]);
});
