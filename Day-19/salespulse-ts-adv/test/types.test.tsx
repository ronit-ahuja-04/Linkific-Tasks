// @vitest-environment jsdom
/**
 * Mistakes the types must reject. A line preceded by the ts-expect-error comment is code that must NOT compile:
 * if the compiler stops complaining about one, `npm run typecheck` fails ("Unused directive").
 * `npm run errors` removes those comments and records what the compiler really says (see compile-errors.md).
 * The first test shows the correct versions of the same calls working, so these are not just "everything is broken".
 */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createApi } from '../src/api/mockApi';
import { generateSales } from '../src/data/generate';
import { filterSales, kpis, monthlyBy, monthlySeries } from '../src/lib/metrics';
import { perVisitor } from '../src/screens/users/helpers';
import { Tabs } from '../src/components/Tabs';
import ChartCard, { type TableSpec } from '../src/charts/ChartCard';
import ChartTooltip from '../src/charts/ChartTooltip';
import type { DashboardValue } from '../src/context/DashboardContext';
import type { SalesRow } from '../src/types';

const sales = generateSales();

describe('the correct calls compile and work', () => {
  it('filters, summarises and builds an API', () => {
    expect(filterSales(sales, { region: 'Europe' }).length).toBeGreaterThan(0);
    expect(kpis(monthlySeries(sales), 12).revenue).toBeGreaterThan(0);
    expect(monthlyBy(sales, 'region')).toHaveLength(24);
    expect(createApi({ delayMs: 0 }).calls).toEqual([]);
    expect(perVisitor({ visitors: 2, sessions: 3 })).toBe(1.5);
  });
});

describe('the types reject these mistakes (each marked line must fail to compile)', () => {
  it('data and metrics', () => {
    // @ts-expect-error  a misspelt region ('Europ') is not a Region
    const a = filterSales(sales, { region: 'Europ' });
    // @ts-expect-error  kpis needs the number of months as its second argument
    const b = kpis(monthlySeries(sales));
    // @ts-expect-error  rows can be split by 'region' or 'category', not 'country'
    const c = monthlyBy(sales, 'country');
    // @ts-expect-error  'Mars' is not a Region
    const row: SalesRow = { month: '2026-01', region: 'Mars', category: 'Software', revenue: 1, cost: 1, orders: 1, units: 1 };
    // @ts-expect-error  perVisitor needs both visitors and sessions
    const d = perVisitor({ visitors: 1 });
    expect([a, b, c, row, d]).toHaveLength(5);
  });

  it('the API and the dashboard context', () => {
    // @ts-expect-error  delayMs is a number of milliseconds, not a word
    const api = createApi({ delayMs: 'fast' });
    const set = (dashboard: DashboardValue) => {
      // @ts-expect-error  the period buttons are 3, 6, 12 or 24 months: 5 is not a Range
      dashboard.setRange(5);
      // @ts-expect-error  'Africa' is not a Region (and not 'All')
      dashboard.setRegion('Africa');
    };
    expect([api, set]).toHaveLength(2);
  });

  it('components', () => {
    const table: TableSpec<{ label: string; value: number }> = {
      rows: [],
      columns: [
        // @ts-expect-error  'revnue' is not a field of the row (a typo in a column key)
        { key: 'revnue', label: 'Revenue' },
        // @ts-expect-error  the label is text, so its formatter can not take a number
        { key: 'label', label: 'Month', format: (v: number) => String(v) },
      ],
    };
    // @ts-expect-error  title must be a string
    render(<ChartCard title={5}><p /></ChartCard>);
    // @ts-expect-error  a tab needs a value
    render(<Tabs><Tabs.List><Tabs.Tab>Board</Tabs.Tab></Tabs.List></Tabs>);
    // @ts-expect-error  formatValue receives a number, not a string
    render(<ChartTooltip formatValue={(v: string) => v} />);
    expect(table).toBeDefined();
  });
});
