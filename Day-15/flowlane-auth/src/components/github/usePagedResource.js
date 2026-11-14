import { useCallback, useEffect, useReducer, useRef } from 'react';

/**
 * Loads page 1 of a list whenever `load` changes (a new search, a new repository) and more pages
 * on demand. `load(page)` must resolve to `{ items, hasMore }`.
 *
 * Nothing sets state synchronously in the effect: "loading" is DERIVED ("the data we hold was not
 * produced by the current `load`"), so there is no flash of stale rows and no extra render.
 */
const empty = { source: null, attempt: -1, items: [], page: 1, hasMore: false, error: null, moreLoading: false, moreError: null };

function reducer(state, action) {
  // Answers about an older list (the user already searched again) are ignored
  if (action.type.startsWith('more') && action.source !== state.source) return state;
  switch (action.type) {
    case 'loaded':
      return { ...empty, source: action.source, attempt: action.attempt, items: action.items, hasMore: action.hasMore };
    case 'failed':
      return { ...empty, source: action.source, attempt: action.attempt, error: action.error };
    case 'moreStart':
      return { ...state, moreLoading: true, moreError: null };
    case 'moreLoaded': {
      const seen = new Set(state.items.map((item) => item.id));
      const added = action.items.filter((item) => !seen.has(item.id));
      return { ...state, items: [...state.items, ...added], page: state.page + 1, hasMore: action.hasMore, moreLoading: false };
    }
    case 'moreFailed':
      return { ...state, moreLoading: false, moreError: action.error };
    default:
      return state;
  }
}

export function usePagedResource({ enabled, load }) {
  const [state, dispatch] = useReducer(reducer, empty);
  const [attempt, bump] = useReducer((n) => n + 1, 0);

  // The newest request wins. Note we do NOT cancel when `enabled` turns false: if GitHub rejects the
  // token, the client forgets it (enabled -> false) and THEN the error arrives; the wizard needs
  // that error to say "reconnect". Only a newer request (other `load`/`attempt`) makes an answer stale.
  const latest = useRef(null);
  useEffect(() => {
    if (!enabled) return;
    latest.current = { load, attempt };
    const current = () => latest.current?.load === load && latest.current.attempt === attempt;
    load(1).then(
      (result) => {
        if (current()) dispatch({ type: 'loaded', source: load, attempt, items: result.items, hasMore: result.hasMore });
      },
      (error) => {
        if (current()) dispatch({ type: 'failed', source: load, attempt, error });
      }
    );
  }, [enabled, load, attempt]);

  const fresh = state.source === load && state.attempt === attempt;

  const loadMore = useCallback(() => {
    if (!fresh || !state.hasMore || state.moreLoading) return;
    dispatch({ type: 'moreStart', source: load });
    load(state.page + 1).then(
      (result) => dispatch({ type: 'moreLoaded', source: load, items: result.items, hasMore: result.hasMore }),
      (error) => dispatch({ type: 'moreFailed', source: load, error })
    );
  }, [fresh, state.hasMore, state.moreLoading, state.page, load]);

  return {
    items: fresh ? state.items : [],
    hasMore: fresh && state.hasMore,
    loading: enabled && !fresh,
    error: fresh ? state.error : null,
    moreLoading: fresh && state.moreLoading,
    moreError: fresh ? state.moreError : null,
    loadMore,
    retry: bump,
  };
}
