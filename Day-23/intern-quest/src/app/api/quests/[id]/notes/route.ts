import { createNote, getCharacterByUser, getQuest, listNotes } from '@/lib/server/db';
import { forbidden, invalid, notFound, ok, readJson, unauthorized, withErrors } from '@/lib/server/http';
import { canRead } from '@/lib/server/quests';
import { refreshCharacter } from '@/lib/server/revalidate';
import { currentUser } from '@/lib/server/session';
import { isUuid, parseNote } from '@/lib/validation';

const NOT_FOUND = 'No such quest.';

/** GET /api/quests/:id/notes   a mentor's notes on a quest, for anyone who can read the quest */
export const GET = withErrors(async (_request: Request, ctx: RouteContext<'/api/quests/[id]/notes'>) => {
  const { id } = await ctx.params;
  if (!isUuid(id)) return notFound(NOT_FOUND);
  const [user, quest] = await Promise.all([currentUser(), getQuest(id)]);
  if (!quest || !canRead(user, quest, await getCharacterByUser(quest.userId))) return notFound(NOT_FOUND);
  return ok({ notes: await listNotes(id) });
});

/** POST /api/quests/:id/notes   mentors only: leave a note on a published, public quest */
export const POST = withErrors(async (request: Request, ctx: RouteContext<'/api/quests/[id]/notes'>) => {
  const user = await currentUser();
  if (!user) return unauthorized();
  if (user.role !== 'mentor') return forbidden('Only mentors can leave notes.');
  const { id } = await ctx.params;
  if (!isUuid(id)) return notFound(NOT_FOUND);
  const quest = await getQuest(id);
  const owner = quest ? await getCharacterByUser(quest.userId) : null;
  if (!quest || !canRead(null, quest, owner)) return notFound(NOT_FOUND);

  const json = await readJson(request);
  if (!json.ok) return json.response;
  const parsed = parseNote(json.value);
  if (!parsed.ok) return invalid(parsed, 'note');

  const note = await createNote(id, user.id, parsed.value.body);
  if (owner) refreshCharacter(owner.handle);
  return ok({ note }, 201);
});
