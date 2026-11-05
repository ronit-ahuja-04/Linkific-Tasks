import { createAction } from '@reduxjs/toolkit';

/**
 * Undo / redo as a higher-order reducer. `withHistory(rootReducer, ['tasks', 'cart'])` wraps the
 * root reducer and keeps, for each tracked slice, a stack of earlier states (`past`) and
 * undone states (`future`) under `state.history`. Slice reducers and selectors do not change:
 * undo simply swaps the slice back to a previous reference, and the persistence layer saves it.
 */
export const undo = createAction('history/undo'); // payload: slice name
export const redo = createAction('history/redo'); // payload: slice name
export const historyCleared = createAction('history/cleared'); // payload: slice name (optional)

export const HISTORY_LIMIT = 50;

const emptyEntry = () => ({ past: [], future: [] });

export const makeHistoryReducer = (tracked) => {
  const initial = Object.fromEntries(tracked.map((name) => [name, emptyEntry()]));
  // Real reducer so combineReducers accepts the `history` key; the wrapper below does the work.
  return (state = initial) => state;
};

export function withHistory(rootReducer, tracked, limit = HISTORY_LIMIT) {
  return (state, action) => {
    if (state && (undo.match(action) || redo.match(action))) {
      const name = action.payload;
      const entry = state.history?.[name];
      if (!tracked.includes(name) || !entry) return state;

      if (undo.match(action)) {
        if (entry.past.length === 0) return state;
        const previous = entry.past[entry.past.length - 1];
        return {
          ...state,
          [name]: previous,
          history: {
            ...state.history,
            [name]: { past: entry.past.slice(0, -1), future: [state[name], ...entry.future] },
          },
        };
      }
      if (entry.future.length === 0) return state;
      const [next, ...rest] = entry.future;
      return {
        ...state,
        [name]: next,
        history: {
          ...state.history,
          [name]: { past: [...entry.past, state[name]].slice(-limit), future: rest },
        },
      };
    }

    if (state && historyCleared.match(action)) {
      const names = action.payload ? [action.payload] : tracked;
      const history = { ...state.history };
      for (const name of names) if (history[name]) history[name] = emptyEntry();
      return { ...state, history };
    }

    const next = rootReducer(state, action);
    if (!state) return next;

    // Any normal action that changed a tracked slice records the previous state and drops redo
    let history = next.history;
    for (const name of tracked) {
      // `state[name] !== undefined` skips the init action: a partial preloadedState (only the
      // keys found in localStorage) makes slices appear for the first time without being a change
      if (state[name] !== undefined && next[name] !== state[name]) {
        const entry = history[name];
        history = {
          ...history,
          [name]: { past: [...entry.past, state[name]].slice(-limit), future: [] },
        };
      }
    }
    return history === next.history ? next : { ...next, history };
  };
}

export const selectCanUndo = (name) => (state) => state.history[name].past.length > 0;
export const selectCanRedo = (name) => (state) => state.history[name].future.length > 0;
