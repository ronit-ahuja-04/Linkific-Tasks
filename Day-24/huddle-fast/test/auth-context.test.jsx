// @vitest-environment jsdom
import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider, SESSION_ENDED_KEY, sessionEndedByServer, useAuth } from '../src/auth/AuthContext';

/** A fake supabase client: only what AuthProvider calls */
function fakeClient({ session, userError = null, profile = { id: 'u1', username: 'ada' } } = {}) {
  let listener;
  return {
    emit: (event, next) => listener(event, next),
    auth: {
      getSession: vi.fn(async () => ({ data: { session } })),
      getUser: vi.fn(async () => ({ data: { user: userError ? null : session?.user }, error: userError })),
      signOut: vi.fn(async () => ({ error: null })),
      onAuthStateChange: vi.fn((cb) => { listener = cb; return { data: { subscription: { unsubscribe: vi.fn() } } }; }),
    },
    from: vi.fn(() => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: profile }) }) }) })),
  };
}
function Probe() {
  const { status, user, profile } = useAuth();
  return <p data-testid="state">{`${status}|${user?.id ?? '-'}|${profile?.username ?? '-'}`}</p>;
}
const mount = (client) => render(<AuthProvider client={client}><Probe /></AuthProvider>);
const session = { access_token: 't', user: { id: 'u1', email: 'ada@example.com' } };

describe('AuthProvider', () => {
  it('starts loading, then authenticated with the profile row of the signed-in user', async () => {
    mount(fakeClient({ session }));
    expect(screen.getByTestId('state').textContent).toMatch(/^loading/);
    await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('authenticated|u1|ada'));
  });

  it('is anonymous without a session', async () => {
    const client = fakeClient({ session: null });
    mount(client);
    await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('anonymous|-|-'));
    expect(client.auth.getUser).not.toHaveBeenCalled();
  });

  it('follows sign-in and sign-out events from supabase-js', async () => {
    const client = fakeClient({ session: null });
    mount(client);
    await waitFor(() => expect(screen.getByTestId('state').textContent).toMatch(/^anonymous/));
    act(() => client.emit('SIGNED_IN', session));
    await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('authenticated|u1|ada'));
    act(() => client.emit('SIGNED_OUT', null));
    await waitFor(() => expect(screen.getByTestId('state').textContent).toMatch(/^anonymous/));
  });

  it('checks a stored session with the Auth SERVER, and signs out locally when the session was revoked elsewhere', async () => {
    const client = fakeClient({ session, userError: { status: 403, message: 'Session from session_id claim in JWT does not exist' } });
    mount(client);
    await waitFor(() => expect(client.auth.getUser).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(client.auth.signOut).toHaveBeenCalledWith({ scope: 'local' }));
  });

  it('checks again when you come back to the tab, and signs out if the user no longer exists (at most every 30 s)', async () => {
    const client = fakeClient({ session });
    mount(client);
    await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('authenticated|u1|ada'));
    expect(client.auth.getUser).toHaveBeenCalledTimes(1); // the start-up check
    // the account is deleted while the tab is open (what a local `supabase db reset` does)
    client.auth.getUser.mockResolvedValue({ data: { user: null }, error: { status: 403, code: 'user_not_found', message: 'User from sub claim in JWT does not exist' } });
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    await waitFor(() => expect(client.auth.signOut).toHaveBeenCalledWith({ scope: 'local' }));
    expect(sessionStorage.getItem(SESSION_ENDED_KEY)).toBe('1'); // the sign-in page will say why
    act(() => window.dispatchEvent(new Event('focus')));
    expect(client.auth.getUser).toHaveBeenCalledTimes(2); // not again within 30 seconds
    act(() => client.emit('SIGNED_IN', session)); // signing in again clears the note for the sign-in page
    expect(sessionStorage.getItem(SESSION_ENDED_KEY)).toBeNull();
  });

  it('exposes recheckSession for screens that hit a "no such row" error', async () => {
    let api;
    function Grab() { api = useAuth(); return null; }
    const client = fakeClient({ session });
    render(<AuthProvider client={client}><Grab /></AuthProvider>);
    await waitFor(() => expect(api.status).toBe('authenticated'));
    expect(await api.recheckSession()).toBe(true);
    client.auth.getUser.mockResolvedValue({ data: { user: null }, error: { status: 403, code: 'user_not_found' } });
    expect(await api.recheckSession()).toBe(false);
    expect(client.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    sessionStorage.clear();
  });

  it('recognises both ways the server says "this session is over", and not a network error', () => {
    expect(sessionEndedByServer({ status: 403, code: 'user_not_found' })).toBe(true); // a deleted account
    expect(sessionEndedByServer({ name: 'AuthSessionMissingError', status: 400 })).toBe(true); // "sign out of all devices"
    expect(sessionEndedByServer({ status: 0, message: 'Failed to fetch' })).toBe(false);
    expect(sessionEndedByServer(null)).toBe(false);
  });

  it('sessionEnded is state: set when the check fails, so a sign-in page already on screen can show why', async () => {
    let api;
    function Grab() { api = useAuth(); return null; }
    const client = fakeClient({ session });
    render(<AuthProvider client={client}><Grab /></AuthProvider>);
    await waitFor(() => expect(api.status).toBe('authenticated'));
    expect(api.sessionEnded).toBe(false);
    client.auth.getUser.mockResolvedValue({ data: { user: null }, error: { name: 'AuthSessionMissingError', status: 400 } });
    await act(async () => { await api.recheckSession(); });
    expect(api.sessionEnded).toBe(true);
    act(() => client.emit('SIGNED_IN', session));
    expect(api.sessionEnded).toBe(false);
    sessionStorage.clear();
  });

  it('does NOT sign out because of a network problem while checking', async () => {
    const client = fakeClient({ session, userError: { status: 0, message: 'Failed to fetch' } });
    mount(client);
    await waitFor(() => expect(client.auth.getUser).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(client.auth.signOut).not.toHaveBeenCalled();
    expect(screen.getByTestId('state').textContent).toBe('authenticated|u1|ada');
  });

  it('useAuth fails clearly outside a provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/AuthProvider/);
    spy.mockRestore();
  });
});
