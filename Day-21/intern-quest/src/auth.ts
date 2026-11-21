import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GitHub from 'next-auth/providers/github';
import { DbError } from '@/lib/server/db';
import { getUser, linkGithubAccount, verifyCredentials, type GithubIdentity } from '@/lib/server/users';

/**
 * AUTHENTICATION (NextAuth v5 / Auth.js, still labelled beta).
 *
 * Sessions are JWTs in an encrypted, http-only cookie (signed with AUTH_SECRET): no session table, and the proxy can
 * read them cheaply. The token carries our user id and role. The role is re-read from the database when the session
 * is updated (after redeeming a mentor code), since a token can not notice a database change on its own.
 *
 * GitHub sign-in is switched on only when AUTH_GITHUB_ID and AUTH_GITHUB_SECRET are set, so local development works
 * without an OAuth app. NextAuth reads those two variables (and AUTH_SECRET) by itself.
 */
export const githubEnabled = Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);

const text = (value: unknown): string => (typeof value === 'string' ? value : '');

function githubIdentity(account: { providerAccountId: string }, profile: unknown, user: { email?: string | null; name?: string | null; image?: string | null }): GithubIdentity {
  const login = typeof profile === 'object' && profile !== null && 'login' in profile && typeof profile.login === 'string' ? profile.login : null;
  return { providerAccountId: account.providerAccountId, email: user.email ?? null, name: user.name ?? null, image: user.image ?? null, login };
}

export const config = {
  // the app runs behind Vercel's proxy and under `next start` locally: trust the forwarded host header
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/login', error: '/login' },
  // a wrong password is an everyday event, not a server fault: one warning line instead of a stack trace
  logger: {
    error(error) {
      if ('type' in error && error.type === 'CredentialsSignin') console.warn('[auth] sign-in refused: wrong email or password');
      else console.error('[auth]', error);
    },
  },
  providers: [
    Credentials({
      credentials: { email: { label: 'Email', type: 'email' }, password: { label: 'Password', type: 'password' } },
      // returning null means "wrong email or password" (NextAuth turns it into a CredentialsSignin error)
      authorize: async (credentials) => verifyCredentials(text(credentials.email), text(credentials.password)),
    }),
    ...(githubEnabled ? [GitHub] : []),
  ],
  callbacks: {
    /** Refuse a GitHub sign-in whose email belongs to a password account (see linkGithubAccount for why) */
    async signIn({ account, profile, user }) {
      if (account?.provider !== 'github') return true;
      try {
        await linkGithubAccount(githubIdentity(account, profile, user));
        return true;
      } catch (error) {
        if (error instanceof DbError && error.kind === 'conflict') return '/login?error=github-email-taken';
        throw error;
      }
    },
    /** Runs when a token is created (sign-in), and on every request that reads the session */
    async jwt({ token, user, account, profile, trigger }) {
      if (trigger === 'signIn' || trigger === 'signUp') {
        const appUser = account?.provider === 'github' ? await linkGithubAccount(githubIdentity(account, profile, user)) : user;
        if (appUser.id) token.uid = appUser.id;
        token.role = appUser.role ?? 'intern';
        token.name = appUser.name;
      }
      if (trigger === 'update' && token.uid) {
        const fresh = await getUser(token.uid);
        if (fresh) token.role = fresh.role;
      }
      return token;
    },
    /** What the app (and the browser, via useSession) may see: id, role, name, email, image. Never the password hash. */
    session({ session, token }) {
      session.user.id = token.uid ?? '';
      session.user.role = token.role ?? 'intern';
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut, unstable_update: updateSession } = NextAuth(config);
