import type { Role } from '../lib/types';

/** Where each role lands after signing in. */
export function homeFor(role: Role): string {
  if (role === 'admin') return '/admin';
  if (role === 'instructor') return '/studio';
  return '/map';
}
