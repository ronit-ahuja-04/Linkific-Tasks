/**
 * The domain model of SalesPulse, in one place. Everything the data layer, the API and the
 * components agree on is written down here, so a change to a row's shape is a compile error
 * everywhere it matters instead of a blank chart.
 */
import type { CATEGORIES, REGIONS } from './data/generate';
import type { Range } from './lib/ranges';

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

// =====================================================================================================
// DAY 19: ADVANCED TYPES. Each one is used by the app (see the README table), none is decoration.
// =====================================================================================================

/** The two dropdown filters. Together with the period they are everything the user can change. */
export interface Filters {
  region: WithAll<Region>;
  category: WithAll<Category>;
}
export type FilterKey = keyof Filters;

/**
 * MAPPED TYPE + INDEXED ACCESS: one `{ key, value }` shape per filter, where `value` has the type of THAT filter.
 *   { key: 'region'; value: WithAll<Region> } | { key: 'category'; value: WithAll<Category> }
 * `{ key: 'region', value: 'Hardware' }` does not compile: a category is not a region. Add a field to
 * `Filters` and this union grows by itself.
 */
export type FilterChange = { [K in FilterKey]: { key: K; value: Filters[K] } }[FilterKey];

/** UTILITY TYPE `Partial`: change some filters, leave the rest */
export type FiltersPatch = Partial<Filters>;

/** UTILITY TYPES `Exclude` / `Extract`: a region with the "All" option taken out, and only the "All" option */
export type ConcreteFilterValue = Exclude<WithAll<Region>, ALL_VALUE>;
export type AllOption = Extract<WithAll<Region>, ALL_VALUE>;

/** UTILITY TYPES `Pick` / `Omit`: a product as a chart needs it, and a product as a form would create it */
export type ProductPoint = Pick<Product, 'name' | 'category' | 'revenue' | 'units'>;
export type ProductDraft = Omit<Product, 'id' | 'units' | 'revenue' | 'rating'>;

/** UTILITY TYPE `Record`: one entry per region, and the compiler checks none is missing */
export type PerRegion<V> = Record<Region, V>;

/**
 * DISCRIMINATED UNION: the whole load state of the dashboard, with a `kind` tag. Four booleans
 * (`loading`, `refreshing`, `error`, `ready`) allow 16 combinations, most of them impossible; a union allows exactly four.
 * `switch (status.kind)` narrows each branch, and `assertNever` makes the compiler check all four are handled.
 */
export type DashboardStatus =
  | { kind: 'loading' }
  | { kind: 'refreshing'; shownMonths: number }
  | { kind: 'error'; message: string; hasData: boolean }
  | { kind: 'ready' };

/** TEMPLATE LITERAL TYPE: the names of the Redux action types a slice makes, e.g. 'filters/filterChanged' */
export type SliceActionType<Slice extends string, Name extends string> = `${Slice}/${Name}`;

/** DEEP READONLY (a recursive mapped type): handed to code that must read the warehouse but never change it */
export type DeepReadonly<T> = T extends (infer Item)[]
  ? readonly DeepReadonly<Item>[]
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

/** Everything a chart can read from the dashboard (the context's value) */
export interface DashboardValue {
  range: number;
  selectedRange: Range;
  setRange: (range: Range) => void;
  region: WithAll<Region>;
  setRegion: (region: WithAll<Region>) => void;
  category: WithAll<Category>;
  setCategory: (category: WithAll<Category>) => void;
  status: DashboardStatus;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  retry: () => void;
  ready: boolean;
  rows: SalesRow[];
  periodRows: SalesRow[];
  series: MonthlyPoint[];
  periodSeries: MonthlyPoint[];
  kpi: Kpis | null;
  users: DailyUsers[];
  products: readonly Product[];
  scores: readonly Score[];
  hasFilters: boolean;
  reset: () => void;
}
/** UTILITY TYPES `Pick` / `Omit` / `keyof`: the value splits into the functions (actions) and the data (view), with no duplicated list */
export type DashboardActions = Pick<DashboardValue, 'setRange' | 'setRegion' | 'setCategory' | 'retry' | 'reset'>;
export type DashboardView = Omit<DashboardValue, keyof DashboardActions>;
