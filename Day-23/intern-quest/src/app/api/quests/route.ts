import { createQuest, getCharacterByUser, listQuests } from '@/lib/server/db';
import { invalid, ok, problem, readJson, unauthorized, withErrors } from '@/lib/server/http';
import { fromDbError, rewardFor, toDto } from '@/lib/server/quests';
import { refreshCharacter } from '@/lib/server/revalidate';
import { currentUser } from '@/lib/server/session';
import { parseQuest } from '@/lib/validation';

/**
 * GET /api/quests            my quests, drafts included, by day
 * GET /api/quests?status=draft|published
 */
export const GET = withErrors(async (request: Request) => {
  const user = await currentUser();
  if (!user) return unauthorized();
  const status = new URL(request.url).searchParams.get('status');
  if (status !== null && status !== 'draft' && status !== 'published') return problem(400, 'status must be draft or published.');
  const quests = await listQuests(user.id, status ?? undefined);
  return ok({ quests: quests.map(toDto) });
});

/**
 * POST /api/quests   log a new quest.
 * 201 with the quest and, when it is published, the reward: XP gained, level-up, new badges and Pip's reaction.
 */
export const POST = withErrors(async (request: Request) => {
  const user = await currentUser();
  if (!user) return unauthorized();
  const character = await getCharacterByUser(user.id);
  if (!character) return problem(409, 'Create your character before logging quests.');

  const json = await readJson(request);
  if (!json.ok) return json.response;
  const parsed = parseQuest(json.value);
  if (!parsed.ok) return invalid(parsed, 'quest');

  try {
    const quest = await createQuest(user.id, parsed.value);
    const reward = rewardFor(character.class, await listQuests(user.id), quest);
    refreshCharacter(character.handle);
    return ok({ quest: toDto(quest), reward }, 201);
  } catch (error) {
    return fromDbError(error, `You already logged day ${parsed.value.day}. Edit that quest instead.`);
  }
});
