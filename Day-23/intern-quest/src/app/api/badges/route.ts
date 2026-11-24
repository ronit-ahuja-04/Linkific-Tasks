import { createMentorBadge, getCharacterByHandle } from '@/lib/server/db';
import { forbidden, invalid, notFound, ok, readJson, unauthorized } from '@/lib/server/http';
import { refreshCharacter } from '@/lib/server/revalidate';
import { currentUser } from '@/lib/server/session';
import { parseBadge } from '@/lib/validation';

/** POST /api/badges   mentors only: award a badge to a character by handle */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  if (user.role !== 'mentor') return forbidden('Only mentors can award badges.');
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const parsed = parseBadge(json.value);
  if (!parsed.ok) return invalid(parsed, 'badge');

  const character = await getCharacterByHandle(parsed.value.handle);
  if (!character) return notFound(`No character called @${parsed.value.handle}.`);
  const { handle: _handle, ...details } = parsed.value;
  const badge = await createMentorBadge(character.userId, user.id, details);
  refreshCharacter(character.handle);
  return ok({ badge }, 201);
}
