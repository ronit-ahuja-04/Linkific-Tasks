import { expect, test } from '@playwright/test';
import { logQuest, newAdventurer, registerNew, signInAs, visible } from './helpers';

test.describe('onboarding', () => {
  test('a new player is asked to create a character, then lands on day 1 with their Pip', async ({ page }) => {
    await registerNew(page, 'Onboarding Olly');
    await page.goto('/journal');
    await expect(visible(page.getByRole('heading', { name: 'First, create your character' }))).toBeVisible();
    await visible(page.getByRole('link', { name: 'Create my character' })).click();
    await page.waitForURL('/character');
    await visible(page.getByRole('radio', { name: /Design Bard/ })).click();
    await visible(page.getByRole('button', { name: 'Scarf' })).click();
    await visible(page.getByRole('button', { name: 'Peach' })).click();
    await expect(visible(page.getByRole('radio', { name: /Design Bard/ }))).toHaveAttribute('aria-checked', 'true');
    await visible(page.getByRole('button', { name: 'Create character' })).click();
    await page.waitForURL('/journal');
    await expect(visible(page.getByRole('heading', { level: 1 }))).toHaveText('Day 1 awaits.');
    await expect(visible(page.getByRole('link', { name: 'My sheet' }))).toBeVisible();
  });
});

test.describe('logging quests', () => {
  test('the API’s field errors appear next to the fields, and clear as you fix them', async ({ page }) => {
    await newAdventurer(page);
    await visible(page.getByRole('link', { name: /Log day 1/ })).click();
    await visible(page.getByRole('button', { name: 'Publish quest' })).click();
    await expect(visible(page.locator('.form-error'))).toHaveText('That quest is not valid.');
    await expect(visible(page.locator('#title-error'))).toHaveText('title must be at least 3 characters');
    await expect(visible(page.locator('#skills-error'))).toBeVisible();
    await visible(page.getByLabel('Title')).fill('Fixed it');
    await expect(page.locator('#title-error')).toHaveCount(0);
  });

  test('publishing shows the reward: exact XP, level-up, first badge and Pip; the journal then lists the quest', async ({ page }) => {
    await newAdventurer(page);
    // hard 150 + one PR 20 = 170, split across React and Styling (85 each), both Mage home skills (+10%): 93 + 93
    await logQuest(page, { title: 'Ship the reward screen', difficulty: 'hard', skills: ['React', 'Styling'], pr: 'https://github.com/x/y/pull/1' });
    const reward = page.getByRole('dialog', { name: 'Quest complete!' });
    await expect(reward).toBeVisible();
    await expect(reward.locator('.reward-xp')).toHaveText('+186 XP');
    await expect(reward.getByText('Level up! Level 2 · Trainee')).toBeVisible();
    await expect(reward.getByText('New badge: First Quest')).toBeVisible();
    await expect(reward.locator('.corner-bubble')).not.toBeEmpty();
    await page.keyboard.press('Escape');
    await page.waitForURL('/journal');
    await expect(visible(page.getByRole('link', { name: /Ship the reward screen/ }))).toContainText('+186');
    await expect(visible(page.getByRole('heading', { level: 1 }))).toHaveText('Day 2 awaits.');
  });

  test('after publishing, “Log day 2” starts from a fresh form (the old one is not left filled in)', async ({ page }) => {
    await newAdventurer(page);
    await logQuest(page, { title: 'Day one done' });
    await page.getByRole('button', { name: 'Back to my journal' }).click();
    await page.waitForURL('/journal');
    await visible(page.getByRole('link', { name: /Log day 2/ })).click();
    await page.waitForURL('/journal/new');
    await expect(visible(page.getByRole('heading', { level: 1 }))).toHaveText('Log day 2');
    await expect(visible(page.getByLabel('Title'))).toHaveValue('');
  });

  test('a draft earns nothing until it is published', async ({ page }) => {
    await newAdventurer(page);
    await logQuest(page, { title: 'Half-finished idea', draft: true });
    await page.waitForURL('/journal');
    const card = visible(page.getByRole('link', { name: /Half-finished idea/ }));
    await expect(card).toContainText('draft');
    await expect(card).toContainText('—');
    await card.click();
    await visible(page.getByRole('button', { name: 'Publish quest' })).click();
    await expect(page.getByRole('dialog', { name: 'Quest complete!' })).toBeVisible();
  });

  test('edit a quest, then delete it (with a confirmation)', async ({ page }) => {
    await newAdventurer(page);
    await logQuest(page, { title: 'Original title' });
    await page.getByRole('button', { name: 'Back to my journal' }).click();
    await visible(page.getByRole('link', { name: /Original title/ })).click();
    await visible(page.getByLabel('Title')).fill('Better title');
    await visible(page.getByRole('button', { name: 'Save changes' })).click();
    await page.waitForURL('/journal');
    await expect(visible(page.getByRole('link', { name: /Better title/ }))).toBeVisible();

    await visible(page.getByRole('link', { name: /Better title/ })).click();
    await visible(page.getByRole('button', { name: 'Delete quest' })).click();
    const confirm = page.getByRole('dialog', { name: /Delete day 1/ });
    await confirm.getByRole('button', { name: 'Keep it' }).click();
    await expect(confirm).toBeHidden();
    await visible(page.getByRole('button', { name: 'Delete quest' })).click();
    await confirm.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.waitForURL('/journal?notice=deleted');
    await expect(visible(page.getByRole('status').filter({ hasText: 'Quest deleted.' }))).toBeVisible();
    await expect(page.getByRole('link', { name: /Better title/ })).toHaveCount(0);
  });

  test("someone else's quest can not be opened in the editor", async ({ page, browser }) => {
    await newAdventurer(page);
    await logQuest(page, { title: 'Mine, all mine' });
    await page.getByRole('button', { name: 'Back to my journal' }).click();
    await visible(page.getByRole('link', { name: /Mine, all mine/ })).click();
    await page.waitForURL(/\/journal\/[0-9a-f-]{36}$/);
    const editUrl = page.url();
    const other = await browser.newPage();
    await newAdventurer(other);
    await other.goto(editUrl);
    // a "soft" 404: the page is already streaming when the quest turns out not to be yours, so Next.js keeps status
    // 200 but renders the not-found page (and nothing of the quest)
    await expect(other.getByRole('heading', { name: /off the map/ })).toBeVisible();
    await expect(other.getByText('Mine, all mine')).toHaveCount(0);
  });
});

