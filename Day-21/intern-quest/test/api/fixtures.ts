import postgres from 'postgres';
import { vi } from 'vitest';
import type { SessionUser } from '@/lib/server/session';

/**
 * Test people, created fresh for the API tests and deleted afterwards (cascade), so the seed is never touched.
 * Emails end in .invalid (a domain reserved for tests by RFC 2606).
 */
export const people = {
  one: { id: '00000000-0000-4000-8000-0000000000a1', name: 'Tester One', email: 'one@test.invalid', role: 'intern' },
  two: { id: '00000000-0000-4000-8000-0000000000a2', name: 'Tester Two', email: 'two@test.invalid', role: 'intern' },
  newbie: { id: '00000000-0000-4000-8000-0000000000a3', name: 'No Character', email: 'newbie@test.invalid', role: 'intern' },
  mentor: { id: '00000000-0000-4000-8000-0000000000a9', name: 'Test Mentor', email: 'mentor@test.invalid', role: 'mentor' },
} satisfies Record<string, SessionUser>;

export const sql = postgres(process.env.DATABASE_URL ?? '', { max: 2, onnotice: () => {} });

export async function createPeople(): Promise<void> {
  await removePeople();
  for (const p of Object.values(people)) await sql`insert into public.users (id, email, name, role) values (${p.id}, ${p.email}, ${p.name}, ${p.role}::public.user_role)`;
  await sql`insert into public.characters (user_id, handle, display_name, class) values
    (${people.one.id}, 'tester-one', 'Tester One', 'fullstack_ranger'),
    (${people.two.id}, 'tester-two', 'Tester Two', 'backend_knight')`;
}

export async function removePeople(): Promise<void> {
  await sql`delete from public.users where email like '%@test.invalid'`;
}

// ---------------------------------------------------------------- calling route handlers directly

export const request = (method: string, path: string, body?: unknown): Request =>
  new Request(`http://localhost${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
  });

/** The second argument Next.js passes to a dynamic route handler */
export const params = <P extends Record<string, string>>(values: P) => ({ params: Promise.resolve(values) });

export async function json(response: Response): Promise<{ status: number; body: unknown }> {
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

/** Narrow an unknown JSON body to a record so a test can read its fields */
export function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`Expected a JSON object, got ${JSON.stringify(value)}`);
  return Object.fromEntries(Object.entries(value));
}

export const quest = (day: number, overrides: Record<string, unknown> = {}) => ({
  day, date: `2026-11-${String(day).padStart(2, '0')}`, title: `Quest for day ${day}`, skills: ['backend'], ...overrides,
});

export { vi };
