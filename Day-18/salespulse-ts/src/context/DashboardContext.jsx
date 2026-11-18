import { createContext, useContext, useMemo, useState } from 'react';
import { api as defaultApi } from '../api/mockApi';
import { useDashboardData } from '../hooks/useDashboardData';
import { ALL, currentRows, dailyUsers, filterProducts, filterSales, filterUsers, kpis, monthlySeries } from '../lib/metrics';

/**
 * DASHBOARD CONTEXT: the filters (range, region, category), the data from the API, and everything
 * worked out from both. Every chart reads from here, so every number on the page always agrees
 * ("filters scope everything").
 *
 *   selectedRange  the period button the user pressed: 3, 6, 12 or 24 (changing it asks the API again)
 *   range          the period of the data that is ON SCREEN. It equals selectedRange once the data
 *                  arrives; while a new period loads (or fails) the old charts stay, and everything
 *                  is worked out from THEIR period, so a heading never says "12 months" over 6 months of data.
 *   region    'All' or one region     (filters in the browser: instant)
 *   category  'All' or one category   (filters in the browser: instant)
 */
const DashboardContext = createContext(null);
export const RANGES = [3, 6, 12, 24];

export function DashboardProvider({ children, api = defaultApi, initialRange = 12 }) {
  const [selectedRange, setRange] = useState(initialRange);
  const [region, setRegion] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const { data, loading, refreshing, error, retry } = useDashboardData(api, selectedRange);
  const range = data?.months ?? selectedRange;

  const value = useMemo(() => {
    const filters = { region, category };
    const rows = data ? filterSales(data.sales, filters) : []; // the period AND the one before it
    const series = monthlySeries(rows);
    const periodSeries = series.slice(-range);
    const days = Math.min(range * 31, 365);
    return {
      range, selectedRange, setRange, region, setRegion, category, setCategory,
      loading, refreshing, error, retry,
      ready: data !== null,
      rows,
      periodRows: currentRows(rows, range),
      series,
      periodSeries,
      kpi: data ? kpis(series, range) : null,
      users: data ? dailyUsers(filterUsers(data.users, { region }), days) : [],
      products: data ? filterProducts(data.products, { category }) : [],
      scores: data?.scores ?? [],
      hasFilters: region !== ALL || category !== ALL,
      reset: () => { setRegion(ALL); setCategory(ALL); },
    };
  }, [data, range, selectedRange, region, category, loading, refreshing, error, retry]);

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === null) throw new Error('useDashboard must be used inside a <DashboardProvider>.');
  return context;
}
