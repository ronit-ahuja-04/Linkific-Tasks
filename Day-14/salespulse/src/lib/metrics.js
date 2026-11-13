import { CATEGORIES, REGIONS } from '../data/generate';

/**
 * Pure functions that turn the raw tables into exactly the shape each chart wants.
 * Recharts needs an array of flat objects: [{ label: 'Jan 26', revenue: 120000, ... }, ...].
 * Doing that reshaping here (not in the components) keeps it testable and the charts simple.
 */
export const ALL = 'All';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** '2026-03' -> 'Mar 26' */
export const monthLabel = (month) => `${MONTH_NAMES[Number(month.slice(5)) - 1]} ${month.slice(2, 4)}`;
/** '2026-03' -> 'March 2026' */
export const monthName = (month) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
/** '2026-03-09' -> 'Mar 9' */
export const dayLabel = (date) => `${MONTH_NAMES[Number(date.slice(5, 7)) - 1]} ${Number(date.slice(8))}`;

const round = (n, digits = 0) => Math.round(n * 10 ** digits) / 10 ** digits;
const sum = (rows, key) => rows.reduce((total, row) => total + row[key], 0);

/** Number formats shared by every chart, axis and tooltip */
export const formatMoney = (n) => `$${Math.round(n).toLocaleString('en-US')}`;
export const formatCompactMoney = (n) =>
  n >= 1e6 ? `$${round(n / 1e6, 2)}M` : n >= 1e3 ? `$${round(n / 1e3, n >= 1e5 ? 0 : 1)}k` : `$${Math.round(n)}`;
export const formatCompact = (n) => (n >= 1e6 ? `${round(n / 1e6, 2)}M` : n >= 1e3 ? `${round(n / 1e3, n >= 1e5 ? 0 : 1)}k` : String(Math.round(n)));
export const formatPercent = (n, digits = 1) => `${round(n, digits)}%`;

/** Region and category filters. ALL means no filter. */
export function filterSales(rows, { region = ALL, category = ALL } = {}) {
  return rows.filter((r) => (region === ALL || r.region === region) && (category === ALL || r.category === category));
}
export const filterUsers = (rows, { region = ALL } = {}) => (region === ALL ? rows : rows.filter((r) => r.region === region));

