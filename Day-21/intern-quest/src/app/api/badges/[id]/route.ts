import { deleteMentorBadge, getMentorBadge } from '@/lib/server/db';
import { forbidden, noContent, notFound, unauthorized } from '@/lib/server/http';
import { currentUser } from '@/lib/server/session';
import { isUuid } from '@/lib/validation';

/** DELETE /api/badges/:id   mentors only: take back a badge. 204 on success. */
export async function DELETE(_request: Request, ctx: RouteContext<'/api/badges/[id]'>) {
  const user = await currentUser();
  if (!user) return unauthorized();
  if (user.role !== 'mentor') return forbidden('Only mentors can remove badges.');
  const { id } = await ctx.params;
  if (!isUuid(id) || !(await getMentorBadge(id))) return notFound('No such badge.');
  await deleteMentorBadge(id);
  return noContent();
}