test.describe('the public character sheet', () => {
  test('lists public quests only, but private quests still count for XP; /@handle shows the same sheet', async ({ page, browser }) => {
    const handle = await newAdventurer(page);
    await logQuest(page, { title: 'Out loud' });
    await page.getByRole('button', { name: 'Back to my journal' }).click();
    await logQuest(page, { title: 'Secret side quest', isPublic: false });
    await page.getByRole('button', { name: 'Back to my journal' }).click();

    const visitor = await browser.newPage();
    await visitor.goto(`/c/${handle}`);
    await expect(visible(visitor.getByRole('heading', { level: 1 }))).toContainText('Quest Tester is a level');
    await expect(visible(visitor.locator('.quests')).getByText('Out loud')).toBeVisible();
    await expect(visitor.getByText('Secret side quest')).toHaveCount(0);
    // both quests count: normal (100) on React, a Mage home skill (+10%) = 110; day 2 also has the streak bonus:
    // 100 x 1.1 = 110, then +10% = 121. 110 + 121 = 231 XP, although only one quest is listed
    await expect(visible(visitor.locator('.level-facts'))).toContainText('231 XP total');

    await visitor.goto(`/@${handle}`);
    await expect(visitor).toHaveURL(`/@${handle}`);
    await expect(visible(visitor.getByRole('heading', { level: 1 }))).toContainText('Quest Tester');
  });
});

test.describe('mentors', () => {
  test('an intern can not enter the Guild hall', async ({ page }) => {
    await newAdventurer(page);
    await page.goto('/guild');
    await page.waitForURL('/journal?notice=mentors-only');
    await expect(visible(page.locator('.notice'))).toContainText('The Guild hall is for mentors');
  });

  test('the invite code promotes you at once (no signing in again), and the Guild hall opens', async ({ page }) => {
    await newAdventurer(page);
    await page.goto('/character');
    await visible(page.getByLabel('Mentor invite code')).fill('not-it');
    await visible(page.getByRole('button', { name: 'Become a guild master' })).click();
    await expect(visible(page.getByRole('alert').filter({ hasText: 'That invite code is not right.' }))).toBeVisible();
    await visible(page.getByLabel('Mentor invite code')).fill('demo-mentor');
    await visible(page.getByRole('button', { name: 'Become a guild master' })).click();
    await expect(visible(page.locator('.form-ok'))).toBeVisible();
    await page.goto('/guild');
    await expect(visible(page.getByRole('heading', { name: 'Guild hall' }))).toBeVisible();
    expect((await (await page.request.get('/api/auth/session')).json()).user.role).toBe('mentor');
  });

  test("a mentor's note and badge reach the intern", async ({ page, browser }) => {
    const handle = await newAdventurer(page);
    await logQuest(page, { title: `Review me ${handle}` });
    await page.getByRole('button', { name: 'Back to my journal' }).click();

    const mentor = await browser.newPage();
    await signInAs(mentor, 'mentor@example.com');
    await mentor.goto('/guild');
    const item = visible(mentor.locator('.feed-item').filter({ hasText: `Review me ${handle}` }));
    await item.getByPlaceholder('Leave a note…').fill('Lovely work on this one.');
    await item.getByRole('button', { name: 'Add note' }).click();
    await expect(item.getByText('Lovely work on this one.')).toBeVisible();

    await item.getByRole('button', { name: 'Award badge' }).click();
    const award = mentor.getByRole('dialog', { name: /Award a badge/ });
    await award.getByRole('button', { name: 'Icon 🌟' }).click();
    await award.getByLabel('Name').fill('Rising star');
    await award.getByRole('button', { name: 'Award', exact: true }).click();
    await expect(visible(mentor.locator('.notice'))).toContainText('Rising star');

    await page.goto(`/c/${handle}`);
    await expect(visible(page.locator('.badges'))).toContainText('Rising star');
  });
});
