// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, renderHook, screen } from '@testing-library/react';

const fb = vi.hoisted(() => ({ configured: true }));
vi.mock('firebase/auth', async () => (await import('../mocks/auth.js')).authMock);
vi.mock('firebase/firestore', async () => (await import('../mocks/firestore.js')).firestoreMock);
vi.mock('../../src/lib/firebase', () => ({
  db: { name: 'db' },
  auth: { name: 'auth' },
  googleProvider: {},
  get isFirebaseConfigured() {
    return fb.configured;
  },
}));

import { authMock } from '../mocks/auth.js';
import { firestoreMock as fs, resetFirestoreMock } from '../mocks/firestore.js';
import { AuthProvider } from '../../src/context/AuthContext.jsx';
import { ThemeProvider, useTheme, useThemeActions, useThemeState } from '../../src/context/ThemeContext.jsx';

let emitAuth;
const storage = {};
const profileListeners = [];
const unsubscribeProfile = vi.fn();
// A profile document snapshot as Firestore delivers it
const profile = (data, { pending = false, exists = true } = {}) => ({ exists: () => exists, data: () => data, metadata: { hasPendingWrites: pending } });

beforeEach(() => {
  fb.configured = true;
  resetFirestoreMock();
  profileListeners.length = 0;
  fs.onSnapshot.mockImplementation((ref, options, next, error) => {
    profileListeners.push({ ref, options, next, error, unsubscribe: unsubscribeProfile });
    return unsubscribeProfile;
  });
  unsubscribeProfile.mockClear();
  authMock.onAuthStateChanged.mockImplementation((_a, cb) => { emitAuth = cb; return vi.fn(); });
  Object.keys(storage).forEach((k) => delete storage[k]);
  vi.stubGlobal('localStorage', { getItem: (k) => storage[k] ?? null, setItem: (k, v) => { storage[k] = v; } });
  document.documentElement.removeAttribute('data-theme');
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const wrapper = ({ children }) => (
  <AuthProvider>
    <ThemeProvider>{children}</ThemeProvider>
  </AuthProvider>
);
const signedIn = () => act(() => emitAuth({ uid: 'u1', email: 'ann@x.com', displayName: 'Ann', photoURL: null }));

describe('ThemeProvider', () => {
  it('defaults to light and puts data-theme on <html>', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.mode).toBe('light');
    expect(result.current.isDark).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('starts from the saved choice', () => {
    storage.theme = 'dark';
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.isDark).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('toggles, remembers the choice and updates <html>; setTheme ignores junk', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.toggleTheme());
    expect(result.current.mode).toBe('dark');
    expect(storage.theme).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    act(() => result.current.toggleTheme());
    expect(result.current.mode).toBe('light');
    act(() => result.current.setTheme('purple'));
    expect(result.current.mode).toBe('light');
    act(() => result.current.setTheme('dark'));
    expect(result.current.mode).toBe('dark');
  });

  it('does not touch Firestore while signed out', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.toggleTheme());
    expect(fs.updateDoc).not.toHaveBeenCalled();
    expect(fs.onSnapshot).not.toHaveBeenCalled(); // no profile to follow
  });

  it('saves the choice on the signed-in user\'s profile (composition with AuthContext)', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    signedIn();
    act(() => result.current.toggleTheme());
    expect(fs.updateDoc).toHaveBeenCalledWith(expect.objectContaining({ path: 'users/u1' }), { theme: 'dark' });
  });

  it('survives a failing profile save', () => {
    fs.updateDoc.mockRejectedValue(new Error('offline'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useTheme(), { wrapper });
    signedIn();
    act(() => result.current.toggleTheme());
    expect(result.current.mode).toBe('dark');
  });

  it('listens to the signed-in user\'s profile, with metadata changes', () => {
    renderHook(() => useTheme(), { wrapper });
    signedIn();
    expect(profileListeners).toHaveLength(1);
    expect(profileListeners[0].ref.path).toBe('users/u1');
    expect(profileListeners[0].options).toEqual({ includeMetadataChanges: true });
  });

  it('applies the theme saved on the profile after login', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    signedIn();
    act(() => profileListeners[0].next(profile({ theme: 'dark' })));
    expect(result.current.mode).toBe('dark');
    expect(storage.theme).toBe('dark');
  });

  it('ignores the half-written local copy (pending writes) and waits for the server version', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    signedIn();
    act(() => profileListeners[0].next(profile({ displayName: 'Ann' }, { pending: true }))); // no theme yet
    expect(result.current.mode).toBe('light');
    act(() => profileListeners[0].next(profile({ theme: 'dark' }, { pending: true }))); // still pending: ignored
    expect(result.current.mode).toBe('light');
    act(() => profileListeners[0].next(profile({ theme: 'dark' }))); // confirmed
    expect(result.current.mode).toBe('dark');
  });

  it('follows a change made on another device, without writing it back', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    signedIn();
    act(() => profileListeners[0].next(profile({ theme: 'light' })));
    act(() => profileListeners[0].next(profile({ theme: 'dark' })));
    expect(result.current.mode).toBe('dark');
    expect(fs.updateDoc).not.toHaveBeenCalled(); // applying never writes: no loop
  });

  it('keeps the current theme when the profile has none, is missing, or holds junk', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    signedIn();
    act(() => profileListeners[0].next(profile({ displayName: 'Ann' })));
    act(() => profileListeners[0].next(profile(undefined, { exists: false })));
    act(() => profileListeners[0].next(profile({ theme: 'purple' })));
    expect(result.current.mode).toBe('light');
  });

  it('logs a listener error and keeps working', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useTheme(), { wrapper });
    signedIn();
    profileListeners[0].error(new Error('permission-denied'));
    expect(log).toHaveBeenCalledWith('Failed to load saved theme', expect.any(Error));
    act(() => result.current.toggleTheme());
    expect(result.current.mode).toBe('dark');
  });

  it('stops listening when the user signs out', () => {
    renderHook(() => useTheme(), { wrapper });
    signedIn();
    act(() => emitAuth(null));
    expect(unsubscribeProfile).toHaveBeenCalledOnce();
  });
});

describe('splitting a context to avoid needless re-renders', () => {
  it('a component using only useThemeActions does NOT re-render when the theme changes; one using useThemeState does', () => {
    const renders = { actionsOnly: 0, stateReader: 0 };
    let toggle;
    function ActionsOnly() {
      const { toggleTheme } = useThemeActions();
      toggle = toggleTheme;
      renders.actionsOnly += 1;
      return <button>toggle</button>;
    }
    function StateReader() {
      const { mode } = useThemeState();
      renders.stateReader += 1;
      return <span>mode: {mode}</span>;
    }
    render(
      <AuthProvider>
        <ThemeProvider>
          <ActionsOnly />
          <StateReader />
        </ThemeProvider>
      </AuthProvider>
    );
    expect(screen.getByText('mode: light')).toBeTruthy();
    const before = { ...renders };

    act(() => toggle());
    act(() => toggle());
    act(() => toggle());

    expect(screen.getByText('mode: dark')).toBeTruthy();
    expect(renders.stateReader).toBe(before.stateReader + 3); // follows every change
    expect(renders.actionsOnly).toBe(before.actionsOnly); // never re-rendered
  });

  it('the action functions keep the same identity for the whole life of the provider', () => {
    const { result } = renderHook(() => useThemeActions(), { wrapper });
    const first = result.current;
    const { result: both } = renderHook(() => useTheme(), { wrapper });
    act(() => both.current.toggleTheme());
    expect(result.current).toBe(first);
  });
});
