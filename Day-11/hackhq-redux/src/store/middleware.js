import { createListenerMiddleware } from '@reduxjs/toolkit';
import { evaluateBadges, previewPayload } from '../lib/badges.js';
import { badgeEarned } from './slices/badgesSlice.js';
import { activityLogged } from './slices/activitySlice.js';
import { notify } from './slices/toastsSlice.js';

/**
 * Listener middleware: run side effects in response to actions or state changes, outside the
 * reducers and outside components. Here: after every state change, check each badge condition
 * and award the ones that are newly met. `badgeEarned` is excluded so awarding cannot loop.
 */
export const badgeListener = createListenerMiddleware();

badgeListener.startListening({
  predicate: (action, currentState, previousState) =>
    currentState !== previousState && !badgeEarned.match(action),
  effect: (_action, api) => {
    const state = api.getState();
    for (const badge of evaluateBadges(state, state.badges.earned)) {
      api.dispatch(badgeEarned(badge.id));
      api.dispatch(notify(`Badge earned: ${badge.name}`, null, 'success'));
    }
  },
});

/**
 * Plain custom middleware, the (store) => (next) => (action) shape: let the action through,
 * then record a one-line summary of it in the activity feed. Bookkeeping slices are skipped so
 * the logger never logs itself.
 */
const IGNORED_PREFIXES = ['activity/', 'toasts/', 'notifications/', 'badges/'];

export const activityLogger = (api) => (next) => (action) => {
  const result = next(action);
  const type = action?.type;
  if (typeof type === 'string' && !IGNORED_PREFIXES.some((prefix) => type.startsWith(prefix))) {
    api.dispatch(
      activityLogged({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        type,
        preview: previewPayload(action.payload),
        at: Date.now(),
      })
    );
  }
  return result;
};