/** Revenue, cost, profit, orders per month, oldest first, plus a 3-month moving average of revenue */
export function monthlySeries(rows) {
  const byMonth = new Map();
  for (const row of rows) {
    const entry = byMonth.get(row.month) ?? { month: row.month, revenue: 0, cost: 0, orders: 0, units: 0 };
    entry.revenue += row.revenue;
    entry.cost += row.cost;
    entry.orders += row.orders;
    entry.units += row.units;
    byMonth.set(row.month, entry);
  }
  const series = [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
  return series.map((m, i) => {
    const window = series.slice(Math.max(0, i - 2), i + 1);
    return {
      ...m,
      label: monthLabel(m.month),
      profit: m.revenue - m.cost,
      margin: m.revenue ? round(((m.revenue - m.cost) / m.revenue) * 100, 1) : 0,
      average3: Math.round(sum(window, 'revenue') / window.length),
    };
  });
}

/** The last `months` of a series, and the `months` before them (empty when the data does not reach back that far) */
export function splitPeriods(series, months) {
  const current = series.slice(-months);
  const previous = series.length >= months * 2 ? series.slice(-months * 2, -months) : [];
  return { current, previous };
}

const change = (now, before) => (before ? round(((now - before) / before) * 100, 1) : null);

/** Headline numbers for the selected period, with the change against the period before it (null when there is none) */
export function kpis(series, months) {
  const { current, previous } = splitPeriods(series, months);
  const totals = (list) => {
    const revenue = sum(list, 'revenue');
    const profit = sum(list, 'profit');
    const orders = sum(list, 'orders');
    return { revenue, profit, orders, margin: revenue ? round((profit / revenue) * 100, 1) : 0, averageOrder: orders ? Math.round(revenue / orders) : 0 };
  };
  const now = totals(current);
  if (previous.length === 0) return { ...now, change: null };
  const before = totals(previous);
  return {
    ...now,
    change: {
      revenue: change(now.revenue, before.revenue),
      profit: change(now.profit, before.profit),
      orders: change(now.orders, before.orders),
      margin: round(now.margin - before.margin, 1), // percentage points
      averageOrder: change(now.averageOrder, before.averageOrder),
    },
  };
}

/** One object per month with a column per region (or category): the shape a stacked or grouped bar chart wants */
export function monthlyBy(rows, key, months) {
  const names = key === 'region' ? REGIONS : CATEGORIES;
  const byMonth = new Map();
  for (const row of rows) {
    const entry = byMonth.get(row.month) ?? { month: row.month, label: monthLabel(row.month), ...Object.fromEntries(names.map((n) => [n, 0])) };
    entry[row[key]] += row.revenue;
    byMonth.set(row.month, entry);
  }
  const list = [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
  return months ? list.slice(-months) : list;
}

/** Totals per region or category for the period, biggest first, with each one's share of the whole */
export function totalsBy(rows, key) {
  const names = key === 'region' ? REGIONS : CATEGORIES;
  const total = sum(rows, 'revenue');
  return names
    .map((name) => {
      const part = rows.filter((r) => r[key] === name);
      const revenue = sum(part, 'revenue');
      const profit = revenue - sum(part, 'cost');
      return { name, revenue, profit, orders: sum(part, 'orders'), share: total ? round((revenue / total) * 100, 1) : 0 };
    })
    .filter((r) => r.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);
}

/** Sales rows of only the selected period (the last `months`) */
export function currentRows(rows, months) {
  const keep = new Set([...new Set(rows.map((r) => r.month))].sort().slice(-months));
  return rows.filter((r) => keep.has(r.month));
}

/** Daily totals across the chosen regions, oldest first, limited to the last `days` days */
export function dailyUsers(rows, days) {
  const byDate = new Map();
  for (const row of rows) {
    const entry = byDate.get(row.date) ?? { date: row.date, visitors: 0, sessions: 0, signups: 0 };
    entry.visitors += row.visitors;
    entry.sessions += row.sessions;
    entry.signups += row.signups;
    byDate.set(row.date, entry);
  }
  const list = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  return (days ? list.slice(-days) : list).map((d) => ({
    ...d,
    label: dayLabel(d.date),
    conversion: d.visitors ? round((d.signups / d.visitors) * 100, 2) : 0,
  }));
}

/** Smooth a daily series into weekly totals (Monday to Sunday blocks of 7 days from the start) */
export function weeklyUsers(daily) {
  const weeks = [];
  for (let i = 0; i < daily.length; i += 7) {
    const block = daily.slice(i, i + 7);
    weeks.push({
      date: block[0].date,
      label: dayLabel(block[0].date),
      visitors: sum(block, 'visitors'),
      sessions: sum(block, 'sessions'),
      signups: sum(block, 'signups'),
      conversion: sum(block, 'visitors') ? round((sum(block, 'signups') / sum(block, 'visitors')) * 100, 2) : 0,
    });
  }
  return weeks;
}

/** Products for the scatter chart, optionally for one category */
export const filterProducts = (products, { category = ALL } = {}) => (category === ALL ? products : products.filter((p) => p.category === category));

export const RADAR_AXES = ['Revenue', 'Orders', 'Margin', 'Growth', 'Satisfaction', 'Retention'];

/**
 * Radar data: how each CATEGORY scores on six measures, every measure scaled to 0 to 100 so they
 * can share one set of spokes. Revenue and Orders: percent of the best category. Margin: the profit
 * margin itself, from 0 to 100. Growth: second half of the period against the first half, mapped so
 * 0% growth sits at 50 (each +1% adds 2.5 points). Satisfaction and Retention: the survey scores as they are.
 * Returns rows like { axis: 'Revenue', Software: 100, Hardware: 64, Services: 41 } and the raw numbers per category.
 */
export function radarData(rows, scores, { region = ALL } = {}) {
  const raw = CATEGORIES.map((category) => {
    const part = rows.filter((r) => r.category === category && (region === ALL || r.region === region));
    const months = [...new Set(part.map((r) => r.month))].sort();
    const half = Math.floor(months.length / 2);
    const early = new Set(months.slice(0, half));
    const late = new Set(months.slice(half));
    const earlyRevenue = sum(part.filter((r) => early.has(r.month)), 'revenue');
    const lateRevenue = sum(part.filter((r) => late.has(r.month)), 'revenue');
    const revenue = sum(part, 'revenue');
    const mine = scores.filter((s) => s.category === category && (region === ALL || s.region === region));
    const average = (key) => (mine.length ? sum(mine, key) / mine.length : 0);
    return {
      category,
      revenue,
      orders: sum(part, 'orders'),
      margin: revenue ? round(((revenue - sum(part, 'cost')) / revenue) * 100, 1) : 0,
      growth: earlyRevenue ? round(((lateRevenue - earlyRevenue) / earlyRevenue) * 100, 1) : 0,
      satisfaction: round(average('satisfaction'), 1),
      retention: round(average('retention'), 1),
    };
  });
  const best = (key) => Math.max(...raw.map((r) => r[key]), 1);
  const clamp = (n) => Math.max(0, Math.min(100, n));
  const scaled = {
    Revenue: (r) => (r.revenue / best('revenue')) * 100,
    Orders: (r) => (r.orders / best('orders')) * 100,
    Margin: (r) => r.margin,
    Growth: (r) => 50 + r.growth * 2.5,
    Satisfaction: (r) => r.satisfaction,
    Retention: (r) => r.retention,
  };
  const data = RADAR_AXES.map((axis) => ({ axis, ...Object.fromEntries(raw.map((r) => [r.category, round(clamp(scaled[axis](r)))])) }));
  return { data, raw };
}
