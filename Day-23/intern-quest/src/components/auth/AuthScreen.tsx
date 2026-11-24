import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { auth, githubEnabled } from '@/auth';
import { githubAction, loginAction, registerAction } from '@/app/(auth)/actions';
import { safeNext } from '@/lib/validation';
import AuthForm from './AuthForm';
import AuthPip from './AuthPip';

const ERRORS: Record<string, string> = {
  'github-email-taken': 'That GitHub account uses an email that is already registered with a password. Sign in with your password.',
  AccessDenied: 'Sign-in was cancelled or refused.',
  Configuration: 'Sign-in is not set up correctly on this server.',
};

/** The shared sign-in / register screen. Reads the URL (`?next=`, `?error=`) and the session, so it renders per request. */
export default async function AuthScreen({ mode, searchParams }: { mode: 'login' | 'register'; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // request-time only: this screen depends on the session cookie, and the sign-in code it renders uses random values
  await connection();
  const query = await searchParams;
  const next = safeNext(query.next);
  if (await auth()) redirect(next); // already signed in: nothing to do here
  const errorKey = typeof query.error === 'string' ? query.error : '';
  const register = mode === 'register';

  return (
    <main className="auth-screen">
      <section className="auth-hero">
        <p className="wordmark">Intern Quest</p>
        <h1>{register ? <>Every day is a <span>quest.</span></> : <>Welcome back, <span>adventurer.</span></>}</h1>
        <p className="auth-lede">{register ? 'Log what you build, earn XP for every skill, and raise Pip from an egg to a guardian.' : 'Pip has been waiting. Sign in to log today’s quest.'}</p>
        <AuthPip />
      </section>
      <section className="auth-card" aria-labelledby="auth-title">
        <h2 id="auth-title">{register ? 'Create your account' : 'Sign in'}</h2>
        {errorKey && <p className="auth-error" role="alert">{ERRORS[errorKey] ?? 'Could not sign in. Try again.'}</p>}
        {githubEnabled && (
          <>
            <form action={githubAction}>
              <input type="hidden" name="next" value={next} />
              <button type="submit" className="auth-github">
                <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" /></svg>
                Continue with GitHub
              </button>
            </form>
            <p className="auth-or"><span>or with email</span></p>
          </>
        )}
        <AuthForm mode={mode} action={register ? registerAction : loginAction} next={next} />
      </section>
    </main>
  );
}
