import { combineReducers, configureStore } from '@reduxjs/toolkit';
import type { DashboardApi } from '../types';
import { dashboardReducer, type ThunkExtra } from './dashboardSlice';
import { filtersReducer } from './filtersSlice';

/**
 * THE STORE. The three exported types below are the point of this file:
 *
 *   RootState   the whole state tree, INFERRED from the reducers (never written by hand, so it can not go stale)
 *   AppStore    the store object
 *   AppDispatch the dispatch function INCLUDING the thunk overload, so `dispatch(fetchDashboard(...))` type-checks
 *
 * The store is built by a function (not a module-level singleton) so each test, and each provider, gets its own.
 */
const rootReducer = combineReducers({ filters: filtersReducer, dashboard: dashboardReducer });

export function setupStore(api: DashboardApi, preloadedState?: Partial<RootState>) {
  const extra: ThunkExtra = { api };
  return configureStore({
    reducer: rootReducer,
    ...(preloadedState ? { preloadedState } : {}),
    middleware: (getDefault) => getDefault({ thunk: { extraArgument: extra }, immutableCheck: false, serializableCheck: false }),
  });
}

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore['dispatch'];
