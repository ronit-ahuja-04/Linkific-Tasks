import { vi } from 'vitest';

/** A chainable fake of the supabase query builder: every method returns the builder, awaiting it gives `result`. */
export function builder(result, log, table) {
  const calls = [];
  const b = new Proxy({}, {
    get(_t, prop) {
      if (prop === 'then') return (res, rej) => Promise.resolve(result).then(res, rej);
      if (prop === 'calls') return calls;
      return (...args) => { calls.push([prop, ...args]); log?.push({ table, method: prop, args }); return b; };
    },
  });
  return b;
}

/**
 * Fake client. `tables` maps a table name to a result ({data,error}) or a function returning one per call.
 * `bucket` holds the storage fakes; `rpcs` maps rpc names to results.
 */
export function makeClient({ tables = {}, rpcs = {}, bucket = {} } = {}) {
  const log = [];
  const storageBucket = {
    upload: vi.fn(async () => ({ data: {}, error: null })),
    remove: vi.fn(async () => ({ data: [], error: null })),
    download: vi.fn(async () => ({ data: new Blob(['x']), error: null })),
    createSignedUrl: vi.fn(async (path, s) => ({ data: { signedUrl: `http://x/sign/${path}?t=${s}` }, error: null })),
    createSignedUrls: vi.fn(async (paths) => ({ data: paths.map((path) => ({ path, signedUrl: `http://x/sign/${path}`, error: null })), error: null })),
    getPublicUrl: vi.fn((path) => ({ data: { publicUrl: `http://x/public/${path}` } })),
    ...bucket,
  };
  const client = {
    log,
    storageBucket,
    from: vi.fn((table) => {
      const r = tables[table] ?? { data: [], error: null };
      return builder(typeof r === 'function' ? r() : r, log, table);
    }),
    rpc: vi.fn((name) => Promise.resolve(rpcs[name] ?? { data: null, error: null })),
    storage: { from: vi.fn(() => storageBucket) },
  };
  return client;
}
