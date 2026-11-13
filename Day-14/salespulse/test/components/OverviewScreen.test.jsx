// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createApi } from '../../src/api/mockApi';
import { DashboardProvider } from '../../src/context/DashboardContext';
import OverviewScreen from '../../src/screens/OverviewScreen';

const setup = () =>
  render(
    <DashboardProvider api={createApi({ delayMs: 0 })} initialRange={12}>
      <OverviewScreen />
    </DashboardProvider>,
  );

describe('OverviewScreen', () => {
  it('shows five KPI cards with signed changes and the period', async () => {
    const { container } = setup();
    await screen.findByRole('heading', { name: /key numbers/i });
    expect(screen.getByText('Last 12 months')).toBeTruthy();
    expect(container.querySelectorAll('.overview-kpi')).toHaveLength(5);
    for (const name of ['Revenue', 'Profit', 'Orders', 'Average order', 'Profit margin']) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0);
    }
    expect(screen.getAllByText(/vs previous 12 months|No earlier period/).length).toBe(5);
  });

  it('renders both charts and the insights', async () => {
    const { container } = setup();
    await screen.findByRole('heading', { name: 'Cumulative revenue' });
    await screen.findByRole('heading', { name: 'Revenue, profit and trend' });
    expect(container.querySelectorAll('.recharts-wrapper').length).toBe(2);
    expect(container.querySelector('.recharts-legend-wrapper')?.textContent).toMatch(/3-month average/);
    const insights = screen.getByRole('heading', { name: 'Insights' }).closest('section');
    expect(within(insights).getByText(/Best month/)).toBeTruthy();
    expect(within(insights).getByText(/Top region/)).toBeTruthy();
  });

  it('switches a chart to its table view', async () => {
    setup();
    await screen.findByRole('heading', { name: 'Cumulative revenue' });
    await userEvent.click(screen.getAllByRole('button', { name: /table view/i })[0]);
    expect(await screen.findByRole('table', { name: /cumulative revenue/i })).toBeTruthy();
  });
});
