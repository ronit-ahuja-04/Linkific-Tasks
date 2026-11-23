import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, vi } from 'vitest';
import { AuthContext } from '../../src/auth/AuthContext';
import { ToastProvider } from '../../src/context/ToastContext';

/**
 * A tiny fake of the supabase client for the chat tests.
 *  - from(table) returns a chainable, awaitable builder that RECORDS every call: fake.calls = [{ table, ops: [[name, args]] }]
 *  - fake.reply('messages:select', result | (call) => result) decides what the builder resolves to (default { data: [], error: null })
 *  - channel(name) returns a channel that captures its handlers so a test can feed events in
 */
export function makeFakeClient() {
  const calls = [];
  const replies = {};
  const channels = [];
  const removed = [];
  const rpcCalls = [];
  const rpcReplies = {};
  const storageCalls = [];
  const storageReplies = {};

  const resolve = (call) => {
    const key = `${call.table}:${call.ops[0][0]}`;
    const reply = replies[key];
    if (typeof reply === 'function') return reply(call);
    return reply ?? { data: [], error: null };
  };

  const chain = ['select', 'insert', 'update', 'delete', 'eq', 'lt', 'is', 'ilike', 'order', 'limit'];
  const from = (table) => {
    const call = { table, ops: [] };
    calls.push(call);
    const builder = {
      single: () => { call.ops.push(['single', []]); return builder; },
      maybeSingle: () => { call.ops.push(['maybeSingle', []]); return builder; },
      then: (ok, fail) => Promise.resolve(resolve(call)).then(ok, fail),
    };
    for (const name of chain) builder[name] = (...args) => { call.ops.push([name, args]); return builder; };
    return builder;
  };

  const channel = (name, options) => {
    const ch = {
      name, options, listeners: [], subscribeCallback: null, tracked: null, sent: [], presence: {},
      on(type, filter, callback) { ch.listeners.push({ type, filter, callback }); return ch; },
      subscribe(callback) { ch.subscribeCallback = callback; callback?.('SUBSCRIBED'); return ch; },
      track: vi.fn(async (meta) => { ch.tracked = meta; return 'ok'; }),
      send: vi.fn(async (message) => { ch.sent.push(message); return 'ok'; }),
      presenceState: () => ch.presence,
      /** feed an event into the matching handlers */
      emitChange(eventType, payload) {
        ch.listeners.filter((l) => l.type === 'postgres_changes' && l.filter.event === eventType).forEach((l) => l.callback({ eventType, ...payload }));
      },
      emitBroadcast(event, payload) {
        ch.listeners.filter((l) => l.type === 'broadcast' && l.filter.event === event).forEach((l) => l.callback({ payload }));
      },
      emitPresence(state) {
        ch.presence = state;
        ch.listeners.filter((l) => l.type === 'presence').forEach((l) => l.callback());
      },
    };
    channels.push(ch);
    return ch;
  };

  const storage = {
    from: (bucket) => ({
      upload: async (...args) => { storageCalls.push({ bucket, op: 'upload', args }); return storageReplies.upload ?? { data: {}, error: null }; },
      remove: async (...args) => { storageCalls.push({ bucket, op: 'remove', args }); return { data: [], error: null }; },
      createSignedUrl: async (...args) => { storageCalls.push({ bucket, op: 'createSignedUrl', args }); return storageReplies.createSignedUrl ?? { data: { signedUrl: 'http://signed/x?token=t' }, error: null }; },
      getPublicUrl: (path) => ({ data: { publicUrl: `http://public/${path}` } }),
    }),
  };

  return {
    calls, channels, removed, rpcCalls, storageCalls,
    reply: (key, value) => { replies[key] = value; },
    replyRpc: (name, value) => { rpcReplies[name] = value; },
    replyStorage: (op, value) => { storageReplies[op] = value; },
    /** all recorded calls on a table, optionally by first operation */
    callsOn: (table, op) => calls.filter((c) => c.table === table && (!op || c.ops[0][0] === op)),
    op: (call, name) => call.ops.find((o) => o[0] === name)?.[1],
    from,
    channel,
    removeChannel: vi.fn(async (ch) => { removed.push(ch); }),
    rpc: (name, args) => { rpcCalls.push({ name, args }); const r = rpcReplies[name]; return Promise.resolve(typeof r === 'function' ? r(args) : r ?? { data: null, error: null }); },
    storage,
  };
}

export const ADA = { id: 'u-ada', email: 'ada@example.com' };

/** Render helper: auth + toasts + router, with the fake injected as useAuth().client */
export function Wrapper({ client, user = ADA, profile = { username: 'ada', full_name: 'Ada Lovelace' }, path = '/', route = '/', children }) {
  const value = { client, user, profile, status: 'authenticated', isAuthenticated: true };
  return (
    <AuthContext.Provider value={value}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes><Route path={route} element={children} /></Routes>
        </MemoryRouter>
      </ToastProvider>
    </AuthContext.Provider>
  );
}

export const room = (over = {}) => ({ id: 'r1', name: 'General', slug: 'general', topic: 'Everything', is_private: false, created_by: 'u-ada', ...over });
export const message = (id, over = {}) => ({
  id, room_id: 'r1', user_id: 'u-grace', body: `message ${id}`, attachment_id: null, created_at: `2026-11-17T10:00:${String(id).padStart(2, '0')}Z`, edited_at: null,
  author: { username: 'grace', full_name: 'Grace Hopper', avatar_path: null }, attachment: null, ...over,
});

// The project has no jest-dom, so these few matchers are defined here (used by the chat tests)
const pass = (ok, message) => ({ pass: ok, message: () => message });
expect.extend({
  toBeInTheDocument: (el) => pass(Boolean(el) && el.ownerDocument.contains(el), 'expected element to be in the document'),
  toHaveTextContent: (el, text) => pass(text instanceof RegExp ? text.test(el.textContent) : el.textContent.includes(text), `expected "${el?.textContent}" to contain ${text}`),
  toHaveFocus: (el) => pass(el.ownerDocument.activeElement === el, 'expected element to have focus'),
  toBeDisabled: (el) => pass(el.disabled === true, 'expected element to be disabled'),
  toHaveValue: (el, value) => pass(el.value === value, `expected value ${JSON.stringify(el.value)} to equal ${JSON.stringify(value)}`),
  toHaveAttribute: (el, name, value) => pass(el.hasAttribute(name) && (value === undefined || el.getAttribute(name) === value), `expected attribute ${name}=${value}, got ${el.getAttribute(name)}`),
});
