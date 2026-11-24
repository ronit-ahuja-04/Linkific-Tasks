import { getCharacterByUser, saveCharacter } from '@/lib/server/db';
import { invalid, notFound, ok, readJson, unauthorized } from '@/lib/server/http';
import { fromDbError } from '@/lib/server/quests';
import { refreshCharacter } from '@/lib/server/revalidate';
import { currentUser } from '@/lib/server/session';
import { parseCharacter } from '@/lib/validation';

/** GET /api/character   my character (404 until I create one) */
export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();
  const character = await getCharacterByUser(user.id);
  if (!character) return notFound('You have not created a character yet.');
  const { userId: _userId, ...rest } = character;
  return ok({ character: rest });
}

/** PUT /api/character   create or update my character. 201 when created, 200 when updated, 409 if the handle is taken. */
export async function PUT(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const parsed = parseCharacter(json.value);
  if (!parsed.ok) return invalid(parsed, 'character');

  const before = await getCharacterByUser(user.id);
  try {
    const { userId: _userId, ...character } = await saveCharacter(user.id, parsed.value);
    if (before && before.handle !== character.handle) refreshCharacter(before.handle); // the old URL changes too
    refreshCharacter(character.handle);
    return ok({ character }, before ? 200 : 201);
  } catch (error) {
    return fromDbError(error, `The handle "${parsed.value.handle}" is taken. Try another.`);
  }
}
