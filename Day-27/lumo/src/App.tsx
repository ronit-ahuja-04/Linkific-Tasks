import { useEffect } from 'react';
import { useAppDispatch } from './app/hooks';
import { Wisp } from './components/characters';
import { profileLoaded, restoreSession } from './features/auth/authSlice';
import { loadProfile, onAuthChange } from './lib/api/auth';
import { supabaseConfigured } from './lib/supabase';
import { AppRouter } from './routes/AppRouter';

function SetupNeeded() {
  return (
    <main
      id="main"
      className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <Wisp size={110} mood="sad" />
      <h1 className="m-0 text-2xl font-bold">Lumo isn't connected to a database yet</h1>
      <p className="m-0 max-w-md text-dusk">
        Start the local stack with <code>npm run db:start</code>, then{' '}
        <code>npm run env:local</code>, and reload.
      </p>
    </main>
  );
}

function Session() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    void dispatch(restoreSession());
    // Keep Redux in step with Supabase: sign-out in another tab, expired refresh tokens, sign-in elsewhere.
    return onAuthChange((session) => {
      if (!session) {
        dispatch(profileLoaded(null));
        return;
      }
      loadProfile(session.user.id).then(
        (profile) => dispatch(profileLoaded(profile)),
        () => dispatch(profileLoaded(null)),
      );
    });
  }, [dispatch]);
  return <AppRouter />;
}

export function App() {
  return supabaseConfigured ? <Session /> : <SetupNeeded />;
}
