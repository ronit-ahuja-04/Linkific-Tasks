import { expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../../src/auth/AuthContext';
import { ToastProvider } from '../../src/context/ToastContext';

/** A chainable fake of supabase-js query builders. Every call is recorded in `calls`; awaiting resolves to `result`. */
export function fakeQuery(result = { data: null, error: null }) {
  const calls = [];
  const builder = new Proxy(function () {}, {
    get(_t, prop) {
      if (prop === 'then') return (resolve, reject) => Promise.resolve(typeof result === 'function' ? result() : result).then(resolve, reject);
      if (prop === 'calls') return calls;
      return (...args) => {
        calls.push([prop, ...args]);
        return builder;
      };
    },
  });
  return builder;
}

/** A fake supabase client: `tables` maps a table name to the result its queries resolve to */
export function fakeClient({ tables = {}, storage = {}, session = null } = {}) {
  const queries = [];
  const listeners = [];
  const bucket = {
    upload: vi.fn(async () => ({ data: { path: 'x' }, error: null })),
    remove: vi.fn(async () => ({ data: [], error: null })),
    getPublicUrl: vi.fn((path) => ({ data: { publicUrl: `http://storage/avatars/${path}` } })),
    ...storage,
  };
  const client = {
    queries,
    listeners,
    bucket,
    auth: {
      getSession: vi.fn(async () => ({ data: { session } })),
      onAuthStateChange: vi.fn((cb) => {
        listeners.push(cb);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      signOut: vi.fn(async () => ({ error: null })),
    },
    from: vi.fn((table) => {
      const q = fakeQuery(tables[table] ?? { data: null, error: null });
      queries.push({ table, q });
      return q;
    }),
    storage: { from: vi.fn(() => bucket) },
  };
  return client;
}

export const USER = { id: 'u-1', email: 'ada@example.com', created_at: '2026-01-02T03:04:05Z', app_metadata: { providers: ['email'] } };
export const PROFILE = { id: 'u-1', username: 'ada', full_name: 'Ada Lovelace', bio: 'Hello', avatar_path: null };

/** The value `useAuth()` returns, with every method a spy returning `{ data, error }` */
export function fakeAuth(overrides = {}) {
  const ok = () => vi.fn(async () => ({ data: {}, error: null }));
  return {
    client: fakeClient(),
    status: 'anonymous',
    session: null,
    user: null,
    profile: null,
    providers: { github: false, google: false },
    isAuthenticated: false,
    refreshProfile: vi.fn(async () => {}),
    signUp: ok(),
    signIn: ok(),
    signInWithMagicLink: ok(),
    signInWithProvider: ok(),
    resetPassword: ok(),
    updatePassword: ok(),
    signOut: ok(),
    ...overrides,
  };
}

export function renderWithAuth(ui, { auth = fakeAuth(), route, path = '*' } = {}) {
  const entry = route ?? (path === '*' ? '/test' : path);
  const result = render(
    <AuthContext.Provider value={auth}>
      <ToastProvider>
        <MemoryRouter initialEntries={[entry]}>
          <Routes>
            <Route path={path} element={ui} />
            <Route path="/" element={<p>HOME PAGE</p>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </AuthContext.Provider>
  );
  return { ...result, auth };
}

// jest-dom is not installed: three tiny matchers are all these tests need
expect.extend({
  toHaveTextContent(el, text) {
    const actual = el?.textContent ?? '';
    return { pass: actual.includes(text), message: () => `expected "${actual}" to contain "${text}"` };
  },
  toHaveAttribute(el, name, value) {
    const actual = el?.getAttribute(name);
    return { pass: value === undefined ? actual !== null : actual === value, message: () => `expected attribute ${name}="${value}", got ${actual}` };
  },
  toHaveValue(el, value) {
    return { pass: el?.value === value, message: () => `expected value "${value}", got "${el?.value}"` };
  },
});
