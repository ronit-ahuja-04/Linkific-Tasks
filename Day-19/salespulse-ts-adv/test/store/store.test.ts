import { describe, expect, expectTypeOf, it } from 'vitest';
import { createApi } from '../../src/api/mockApi';
import { setupStore, type AppDispatch, type RootState } from '../../src/store';
import { fetchDashboard } from '../../src/store/dashboardSlice';
import { filterChanged, filtersCleared, filtersPatched, initialFilters, rangeSelected } from '../../src/store/filtersSlice';
import { selectHasFilters, selectKpi, selectRows, selectSeries, selectStatus } from '../../src/store/selectors';
import type { DashboardStatus, FilterChange } from '../../src/types';
import { must } from '../helpers';

const build = (delayMs = 0, failTimes = 0) => {
  const api = createApi({ delayMs, failTimes });
  return { api, store: setupStore(api) };
};

describe('filters slice', () => {
  it('starts with no filters and the 12 month period', () => {
    const { store } = build();
    expect(store.getState().filters).toEqual({ selectedRange: 12, region: 'All', category: 'All' });
  });

  it('filterChanged sets the filter its key names, and only that one', () => {
    const { store } = build();
    store.dispatch(filterChanged({ key: 'region', value: 'Europe' }));
    expect(store.getState().filters).toMatchObject({ region: 'Europe', category: 'All' });
    store.dispatch(filterChanged({ key: 'category', value: 'Hardware' }));
    expect(store.getState().filters).toMatchObject({ region: 'Europe', category: 'Hardware' });
  });

  it('filtersPatched changes some filters and leaves the rest (an explicit undefined means leave it)', () => {
    const { store } = build();
    store.dispatch(filtersPatched({ region: 'Asia-Pacific' }));
    store.dispatch(filtersPatched({ category: 'Services', region: undefined }));
    expect(store.getState().filters).toMatchObject({ region: 'Asia-Pacific', category: 'Services' });
  });

  it('filtersCleared resets the dropdowns but keeps the period', () => {
    const { store } = build();
    store.dispatch(rangeSelected(6));
    store.dispatch(filtersPatched({ region: 'Europe', category: 'Software' }));
    store.dispatch(filtersCleared());
    expect(store.getState().filters).toEqual({ selectedRange: 6, region: 'All', category: 'All' });
    expect(selectHasFilters(store.getState())).toBe(false);
  });

  it('action types are the slice name and the case name', () => {
    expect(filterChanged.type).toBe('filters/filterChanged');
    expect(rangeSelected(3)).toEqual({ type: 'filters/rangeSelected', payload: 3 });
  });
});

describe('dashboard thunk and status', () => {
  it('goes loading, then ready, and stores the response', async () => {
    const { store } = build();
    expect(selectStatus(store.getState())).toEqual({ kind: 'loading' });
    const result = await store.dispatch(fetchDashboard({ months: 12 }));
    expect(fetchDashboard.fulfilled.match(result)).toBe(true);
    expect(selectStatus(store.getState())).toEqual({ kind: 'ready' });
    expect(store.getState().dashboard.data?.months).toBe(12);
  });

  it('a failure becomes an error status carrying the message, with the typed rejectValue', async () => {
    const { store } = build(0, 1);
    const result = await store.dispatch(fetchDashboard({ months: 12 }));
    expect(fetchDashboard.rejected.match(result)).toBe(true);
    if (fetchDashboard.rejected.match(result)) expect(result.payload).toMatchObject({ kind: 'unknown', message: expect.stringMatching(/did not respond/) });
    expect(selectStatus(store.getState())).toEqual({ kind: 'error', message: expect.stringMatching(/did not respond/), hasData: false });
  });

  it('asking for another period shows `refreshing` while the old data stays', async () => {
    const { store } = build(20);
    await store.dispatch(fetchDashboard({ months: 12 }));
    store.dispatch(rangeSelected(6));
    const pending = store.dispatch(fetchDashboard({ months: 6 }));
    expect(selectStatus(store.getState())).toEqual({ kind: 'refreshing', shownMonths: 12 });
    await pending;
    expect(selectStatus(store.getState())).toEqual({ kind: 'ready' });
  });

  it('an aborted request is not an error', async () => {
    const { store } = build(30);
    const request = store.dispatch(fetchDashboard({ months: 12 }));
    request.abort();
    await request;
    expect(store.getState().dashboard.error).toBeNull();
  });
});

describe('selectors', () => {
  it('derive the filtered rows and are memoized (same input, same object)', async () => {
    const { store } = build();
    await store.dispatch(fetchDashboard({ months: 12 }));
    const all = selectRows(store.getState());
    expect(selectRows(store.getState())).toBe(all);
    store.dispatch(filterChanged({ key: 'region', value: 'Europe' }));
    const europe = selectRows(store.getState());
    expect(europe).not.toBe(all);
    expect(europe.every((row) => row.region === 'Europe')).toBe(true);
    expect(europe.length).toBeLessThan(all.length);
  });

  it('do not recompute when an unrelated part of the state changes', async () => {
    const { store } = build();
    await store.dispatch(fetchDashboard({ months: 12 }));
    const series = selectSeries(store.getState());
    store.dispatch(rangeSelected(12)); // writes the same value: the rows and the series must be reused
    expect(selectSeries(store.getState())).toBe(series);
  });

  it('the KPI is null until data arrives', async () => {
    const { store } = build();
    expect(selectKpi(store.getState())).toBeNull();
    await store.dispatch(fetchDashboard({ months: 12 }));
    expect(must(selectKpi(store.getState())).revenue).toBeGreaterThan(0);
  });
});

describe('the types', () => {
  it('RootState is inferred from the reducers', () => {
    expectTypeOf<RootState['filters']['region']>().toEqualTypeOf<'All' | 'North America' | 'Europe' | 'Asia-Pacific' | 'Latin America'>();
    expectTypeOf<RootState['dashboard']['error']>().toEqualTypeOf<string | null>();
    expectTypeOf(initialFilters()).toEqualTypeOf<RootState['filters']>();
  });

  it('AppDispatch accepts thunks, and a thunk dispatch returns a promise you can abort', () => {
    const { store } = build();
    const dispatch: AppDispatch = store.dispatch;
    const request = dispatch(fetchDashboard({ months: 3 }));
    expectTypeOf(request.abort).toBeFunction();
    request.abort();
  });

  it('FilterChange ties each key to its own value type', () => {
    const ok: FilterChange[] = [{ key: 'region', value: 'Europe' }, { key: 'category', value: 'Software' }, { key: 'region', value: 'All' }];
    expect(ok).toHaveLength(3);
    // @ts-expect-error a category is not a region
    const bad: FilterChange = { key: 'region', value: 'Hardware' };
    expect(bad.key).toBe('region');
  });

  it('DashboardStatus narrows by `kind`', () => {
    const describeStatus = (s: DashboardStatus): string => (s.kind === 'error' ? s.message : s.kind === 'refreshing' ? `showing ${s.shownMonths}` : s.kind);
    expect(describeStatus({ kind: 'refreshing', shownMonths: 6 })).toBe('showing 6');
    // @ts-expect-error only the 'error' variant has a message
    const wrong = (s: DashboardStatus) => s.message;
    expect(typeof wrong).toBe('function');
  });
});
