import { createSelector } from '@reduxjs/toolkit';
import { ALL, currentRows, dailyUsers, filterProducts, filterSales, filterUsers, kpis, monthlySeries } from '../lib/metrics';
import type { DashboardStatus, DashboardView } from '../types';
import type { RootState } from './index';

/**
 * SELECTORS: functions from the state to a value. Small ones read one field; `createSelector` ones combine
 * them and REMEMBER the last answer, so the heavy work (filtering rows, building the series) only runs again when
 * an input actually changed. That is what keeps the charts from recomputing when an unrelated part of the state moves.
 * Every selector is typed `(state: RootState) => X`, so a component using it needs no annotation.
 */
const selectFilters = (state: RootState) => state.filters;
const selectDashboard = (state: RootState) => state.dashboard;

export const selectSelectedRange = (state: RootState) => state.filters.selectedRange;
export const selectRegion = (state: RootState) => state.filters.region;
export const selectCategory = (state: RootState) => state.filters.category;
const selectData = (state: RootState) => state.dashboard.data;

/** The period of the data ON SCREEN: the response's own, else the one asked for */
export const selectRange = createSelector([selectData, selectSelectedRange], (data, selected) => data?.months ?? selected);

export const selectRows = createSelector([selectData, selectRegion, selectCategory], (data, region, category) =>
  data ? filterSales(data.sales, { region, category }) : [],
);
export const selectSeries = createSelector([selectRows], (rows) => monthlySeries(rows));
export const selectPeriodSeries = createSelector([selectSeries, selectRange], (series, range) => series.slice(-range));
export const selectPeriodRows = createSelector([selectRows, selectRange], (rows, range) => currentRows(rows, range));
export const selectKpi = createSelector([selectData, selectSeries, selectRange], (data, series, range) => (data ? kpis(series, range) : null));
export const selectUsers = createSelector([selectData, selectRegion, selectRange], (data, region, range) =>
  data ? dailyUsers(filterUsers(data.users, { region }), Math.min(range * 31, 365)) : [],
);
export const selectProducts = createSelector([selectData, selectCategory], (data, category) => (data ? filterProducts(data.products, { category }) : []));
export const selectScores = createSelector([selectData], (data) => data?.scores ?? []);
export const selectHasFilters = createSelector([selectRegion, selectCategory], (region, category) => region !== ALL || category !== ALL);

/**
 * The load state as ONE discriminated union instead of three booleans that could disagree.
 * (Order matters: an error beats everything; no data yet is loading; data for another period is refreshing.)
 */
export const selectStatus = createSelector([selectDashboard, selectFilters], ({ data, error }, { selectedRange }): DashboardStatus => {
  if (error) return { kind: 'error', message: error, hasData: data !== null };
  if (data === null) return { kind: 'loading' };
  if (data.months !== selectedRange) return { kind: 'refreshing', shownMonths: data.months };
  return { kind: 'ready' };
});

/** Everything in `DashboardValue` that is DATA (the actions are added by the provider) */
export const selectView = createSelector(
  [selectRange, selectSelectedRange, selectRegion, selectCategory, selectStatus, selectData, selectRows, selectPeriodRows, selectSeries, selectPeriodSeries, selectKpi, selectUsers, selectProducts, selectScores, selectHasFilters],
  (range, selectedRange, region, category, status, data, rows, periodRows, series, periodSeries, kpi, users, products, scores, hasFilters) => ({
    range, selectedRange, region, category, status,
    loading: status.kind === 'loading',
    refreshing: status.kind === 'refreshing',
    error: status.kind === 'error' ? status.message : null,
    ready: data !== null,
    rows, periodRows, series, periodSeries, kpi, users, products, scores, hasFilters,
  }) satisfies DashboardView,
);
