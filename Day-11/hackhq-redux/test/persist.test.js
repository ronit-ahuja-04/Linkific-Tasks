import { describe, it, expect, vi, afterEach } from 'vitest';
import { makeStore } from '../src/store/index.js';
import { loadPersistedState, startPersisting } from '../src/store/persist.js';
import { addItem } from '../src/store/slices/cartSlice.js';
import { login } from '../src/store/slices/authSlice.js';
import { toggleTheme } from '../src/store/slices/themeSlice.js';
import { markSeen } from '../src/store/slices/announcementsSlice.js';

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}
const stubWindow = (storage) => vi.stubGlobal('window', { localStorage: storage });

afterEach(() => vi.unstubAllGlobals());

describe('localStorage persistence (src/store/persist.js)', () => {
  it('loads existing browser data written by the old useLocalStorage hooks', () => {
    stubWindow(
      fakeStorage({
        hackhq_theme: JSON.stringify('dark'),
        hackhq_organizer: JSON.stringify(true),
        hackhq_cart: JSON.stringify([{ productId: 'p1', quantity: 2 }]),
        hackhq_schedule_saved: JSON.stringify(['s1']),
        hackhq_wishlist: JSON.stringify(['swag-tee']),
      })
    );
    const state = makeStore(loadPersistedState()).getState();
    expect(state.theme.mode).toBe('dark');
    expect(state.auth.isOrganizer).toBe(true);
    expect(state.cart.items).toEqual([{ productId: 'p1', quantity: 2 }]);
    expect(state.schedule.savedIds).toEqual(['s1']);
    expect(state.wishlist.ids).toEqual(['swag-tee']);
  });

  it('falls back to defaults on corrupt or wrong-shaped data', () => {
    stubWindow(fakeStorage({ hackhq_cart: '{not json', hackhq_laps: JSON.stringify({ nope: 1 }) }));
    const state = makeStore(loadPersistedState()).getState();
    expect(state.cart.items).toEqual([]);
    expect(state.laps.items).toEqual([]);
  });

  it('writes only the slices that changed, under the original keys', () => {
    const storage = fakeStorage();
    stubWindow(storage);
    const store = makeStore(loadPersistedState());
    startPersisting(store);

    store.dispatch(addItem('p1'));
    expect(JSON.parse(storage.data.hackhq_cart)).toEqual([{ productId: 'p1', quantity: 1 }]);
    expect(storage.data.hackhq_organizer).toBeUndefined();

    store.dispatch(login());
    expect(JSON.parse(storage.data.hackhq_organizer)).toBe(true);
    store.dispatch(toggleTheme());
    expect(['dark', 'light']).toContain(JSON.parse(storage.data.hackhq_theme));
    store.dispatch(markSeen());
    expect(typeof JSON.parse(storage.data.hackhq_announcements_seen)).toBe('number');
  });
});
