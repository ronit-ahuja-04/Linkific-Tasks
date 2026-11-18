import { describe, expect, it } from 'vitest';
import { ALL_MONTHS, CATEGORIES, DAY_COUNT, FIRST_MONTH, LAST_MONTH, MONTH_COUNT, REGIONS, addMonths, generateProducts, generateSales, generateScores, generateUsers, getWarehouse, mulberry32 } from '../../src/data/generate';
import { createApi } from '../../src/api/mockApi';

describe('generated data', () => {
  it('is deterministic', () => {
    expect(generateSales()).toEqual(generateSales());
    expect(generateSales(1)).not.toEqual(generateSales(2));
    const a = mulberry32(3); const b = mulberry32(3);
    expect([a(), a()]).toEqual([b(), b()]);
  });

  it('has one sales row per month, region and category', () => {
    const sales = generateSales();
    expect(sales).toHaveLength(MONTH_COUNT * REGIONS.length * CATEGORIES.length);
    expect(new Set(sales.map((r) => `${r.month}|${r.region}|${r.category}`)).size).toBe(sales.length);
    expect(ALL_MONTHS[0]).toBe(FIRST_MONTH);
    expect(ALL_MONTHS.at(-1)).toBe(LAST_MONTH);
  });

  it('has believable numbers: positive revenue, cost below revenue, holiday peak, growth', () => {
    const sales = generateSales();
    for (const r of sales) {
      expect(r.revenue).toBeGreaterThan(0);
      expect(r.cost).toBeGreaterThan(0);
      expect(r.cost).toBeLessThan(r.revenue);
      expect(r.orders).toBeGreaterThan(0);
    }
    const monthTotal = (m) => sales.filter((r) => r.month === m).reduce((n, r) => n + r.revenue, 0);
    expect(monthTotal('2025-12')).toBeGreaterThan(monthTotal('2025-09')); // December beats September
    expect(monthTotal('2026-06')).toBeGreaterThan(monthTotal('2025-06')); // a year of growth
  });

  it('has daily users for every region, quieter on weekends', () => {
    const users = generateUsers();
    expect(users).toHaveLength(DAY_COUNT * REGIONS.length);
    const sat = users.filter((u) => new Date(`${u.date}T00:00:00Z`).getUTCDay() === 6);
    const wed = users.filter((u) => new Date(`${u.date}T00:00:00Z`).getUTCDay() === 3);
    const mean = (rows) => rows.reduce((n, r) => n + r.visitors, 0) / rows.length;
    expect(mean(sat)).toBeLessThan(mean(wed));
    users.forEach((u) => expect(u.sessions).toBeGreaterThan(u.visitors));
  });

  it('has 30 products and a score for every region and category', () => {
    const products = generateProducts();
    expect(products).toHaveLength(30);
    expect(new Set(products.map((p) => p.id)).size).toBe(30);
    products.forEach((p) => expect(p.revenue).toBe(p.price * p.units));
    expect(generateScores()).toHaveLength(REGIONS.length * CATEGORIES.length);
  });

  it('adds months across a year boundary', () => {
    expect(addMonths('2024-12', 1)).toBe('2025-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
  });

  it('builds the warehouse once', () => {
    expect(getWarehouse()).toBe(getWarehouse());
  });
});

describe('mock API', () => {
  it('returns the period and the one before it, whole days of users', async () => {
    const api = createApi({ delayMs: 0 });
    const data = await api.fetchDashboard({ months: 6 });
    expect(new Set(data.sales.map((r) => r.month)).size).toBe(12);
    expect(data.users.length % REGIONS.length).toBe(0);
    expect(data.products).toHaveLength(30);
    const all = await api.fetchDashboard({ months: 24 });
    expect(new Set(all.sales.map((r) => r.month)).size).toBe(24); // no earlier period exists
  });

  it('can fail, then recover', async () => {
    const api = createApi({ delayMs: 0, failTimes: 1 });
    await expect(api.fetchDashboard({ months: 3 })).rejects.toThrow(/did not respond/);
    await expect(api.fetchDashboard({ months: 3 })).resolves.toBeTruthy();
  });

  it('can be cancelled', async () => {
    const api = createApi({ delayMs: 1000 });
    const controller = new AbortController();
    const request = api.fetchDashboard({ months: 3 }, { signal: controller.signal });
    controller.abort();
    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
  });
});
