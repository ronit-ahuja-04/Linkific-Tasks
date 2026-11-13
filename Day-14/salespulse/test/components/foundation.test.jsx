// @vitest-environment jsdom
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LineChart, Line } from 'recharts';
import { createApi } from '../../src/api/mockApi';
import { DashboardProvider, useDashboard } from '../../src/context/DashboardContext';
import FilterBar from '../../src/components/FilterBar';
import ChartCard from '../../src/charts/ChartCard';
import ChartTooltip from '../../src/charts/ChartTooltip';
import ResponsiveChart from '../../src/charts/ResponsiveChart';

function Probe() {
  const d = useDashboard();
  return (
    <p data-testid="probe">
      {JSON.stringify({ loading: d.loading, refreshing: d.refreshing, ready: d.ready, error: d.error, revenue: d.kpi?.revenue ?? null, months: d.periodSeries.length, region: d.region })}
    </p>
  );
}
const read = () => JSON.parse(screen.getByTestId('probe').textContent);
const setup = (api, props) => render(<DashboardProvider api={api} {...props}><FilterBar /><Probe /></DashboardProvider>);

describe('DashboardProvider and FilterBar', () => {
  it('loads once, then scopes every number by region instantly (no new request)', async () => {
    const api = createApi({ delayMs: 0 });
    setup(api);
    expect(read().loading).toBe(true);
    await waitFor(() => expect(read().ready).toBe(true));
    expect(read()).toMatchObject({ loading: false, refreshing: false, months: 12 });
    const all = read().revenue;
    await userEvent.selectOptions(screen.getByLabelText('Region'), 'Europe');
    expect(read().revenue).toBeLessThan(all);
    expect(read().region).toBe('Europe');
    expect(api.calls).toHaveLength(1); // filtering in the browser asked for nothing
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(read().revenue).toBe(all);
  });

  it('changing the period asks the API again and keeps the old data meanwhile', async () => {
    const api = createApi({ delayMs: 40 });
    setup(api);
    await waitFor(() => expect(read().ready).toBe(true));
    await userEvent.click(screen.getByRole('button', { name: '3 months' }));
    expect(read()).toMatchObject({ ready: true, refreshing: true, months: 12 }); // old charts still there, still 12 months
    expect(screen.getByText('Updating…')).toBeTruthy();
    await waitFor(() => expect(read().refreshing).toBe(false));
    expect(read().months).toBe(3);
    expect(api.calls).toEqual([12, 3]);
    expect(screen.getByRole('button', { name: '3 months' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('shows a failure with a retry button, then recovers', async () => {
    setup(createApi({ delayMs: 0, failTimes: 1 }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/did not respond/);
    expect(read().loading).toBe(false);
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(read().ready).toBe(true));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('keeps the last good data when a later request fails', async () => {
    const api = createApi({ delayMs: 0 });
    setup(api);
    await waitFor(() => expect(read().ready).toBe(true));
    const original = read().revenue;
    api.fetchDashboard = createApi({ delayMs: 0, failTimes: 1 }).fetchDashboard;
    await userEvent.click(screen.getByRole('button', { name: '6 months' }));
    await screen.findByRole('alert');
    expect(read().revenue).toBe(original); // still the 12-month numbers, not a half-sliced 6
    expect(read().months).toBe(12);
    expect(screen.getByRole('button', { name: '6 months' }).getAttribute('aria-pressed')).toBe('true'); // the button shows what was asked
  });

  it('useDashboard fails clearly outside a provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/DashboardProvider/);
    spy.mockRestore();
  });

  it('starts from the given range', async () => {
    setup(createApi({ delayMs: 0 }), { initialRange: 6 });
    await waitFor(() => expect(read().ready).toBe(true));
    expect(read().months).toBe(6);
  });

  it('exposes setters that scope the data', async () => {
    let dashboard;
    function Grab() { dashboard = useDashboard(); return null; }
    render(<DashboardProvider api={createApi({ delayMs: 0 })}><Grab /><Probe /></DashboardProvider>);
    await waitFor(() => expect(read().ready).toBe(true));
    act(() => dashboard.setCategory('Hardware'));
    expect(dashboard.hasFilters).toBe(true);
    expect(dashboard.periodRows.every((r) => r.category === 'Hardware')).toBe(true);
  });
});

describe('ChartCard', () => {
  const table = { columns: [{ key: 'label', label: 'Month', numeric: false }, { key: 'value', label: 'Revenue', format: (v) => `$${v}` }], rows: [{ label: 'Jan', value: 5 }, { label: 'Feb', value: 7 }] };
  it('switches between the chart and an accessible table of the same numbers', async () => {
    render(<ChartCard title="Revenue" subtitle="Monthly" summary="Revenue went up." table={table}><div>the chart</div></ChartCard>);
    expect(screen.getByRole('heading', { name: 'Revenue' })).toBeTruthy();
    expect(screen.getByText('the chart')).toBeTruthy();
    const toggle = screen.getByRole('button', { name: 'Table view' });
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    await userEvent.click(toggle);
    expect(screen.queryByText('the chart')).toBeNull();
    expect(screen.getByRole('table', { name: 'Revenue: data' })).toBeTruthy();
    expect(screen.getByRole('rowheader', { name: 'Jan' })).toBeTruthy();
    expect(screen.getByRole('cell', { name: '$7' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Chart view' }));
    expect(screen.getByText('the chart')).toBeTruthy();
  });
  it('marks itself busy while data reloads', () => {
    render(<ChartCard title="T" busy><div /></ChartCard>);
    expect(screen.getByRole('region', { name: 'T' }).getAttribute('aria-busy')).toBe('true');
  });
  it('has no table button when there is no table', () => {
    render(<ChartCard title="T"><div /></ChartCard>);
    expect(screen.queryByRole('button', { name: 'Table view' })).toBeNull();
  });
});

describe('ChartTooltip', () => {
  const payload = [{ dataKey: 'a', name: 'Revenue', value: 120, color: 'red' }, { dataKey: 'b', name: 'Profit', value: 40, color: 'blue' }];
  it('lists every series with values first, plus title and footer', () => {
    render(<ChartTooltip active payload={payload} label="Jan 26" formatValue={(v) => `$${v}`} title={(l) => `Month: ${l}`} footer={(p) => `${p.length} series`} />);
    expect(screen.getByText('Month: Jan 26')).toBeTruthy();
    expect(screen.getByText('$120')).toBeTruthy();
    expect(screen.getByText('Profit')).toBeTruthy();
    expect(screen.getByText('2 series')).toBeTruthy();
  });
  it('renders nothing when inactive or empty', () => {
    const { container, rerender } = render(<ChartTooltip active={false} payload={payload} />);
    expect(container.firstChild).toBeNull();
    rerender(<ChartTooltip active payload={[]} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('ResponsiveChart', () => {
  it('draws a Recharts chart even without layout (jsdom)', () => {
    const { container } = render(
      <ResponsiveChart height={200}>
        <LineChart data={[{ x: 1, y: 2 }, { x: 2, y: 3 }]}>
          <Line dataKey="y" isAnimationActive={false} />
        </LineChart>
      </ResponsiveChart>
    );
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy();
    expect(container.querySelector('path.recharts-line-curve')).toBeTruthy();
  });
});
