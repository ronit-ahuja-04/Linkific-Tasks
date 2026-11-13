// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createApi } from '../../src/api/mockApi';
import { DashboardProvider, useDashboard } from '../../src/context/DashboardContext';
import SalesScreen from '../../src/screens/SalesScreen';

afterEach(cleanup);

let controls;
function Probe() {
  controls = useDashboard();
  return null;
}
const setup = () =>
  render(
    <DashboardProvider api={createApi({ delayMs: 0 })} initialRange={12}>
      <Probe />
      <SalesScreen />
    </DashboardProvider>,
  );

describe('SalesScreen', () => {
  it('renders both charts with legend and series', async () => {
    const { container } = setup();
    await screen.findByRole('heading', { name: 'Revenue by month' });
    expect(screen.getByRole('heading', { name: 'Monthly revenue, zoomable' })).toBeTruthy();
    expect(container.querySelectorAll('.recharts-wrapper').length).toBe(2);
    expect(container.querySelector('.recharts-legend-wrapper').textContent).toContain('Europe');
  });

  it('switches the split and layout with pressed buttons', async () => {
    setup();
    await screen.findByRole('heading', { name: 'Revenue by month' });
    const category = screen.getByRole('button', { name: 'Category' });
    fireEvent.click(category);
    expect(category.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Region' }).getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: 'Grouped' }));
    expect(screen.getByRole('button', { name: 'Grouped' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('selects a month from the select and clears it', async () => {
    setup();
    await screen.findByRole('heading', { name: 'Revenue by month' });
    const select = screen.getByLabelText('Inspect a month');
    fireEvent.change(select, { target: { value: select.options[3].value } });
    expect(screen.getByRole('heading', { name: 'Month details' })).toBeTruthy();
    expect(screen.getByText('Best region')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(select.value).toBe('');
  });

  it('selects a month by clicking a bar', async () => {
    const { container } = setup();
    await screen.findByRole('heading', { name: 'Revenue by month' });
    const bar = await vi_waitFor(() => container.querySelector('.recharts-bar-rectangle path, .recharts-bar-rectangle'));
    fireEvent.click(bar);
    expect(screen.getByLabelText('Inspect a month').value).not.toBe('');
  });

  it('shows a table view and a reset-zoom button that starts disabled', async () => {
    setup();
    await screen.findByRole('heading', { name: 'Revenue by month' });
    expect(screen.getByRole('button', { name: 'Reset zoom' }).disabled).toBe(true);
    expect(screen.getByText(/Showing .* \(12 months\)/)).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: /Table view/ })[0]);
    expect(screen.getByRole('table', { name: /Revenue by month: data/ })).toBeTruthy();
  });

  it('keeps the zoom text valid when the period changes', async () => {
    setup();
    await screen.findByRole('heading', { name: 'Revenue by month' });
    act(() => controls.setRange(3));
    expect(await screen.findByText(/Showing .* \(3 months\)/)).toBeTruthy();
  });
});

import { waitFor } from '@testing-library/react';
async function vi_waitFor(fn) {
  return waitFor(() => {
    const el = fn();
    if (!el) throw new Error('not yet');
    return el;
  });
}
