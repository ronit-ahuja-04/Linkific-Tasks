import { describe, expect, it } from 'vitest';
import { ALL, currentRows, dailyUsers, filterProducts, filterSales, filterUsers, formatCompact, formatCompactMoney, formatMoney, kpis, monthLabel, monthName, monthlyBy, monthlySeries, radarData, splitPeriods, totalsBy, weeklyUsers, RADAR_AXES } from '../../src/lib/metrics';
import { CATEGORIES, REGIONS, generateProducts, generateSales, generateScores, generateUsers } from '../../src/data/generate';

const sales = generateSales();
const sum = (rows, key) => rows.reduce((n, r) => n + r[key], 0);

describe('formatting', () => {
  it('formats months, money and compact numbers', () => {
    expect(monthLabel('2026-03')).toBe('Mar 26');
    expect(monthName('2026-03')).toBe('March 2026');
    expect(formatMoney(1234567.4)).toBe('$1,234,567');
    expect(formatCompactMoney(1_500_000)).toBe('$1.5M');
    expect(formatCompactMoney(12_345)).toBe('$12.3k');
    expect(formatCompactMoney(250_000)).toBe('$250k');
    expect(formatCompactMoney(512)).toBe('$512');
    expect(formatCompact(2_300_000)).toBe('2.3M');
  });
});

describe('filters', () => {
  it('filters by region and category, ALL means no filter', () => {
    expect(filterSales(sales)).toHaveLength(sales.length);
    expect(filterSales(sales, { region: 'Europe' }).every((r) => r.region === 'Europe')).toBe(true);
    expect(filterSales(sales, { region: 'Europe', category: 'Hardware' })).toHaveLength(24);
    expect(filterUsers(generateUsers(), { region: 'Europe' }).every((u) => u.region === 'Europe')).toBe(true);
    expect(filterProducts(generateProducts(), { category: 'Services' })).toHaveLength(10);
    expect(filterProducts(generateProducts(), { category: ALL })).toHaveLength(30);
  });
});

describe('monthlySeries', () => {
  const series = monthlySeries(sales);
  it('has one oldest-first entry per month whose totals match the rows', () => {
    expect(series).toHaveLength(24);
    expect(series.map((m) => m.month)).toEqual([...series.map((m) => m.month)].sort());
    expect(sum(series, 'revenue')).toBe(sum(sales, 'revenue'));
    series.forEach((m) => expect(m.profit).toBe(m.revenue - m.cost));
  });
  it('computes a 3-month moving average (shorter at the start)', () => {
    expect(series[0].average3).toBe(series[0].revenue);
    expect(series[2].average3).toBe(Math.round((series[0].revenue + series[1].revenue + series[2].revenue) / 3));
  });
  it('handles an empty list', () => {
    expect(monthlySeries([])).toEqual([]);
  });
});

describe('periods and KPIs', () => {
  const series = monthlySeries(sales);
  it('splits the last N months and the N before', () => {
    const { current, previous } = splitPeriods(series, 6);
    expect(current).toHaveLength(6);
    expect(previous).toHaveLength(6);
    expect(current[0].month > previous.at(-1).month).toBe(true);
    expect(splitPeriods(series, 24).previous).toEqual([]);
  });
  it('computes totals and the change against the previous period', () => {
    const k = kpis(series, 12);
    const { current, previous } = splitPeriods(series, 12);
    expect(k.revenue).toBe(sum(current, 'revenue'));
    expect(k.change.revenue).toBeCloseTo(((k.revenue - sum(previous, 'revenue')) / sum(previous, 'revenue')) * 100, 0);
    expect(k.change.revenue).toBeGreaterThan(0); // the business grows
    expect(k.margin).toBeGreaterThan(30);
    expect(k.averageOrder).toBe(Math.round(k.revenue / k.orders));
  });
  it('has no change when the earlier period is missing', () => {
    expect(kpis(series, 24).change).toBeNull();
  });
});

describe('breakdowns', () => {
  it('monthlyBy has a column per region, adding up to the month total', () => {
    const rows = monthlyBy(sales, 'region');
    expect(rows).toHaveLength(24);
    for (const row of rows) expect(REGIONS.reduce((n, r) => n + row[r], 0)).toBe(sum(sales.filter((s) => s.month === row.month), 'revenue'));
    expect(monthlyBy(sales, 'category', 6)).toHaveLength(6);
    expect(Object.keys(monthlyBy(sales, 'category')[0])).toEqual(expect.arrayContaining(CATEGORIES));
  });
  it('totalsBy ranks biggest first and shares add to about 100', () => {
    const regions = totalsBy(sales, 'region');
    expect(regions.map((r) => r.revenue)).toEqual([...regions.map((r) => r.revenue)].sort((a, b) => b - a));
    expect(regions[0].name).toBe('North America');
    expect(regions.reduce((n, r) => n + r.share, 0)).toBeGreaterThan(99.8);
    expect(totalsBy(sales, 'category')[0].name).toBe('Software');
    expect(totalsBy([], 'region')).toEqual([]);
  });
  it('currentRows keeps the last N months', () => {
    expect(new Set(currentRows(sales, 3).map((r) => r.month)).size).toBe(3);
  });
});

describe('users', () => {
  const users = generateUsers();
  it('rolls up regions per day and limits to the last N days', () => {
    const daily = dailyUsers(users, 30);
    expect(daily).toHaveLength(30);
    expect(daily[0].date < daily.at(-1).date).toBe(true);
    const day = users.filter((u) => u.date === daily[0].date);
    expect(daily[0].visitors).toBe(sum(day, 'visitors'));
    expect(daily[0].conversion).toBeGreaterThan(1);
    expect(dailyUsers(users)).toHaveLength(365);
  });
  it('groups days into weeks without losing visitors', () => {
    const daily = dailyUsers(users, 28);
    const weekly = weeklyUsers(daily);
    expect(weekly).toHaveLength(4);
    expect(sum(weekly, 'visitors')).toBe(sum(daily, 'visitors'));
    expect(weeklyUsers(dailyUsers(users, 10))).toHaveLength(2); // a short last week is kept
  });
});

describe('radarData', () => {
  const scores = generateScores();
  it('returns six axes, one column per category, all inside 0 to 100', () => {
    const { data, raw } = radarData(sales, scores);
    expect(data.map((d) => d.axis)).toEqual(RADAR_AXES);
    expect(raw).toHaveLength(3);
    for (const row of data) for (const c of CATEGORIES) {
      expect(row[c]).toBeGreaterThanOrEqual(0);
      expect(row[c]).toBeLessThanOrEqual(100);
    }
    expect(data.find((d) => d.axis === 'Revenue').Software).toBe(100); // Software is the biggest category
  });
  it('can be limited to one region', () => {
    const all = radarData(sales, scores).raw;
    const europe = radarData(sales, scores, { region: 'Europe' }).raw;
    expect(europe[0].revenue).toBeLessThan(all[0].revenue);
  });
});
