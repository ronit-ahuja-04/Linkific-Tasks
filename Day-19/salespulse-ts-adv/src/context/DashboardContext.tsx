import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { api as defaultApi } from '../api/mockApi';
import { createStrictContext } from '../lib/createStrictContext';
import { RANGES, type Range } from '../lib/ranges';
import { setupStore } from '../store';
import { fetchDashboard } from '../store/dashboardSlice';
import { filterChanged, filtersCleared, initialFilters, rangeSelected } from '../store/filtersSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectSelectedRange, selectView } from '../store/selectors';
import type { DashboardActions, DashboardApi, DashboardValue } from '../types';

/**
 * DASHBOARD CONTEXT, now a thin window onto a Redux store.
 *
 * Day 18 kept the filters and the fetched data in React state inside this provider. Day 19 moves them into a Redux
 * Toolkit store (src/store/), where each piece is typed on its own: slices, a thunk, memoized selectors.
 * This provider is the BRIDGE: it creates the store, runs the fetch, and publishes the same `DashboardValue` as before,
 * so none of the screens had to change. (Theme and toasts stay in Context: they are UI chrome, not shared data.)
 */
export { RANGES };
export type { Range, DashboardValue };

const [DashboardContext, useDashboard] = createStrictContext<DashboardValue>('useDashboard', 'DashboardProvider');
export { useDashboard };

interface DashboardProviderProps {
  children: ReactNode;
  api?: DashboardApi;
  initialRange?: Range;
}

export function DashboardProvider({ children, api = defaultApi, initialRange = 12 }: DashboardProviderProps) {
  // one store per provider (and per API): tests and the app never share state by accident
  const store = useMemo(() => setupStore(api, { filters: initialFilters(initialRange) }), [api, initialRange]);
  return (
    <Provider store={store}>
      <DashboardBridge>{children}</DashboardBridge>
    </Provider>
  );
}

function DashboardBridge({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const months = useAppSelector(selectSelectedRange);
  const view = useAppSelector(selectView);
  const [attempt, setAttempt] = useState(0);

  // Ask the API whenever the period changes (or on retry). Returning `abort` cancels a request that is no longer wanted.
  useEffect(() => {
    const request = dispatch(fetchDashboard({ months }));
    return () => request.abort();
  }, [dispatch, months, attempt]);

  const actions = useMemo(
    (): DashboardActions => ({
      setRange: (range) => dispatch(rangeSelected(range)),
      setRegion: (value) => dispatch(filterChanged({ key: 'region', value })),
      setCategory: (value) => dispatch(filterChanged({ key: 'category', value })),
      retry: () => setAttempt((n) => n + 1),
      reset: () => dispatch(filtersCleared()),
    }),
    [dispatch],
  );
  const value = useMemo((): DashboardValue => ({ ...view, ...actions }), [view, actions]);
  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}
