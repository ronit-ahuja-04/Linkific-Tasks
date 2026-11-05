import { vi } from 'vitest';

/** Stub global fetch with a fixed response: mockFetch({ ok: true, json: {...} }) */
export function mockFetch({ ok = true, status = 200, statusText = '', json = {} } = {}) {
  const fn = vi.fn().mockResolvedValue({ ok, status, statusText, json: async () => json });
  vi.stubGlobal('fetch', fn);
  return fn;
}

export function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}
