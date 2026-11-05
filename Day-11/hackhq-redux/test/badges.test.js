import { describe, it, expect, vi, afterEach } from 'vitest';
import { makeStore } from '../src/store/index.js';
import { BADGES, evaluateBadges, previewPayload } from '../src/lib/badges.js';
import { selectEarnedBadges, badgesReset } from '../src/store/slices/badgesSlice.js';
import { activityCleared, selectActivity } from '../src/store/slices/activitySlice.js';
import { selectNotifications } from '../src/store/slices/notificationsSlice.js';
import { wishlistToggled } from '../src/store/slices/wishlistSlice.js';
import { addItem, changeQuantity } from '../src/store/slices/cartSlice.js';
import { addTask, toggleTask, selectTasks } from '../src/store/slices/tasksSlice.js';
import { sessionToggled } from '../src/store/slices/scheduleSlice.js';
import { lapAdded } from '../src/store/slices/lapsSlice.js';
import { login } from '../src/store/slices/authSlice.js';

afterEach(() => vi.useRealTimers());

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('badge rules (src/lib/badges.js)', () => {
  it('has unique ids and a check function for every badge', () => {
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length);
    BADGES.forEach((b) => expect(typeof b.check).toBe('function'));
  });

  it('awards nothing for an empty state and skips already-earned badges', () => {
    const state = makeStore({ tasks: { items: [] } }).getState();
    expect(evaluateBadges(state, {})).toEqual([]);
    const withSave = makeStore({
      tasks: { items: [] },
      wishlist: { ids: ['swag-tee'] },
    }).getState();
    expect(evaluateBadges(withSave, {}).map((b) => b.id)).toEqual(['first-save']);
    expect(evaluateBadges(withSave, { 'first-save': 1 })).toEqual([]);
  });

  it('previews payloads safely', () => {
    expect(previewPayload(undefined)).toBe('');
    expect(previewPayload('abc')).toBe('abc');
    expect(previewPayload({ a: 1 })).toBe('{"a":1}');
    expect(previewPayload('x'.repeat(200)).length).toBe(70);
    const circular = {};
    circular.self = circular;
    expect(previewPayload(circular)).toBe('');
  });
});

describe('listener middleware awards badges', () => {
  const store0 = () => makeStore({ tasks: { items: [] } });

  it('awards a badge once, with a toast and a notification', async () => {
    vi.useFakeTimers();
    const store = store0();
    store.dispatch(wishlistToggled('swag-tee'));
    await vi.advanceTimersByTimeAsync(0);
    expect(Object.keys(selectEarnedBadges(store.getState()))).toEqual(['first-save']);
    expect(selectNotifications(store.getState())[0].message).toContain('Wish upon a star');

    store.dispatch(wishlistToggled('swag-hoodie'));
    await vi.advanceTimersByTimeAsync(0);
    expect(Object.keys(selectEarnedBadges(store.getState()))).toEqual(['first-save']);
  });

  it('awards the cart, schedule, laps and organizer badges', async () => {
    vi.useFakeTimers();
    const store = store0();
    store.dispatch(addItem('swag-tee'));
    store.dispatch(changeQuantity({ productId: 'swag-tee', delta: 4 }));
    ['s1', 's2', 's3'].forEach((id) => store.dispatch(sessionToggled(id)));
    [1, 2, 3].forEach((n) => store.dispatch(lapAdded({ id: n, ms: n })));
    store.dispatch(login());
    await vi.advanceTimersByTimeAsync(0);
    expect(Object.keys(selectEarnedBadges(store.getState())).sort()).toEqual(
      ['backstage', 'collector', 'planner', 'time-keeper'].sort()
    );
  });

  it('awards "Mission complete" when every task is done', async () => {
    vi.useFakeTimers();
    const store = store0();
    ['a', 'b', 'c'].forEach((t) => store.dispatch(addTask(t)));
    selectTasks(store.getState()).forEach((t) => store.dispatch(toggleTask(t.id)));
    await vi.advanceTimersByTimeAsync(0);
    expect(selectEarnedBadges(store.getState()).finisher).toBeTypeOf('number');
  });

  it('can be reset (badges whose condition no longer holds stay gone)', async () => {
    vi.useFakeTimers();
    const store = store0();
    store.dispatch(wishlistToggled('swag-tee'));
    await vi.advanceTimersByTimeAsync(0);
    expect(Object.keys(selectEarnedBadges(store.getState()))).toEqual(['first-save']);
    store.dispatch(wishlistToggled('swag-tee'));
    store.dispatch(badgesReset());
    await vi.advanceTimersByTimeAsync(0);
    expect(selectEarnedBadges(store.getState())).toEqual({});
  });
});

describe('activity logger middleware', () => {
  it('logs actions with a payload preview, newest first', () => {
    const store = makeStore({ tasks: { items: [] } });
    store.dispatch(addItem('swag-tee'));
    store.dispatch(sessionToggled('s1'));
    const [latest, previous] = selectActivity(store.getState());
    expect(latest).toMatchObject({ type: 'schedule/sessionToggled', preview: 's1' });
    expect(previous).toMatchObject({ type: 'cart/addItem', preview: 'swag-tee' });
  });

  it('does not log its own bookkeeping actions', () => {
    vi.useFakeTimers();
    const store = makeStore();
    store.dispatch(activityCleared());
    expect(selectActivity(store.getState())).toEqual([]);
    store.dispatch({ type: 'toasts/toastAdded', payload: { id: 'x' } });
    store.dispatch({ type: 'notifications/notificationRead', payload: 'x' });
    expect(selectActivity(store.getState())).toEqual([]);
  });

  it('caps the feed at 100 entries', () => {
    const store = makeStore();
    for (let i = 0; i < 120; i++) store.dispatch(lapAdded({ id: i, ms: i }));
    expect(selectActivity(store.getState())).toHaveLength(100);
  });
});
