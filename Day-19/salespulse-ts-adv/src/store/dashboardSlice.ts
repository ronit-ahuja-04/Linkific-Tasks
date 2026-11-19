import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { toFailure, type ApiFailure } from '../api/errors';
import type { DashboardApi, DashboardParams, DashboardResponse } from '../types';

/**
 * DASHBOARD SLICE: the data from the API and the state of the request that fetches it.
 *
 *   data             the last response that arrived (kept while the next one loads), or null
 *   requestedMonths  the period asked for last (null before the first request)
 *   error            the message of a failed request for the CURRENT period, else null
 *
 * Same three facts as Day 18's hook; `loading`, `refreshing` and the status are WORKED OUT from them (see selectors.ts).
 */
export interface DashboardState {
  data: DashboardResponse | null;
  requestedMonths: number | null;
  error: string | null;
}

/** The "extra argument" given to every thunk: the API is injected here, so tests can pass a fake one */
export interface ThunkExtra {
  api: DashboardApi;
}

/**
 * A typed async thunk. Its generics read: `createAsyncThunk<Returned, Argument, { extra, rejectValue }>`.
 *   Returned     DashboardResponse     what `fulfilled.payload` is
 *   Argument     DashboardParams       what you pass when you dispatch it: fetchDashboard({ months: 6 })
 *   rejectValue  ApiFailure            what `rejected.payload` is (a plain object, not an Error instance)
 * `signal` is the AbortSignal: calling `.abort()` on the dispatched promise cancels the request.
 */
export const fetchDashboard = createAsyncThunk<DashboardResponse, DashboardParams, { extra: ThunkExtra; rejectValue: ApiFailure }>(
  'dashboard/fetch',
  async (params, { extra, signal, rejectWithValue }) => {
    try {
      // read `extra.api.fetchDashboard` at call time (not captured earlier), so replacing it later works
      return await extra.api.fetchDashboard(params, { signal });
    } catch (reason: unknown) {
      return rejectWithValue(toFailure(reason));
    }
  },
);

const initialState: DashboardState = { data: null, requestedMonths: null, error: null };

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state, action) => {
        state.requestedMonths = action.meta.arg.months;
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.data = action.payload;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        if (action.meta.aborted) return; // a newer request (or unmount) cancelled this one: not an error
        state.error = action.payload?.message ?? action.error.message ?? 'Something went wrong. Try again.';
      });
  },
});

export const dashboardReducer = dashboardSlice.reducer;
