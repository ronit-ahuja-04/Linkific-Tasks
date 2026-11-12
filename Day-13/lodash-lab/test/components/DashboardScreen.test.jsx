// @vitest-environment jsdom
import { act, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DashboardScreen from '../../src/screens/DashboardScreen';
import { DataProvider, useData } from '../../src/context/DataContext';
import { getDataset } from '../../src/data/generateUsers';
import { formatMoney, headcountBy, summarize } from '../../src/lib/stats';

let setSizeRef;
function Probe() {
  setSizeRef = useData().setSize;
  return null;
}
const renderDash = (size = 1000) =>
  render(
    <DataProvider initialSize={size}>
      <Probe />
      <DashboardScreen />
    </DataProvider>
  );
const kpi = (label) => screen.getByTestId(`kpi-${label}`).textContent;

describe('DashboardScreen', () => {
  it('shows KPIs equal to the lib values', () => {
    renderDash(1000);
    const s = summarize(getDataset(1000));
    expect(kpi('Headcount')).toBe('1,000');
    expect(kpi('Average salary')).toBe(formatMoney(s.avgSalary));
    expect(kpi('Total payroll')).toBe(formatMoney(s.payroll));
    expect(kpi('Average rating')).toBe(s.avgRating.toFixed(2));
    expect(kpi('Average age')).toBe(s.avgAge.toFixed(1));
  });

  it('renders bars with aria-labels and section headings', () => {
    renderDash(1000);
    const top = headcountBy(getDataset(1000), 'department')[0];
    const pct = Math.round((top.value / 1000) * 100);
    expect(screen.getByRole('img', { name: `${top.label}: ${top.value.toLocaleString('en-US')} users (${pct}%)` })).toBeTruthy();
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThanOrEqual(8);
    expect(screen.getAllByText('Lodash used').length).toBeGreaterThanOrEqual(8);
  });

  it('has one table row per department', () => {
    renderDash(1000);
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(9); // header + 8
  });

  it('updates when the dataset size changes', () => {
    renderDash(1000);
    act(() => setSizeRef(10000));
    const s = summarize(getDataset(10000));
    expect(kpi('Headcount')).toBe('10,000');
    expect(kpi('Total payroll')).toBe(formatMoney(s.payroll));
  });
});
