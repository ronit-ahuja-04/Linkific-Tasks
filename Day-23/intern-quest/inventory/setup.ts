import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { chromium, type FullConfig } from '@playwright/test';
import { logQuest, newAdventurer, signInAs, visible } from '../e2e/helpers';
import { dbFault, RESULTS, SHOTS_DIR, STATE_DIR, type Fixture } from './record';

/**
 * Before the scenarios: a fresh intern (a throwaway @test.invalid account, deleted afterwards) with a character and
 * one published quest, and the seeded demo mentor. Their sign-ins are saved so each scenario starts signed in.
 */
export default async function setup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0].use.baseURL ?? 'http://localhost:3131';
  mkdirSync(STATE_DIR, { recursive: true });
  rmSync(RESULTS, { force: true });
  rmSync(SHOTS_DIR, { recursive: true, force: true });
  await dbFault('pass');

  const browser = await chromium.launch({ channel: 'chrome' });
  const intern = await browser.newContext({ baseURL });
  const page = await intern.newPage();
  const handle = await newAdventurer(page);
  await logQuest(page, { title: 'Inventory baseline quest' });
  await page.getByRole('dialog', { name: 'Quest complete!' }).waitFor();
  await page.keyboard.press('Escape');
  await page.waitForURL('/journal');
  const href = await visible(page.getByRole('link', { name: /Inventory baseline quest/ })).getAttribute('href');
  const questId = href?.split('/').pop() ?? '';
  const internState = path.join(STATE_DIR, 'intern.json');
  await intern.storageState({ path: internState });

  const mentor = await browser.newContext({ baseURL });
  await signInAs(await mentor.newPage(), 'mentor@example.com');
  const mentorState = path.join(STATE_DIR, 'mentor.json');
  await mentor.storageState({ path: mentorState });
  await browser.close();

  const fixture: Fixture = { handle, questId, internState, mentorState };
  writeFileSync(path.join(STATE_DIR, 'fixture.json'), JSON.stringify(fixture, null, 2));
}
