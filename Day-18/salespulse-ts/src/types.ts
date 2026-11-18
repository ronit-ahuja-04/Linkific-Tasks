/**
 * The domain model of SalesPulse, in one place. Everything the data layer, the API and the
 * components agree on is written down here, so a change to a row's shape is a compile error
 * everywhere it matters instead of a blank chart.
 */
import type { CATEGORIES, REGIONS } from './data/generate';

/** 'North America' | 'Europe' | 'Asia-Pacific' | 'Latin America': derived from the list of regions, so the two can never disagree */
export type Region = (typeof REGIONS)[number];
/** 'Software' | 'Hardware' | 'Services' */
export type Category = (typeof CATEGORIES)[number];

/** The filter dropdowns offer every value plus 'All' (no filter) */
export type ALL_VALUE = 'All';
export type WithAll<T extends string> = T | ALL_VALUE;

/** A month as 'YYYY-MM', a day as 'YYYY-MM-DD' (documentation: both are plain strings) */
export type MonthKey = string;
export type DayKey = string;

// ---- the four tables of the mock warehouse ----
export interface SalesRow {
  month: MonthKey;
  region: Region;
  category: Category;
  revenue: number;
  cost: number;
  orders: number;
  units: number;
}

export interface UsersRow {
  date: DayKey;
  region: Region;
  visitors: number;
  sessions: number;
  signups: number;
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  units: number;
  revenue: number;
  rating: number;
}

export interface Score {
  region: Region;
  category: Category;
  satisfaction: number;
  retention: number;
}

export interface Warehouse {
  sales: SalesRow[];
  users: UsersRow[];
  products: Product[];
  scores: Score[];
}

// ---- the (mock) API ----
export interface DashboardParams {
  /** how many months the dashboard shows */
  months: number;
}
export interface RequestOptions {
  signal?: AbortSignal;
}
/** What `fetchDashboard` answers with: the tables, plus the range that was asked for */
export interface DashboardResponse extends Warehouse {
  months: number;
}
export interface DashboardApi {
  fetchDashboard(params: DashboardParams, options?: RequestOptions): Promise<DashboardResponse>;
  /** the `months` of every request made, for tests */
  calls: number[];
}

// ---- shapes the metrics functions return (what the charts receive) ----
export interface MonthlyTotals {
  month: MonthKey;
  revenue: number;
  cost: number;
  orders: number;
  units: number;
}
export interface MonthlyPoint extends MonthlyTotals {
  label: string;
  profit: number;
  margin: number;
  average3: number;
}
export interface PeriodTotals {
  revenue: number;
  profit: number;
  orders: number;
  margin: number;
  averageOrder: number;
}
export interface KpiChange {
  revenue: number | null;
  profit: number | null;
  orders: number | null;
  /** percentage points, not a percent of a percent */
  margin: number;
  averageOrder: number | null;
}
export interface Kpis extends PeriodTotals {
  /** null when the data does not reach back far enough for a previous period */
  change: KpiChange | null;
}
/** One object per month with a number per region (or per category) */
export type MonthlyBy<N extends string> = { month: MonthKey; label: string } & Record<N, number>;
export interface Share {
  name: string;
  revenue: number;
  profit: number;
  orders: number;
  share: number;
}
export interface DailyUsers {
  date: DayKey;
  label: string;
  visitors: number;
  sessions: number;
  signups: number;
  conversion: number;
}
export type RadarAxis = 'Revenue' | 'Orders' | 'Margin' | 'Growth' | 'Satisfaction' | 'Retention';
export type RadarRow = { axis: RadarAxis } & Record<Category, number>;
export interface RadarRaw {
  category: Category;
  revenue: number;
  orders: number;
  margin: number;
  growth: number;
  satisfaction: number;
  retention: number;
}
