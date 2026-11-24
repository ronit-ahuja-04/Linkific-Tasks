/**
 * DECLARATION MERGING (module augmentation): NextAuth's own `Session`, `User` and `JWT` interfaces are extended with
 * the fields this app adds, so `session.user.role` and `token.uid` are typed everywhere instead of being `any`.
 */
import type { DefaultSession } from 'next-auth';
import type { Role } from '@/lib/server/users';

declare module 'next-auth' {
  interface User {
    role?: Role;
  }
  interface Session {
    user: { id: string; role: Role } & DefaultSession['user'];
  }
}

// next-auth/jwt only re-exports this interface from @auth/core, so the augmentation must target the original module
declare module '@auth/core/jwt' {
  interface JWT {
    /** our users.id (not the provider's id) */
    uid?: string;
    role?: Role;
  }
}
