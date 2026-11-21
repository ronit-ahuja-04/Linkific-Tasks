import { deleteQuest, getCharacterByUser, getQuest, listQuests, updateQuest } from '@/lib/server/db';
import { forbidden, invalid, noContent, notFound, ok, readJson, unauthorized } from '@/lib/server/http';
import { canRead, fromDbError, rewardFor, toDto } from '@/lib/server/quests';
import { refreshCharacter } from '@/lib/server/revalidate';
import { currentUser } from '@/lib/server/session';
import { isUuid, parseQuest } from '@/lib/validation';

const NOT_FOUND = 'No such quest.';

/** GET /api/quests/:id   your own quest, or anyone's published public quest */
export async function GET(_request: Request, ctx: RouteContext<'/api/quests/[id]'>) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return notFound(NOT_FOUND);
  const [user, quest] = await Promise.all([currentUser(), getQuest(id)]);
  if (!quest) return notFound(NOT_FOUND);
  const character = await getCharacterByUser(quest.userId);
  if (!canRead(user, quest, character)) return notFound(NOT_FOUND);
  return ok({ quest: toDto(quest), handle: character?.handle ?? null });
}

/**
 * PUT /api/quests/:id   replace a quest you own (all fields, as on create).
 * 401 not signed in · 404 no such quest (or not visible to you) · 403 someone else's · 409 the new day is taken
 */
export async function PUT(request: Request, ctx: RouteContext<'/api/quests/[id]'>) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  if (!isUuid(id)) return notFound(NOT_FOUND);
  const existing = await getQuest(id);
  if (!existing) return notFound(NOT_FOUND);
  if (existing.userId !== user.id) {
    // someone else's quest: say "not yours" only if the caller could see it anyway
    return canRead(user, existing, await getCharacterByUser(existing.userId)) ? forbidden('You can only edit your own quests.') : notFound(NOT_FOUND);
  }

  const json = await readJson(request);
  if (!json.ok) return json.response;
  const parsed = parseQuest(json.value);
  if (!parsed.ok) return invalid(parsed, 'quest');

  const character = await getCharacterByUser(user.id);
  try {
    const quest = await updateQuest(id, parsed.value);
    const reward = character && existing.status === 'draft' ? rewardFor(character.class, await listQuests(user.id), quest) : null;
    if (character) refreshCharacter(character.handle);
    return ok({ quest: toDto(quest), reward });
  } catch (error) {
    return fromDbError(error, `You already logged day ${parsed.value.day}.`);
  }
}

/** DELETE /api/quests/:id   delete a quest you own. 204 on success. */
export async function DELETE(_request: Request, ctx: RouteContext<'/api/quests/[id]'>) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  if (!isUuid(id)) return notFound(NOT_FOUND);
  const existing = await getQuest(id);
  if (!existing) return notFound(NOT_FOUND);
  if (existing.userId !== user.id) {
    return canRead(user, existing, await getCharacterByUser(existing.userId)) ? forbidden('You can only delete your own quests.') : notFound(NOT_FOUND);
  }
  await deleteQuest(id);
  const character = await getCharacterByUser(user.id);
  if (character) refreshCharacter(character.handle);
  return noContent();
}
