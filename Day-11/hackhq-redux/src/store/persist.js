// Persist chosen slices to localStorage under the same keys the app has used since Day 4,
// so existing browser data keeps working after the move to Redux.
const MAP = [
  // [sliceName, storageKey, toStored, fromStored]
  ['theme', 'hackhq_theme', (s) => s.mode, (v) => ({ mode: v === 'dark' ? 'dark' : 'light' })],
  ['auth', 'hackhq_organizer', (s) => s.isOrganizer, (v) => ({ isOrganizer: v === true })],
  ['cart', 'hackhq_cart', (s) => s.items, (v) => ({ items: v })],
  ['tasks', 'hackhq_tasks', (s) => s.items, (v) => ({ items: v })],
  ['laps', 'hackhq_laps', (s) => s.items, (v) => ({ items: v })],
  ['schedule', 'hackhq_schedule_saved', (s) => s.savedIds, (v) => ({ savedIds: v })],
];
const ANNOUNCEMENTS_KEY = 'hackhq_announcements';
const ANNOUNCEMENTS_SEEN_KEY = 'hackhq_announcements_seen';

const read = (key) => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined; // corrupt JSON or storage blocked: fall back to the slice default
  }
};
const write = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: ignore */
  }
};

const isValid = (slice, value) => {
  if (value === undefined || value === null) return false;
  if (['cart', 'tasks', 'laps', 'schedule'].includes(slice)) return Array.isArray(value);
  return true;
};

/** Build the `preloadedState` object for configureStore */
export function loadPersistedState() {
  if (typeof window === 'undefined') return undefined;
  const preloaded = {};
  for (const [slice, key, , fromStored] of MAP) {
    const value = read(key);
    if (isValid(slice, value)) preloaded[slice] = fromStored(value);
  }
  const changes = read(ANNOUNCEMENTS_KEY);
  const seenAt = read(ANNOUNCEMENTS_SEEN_KEY);
  if (changes || seenAt) {
    preloaded.announcements = {
      changes: changes ?? { added: [], edited: {}, removed: [] },
      seenAt: seenAt ?? null,
    };
  }
  return preloaded;
}

/** Subscribe to the store and write only the slices whose reference changed */
export function startPersisting(store) {
  if (typeof window === 'undefined') return () => {};
  let prev = store.getState();
  return store.subscribe(() => {
    const next = store.getState();
    for (const [slice, key, toStored] of MAP) {
      if (next[slice] !== prev[slice]) write(key, toStored(next[slice]));
    }
    if (next.announcements !== prev.announcements) {
      write(ANNOUNCEMENTS_KEY, next.announcements.changes);
      write(ANNOUNCEMENTS_SEEN_KEY, next.announcements.seenAt);
    }
    prev = next;
  });
}
