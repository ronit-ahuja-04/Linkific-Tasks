// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { createApi } from '../../src/api/mockApi';
import { DashboardProvider, useDashboard } from '../../src/context/DashboardContext';
import ExploreScreen from '../../src/screens/ExploreScreen';

let setCategory;
function Probe() {
  setCategory = useDashboard().setCategory;
  return null;
}
const setup = () =>
  render(
    <DashboardProvider api={createApi({ delayMs: 0 })} initialRange={12}>
      <Probe />
      <ExploreScreen />
    </DashboardProvider>
  );

describe('ExploreScreen', () => {
  it('renders both charts and the log scale checkbox', async () => {
    const { container } = setup();
    await screen.findByRole('heading', { name: 'Price vs units sold' });
    expect(screen.getByRole('heading', { name: 'How the categories compare' })).toBeTruthy();
    expect(container.querySelectorAll('.recharts-wrapper').length).toBe(2);
    const log = screen.getByLabelText('Log scale');
    fireEvent.click(log);
    expect(log.checked).toBe(true);
  });

  it('pins a product with the select and unpins it', async () => {
    setup();
    await screen.findByRole('heading', { name: 'Price vs units sold' });
    fireEvent.change(screen.getByLabelText('Pin a product'), { target: { selectedIndex: 1 } });
    expect(screen.getByText(/Pinned product:/)).toBeTruthy();
    expect(screen.getByText(/#1 of 30/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Unpin/ }));
    expect(screen.queryByText(/Pinned product:/)).toBeNull();
  });

  it('toggles a radar series from the legend buttons', async () => {
    const { container } = setup();
    await screen.findByRole('heading', { name: 'How the categories compare' });
    const group = screen.getByRole('list', { name: 'Show or hide categories' });
    const button = within(group).getByRole('button', { name: 'Hardware' });
    const before = container.querySelectorAll('.recharts-radar').length;
    expect(button.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(button);
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(container.querySelectorAll('.recharts-radar').length).toBe(before - 1);
  });

  it('shows the raw numbers table and handles a single category filter', async () => {
    setup();
    await screen.findByRole('heading', { name: 'How the categories compare' });
    expect(screen.getAllByRole('columnheader', { name: 'Margin' }).length).toBeGreaterThan(0);
    act(() => setCategory('Services'));
    expect(await screen.findByText(/10 products plotted/)).toBeTruthy();
    expect(screen.queryByRole('list', { name: 'Show or hide categories' })).toBeNull();
  });
});
