import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { assertNever } from '../lib/exhaustive';
import { ALL } from '../lib/metrics';
import type { Range } from '../lib/ranges';
import type { FilterChange, Filters, FiltersPatch } from '../types';

/**
 * FILTERS SLICE: what the user picked (period, region, category).
 *
 * `createSlice` writes the action creators and the reducer from one object. Inside a reducer the `state` looks
 * mutable (`state.region = ...`); Immer turns that into a new immutable object. The payload of every action is
 * typed with `PayloadAction<T>`, so `filterChanged({ key: 'region', value: 'Hardware' })` is a compile error.
 */
export interface FiltersState extends Filters {
  selectedRange: Range;
}

export const initialFilters = (range: Range = 12): FiltersState => ({ selectedRange: range, region: ALL, category: ALL });

const filtersSlice = createSlice({
  name: 'filters',
  initialState: initialFilters(),
  reducers: {
    rangeSelected(state, action: PayloadAction<Range>) {
      state.selectedRange = action.payload;
    },
    /** One action for both dropdowns. `FilterChange` ties each key to its own value type; the switch narrows it. */
    filterChanged(state, action: PayloadAction<FilterChange>) {
      const change = action.payload;
      switch (change.key) {
        case 'region':
          state.region = change.value;
          break;
        case 'category':
          state.category = change.value;
          break;
        default:
          assertNever(change, 'filter change');
      }
    },
    /** `Partial<Filters>`: set several at once (an explicit `undefined` means "leave it") */
    filtersPatched(state, action: PayloadAction<FiltersPatch>) {
      const { region, category } = action.payload;
      if (region !== undefined) state.region = region;
      if (category !== undefined) state.category = category;
    },
    /** Reset the two dropdowns (the period stays: it is a different kind of choice) */
    filtersCleared(state) {
      state.region = ALL;
      state.category = ALL;
    },
  },
});

export const { rangeSelected, filterChanged, filtersPatched, filtersCleared } = filtersSlice.actions;
export const filtersReducer = filtersSlice.reducer;
