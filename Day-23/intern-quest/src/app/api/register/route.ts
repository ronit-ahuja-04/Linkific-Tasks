import { DbError } from '@/lib/server/db';
import { invalid, ok, problem, readJson, withErrors } from '@/lib/server/http';
import { createPasswordUser } from '@/lib/server/users';
import { parseRegistration } from '@/lib/validation';

/**
 * POST /api/register   { email, password, name }  ->  201 { user }
 * Creates the account only; signing in is a separate step (POST /api/auth/callback/credentials, or the login form).
 */
export const POST = withErrors(async (request: Request) => {
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const parsed = parseRegistration(json.value);
  if (!parsed.ok) return invalid(parsed, 'registration');
  try {
    const user = await createPasswordUser(parsed.value.email, parsed.value.password, parsed.value.name);
    return ok({ user: { id: user.id, email: user.email, name: user.name, role: user.role } }, 201);
  } catch (error) {
    if (error instanceof DbError && error.kind === 'conflict') return problem(409, 'That email is already registered. Sign in instead.');
    throw error;
  }
});
