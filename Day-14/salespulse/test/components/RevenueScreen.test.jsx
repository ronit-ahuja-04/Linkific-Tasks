// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createApi } from '../../src/api/mockApi';
import { DashboardProvider } from '../../src/context/DashboardContext';
import RevenueScreen from '../../src/screens/RevenueScreen';

const setup = async () => {
  render(
    <DashboardProvider api={createApi({ delayMs: 0 })} initialRange={12}>
      <RevenueScreen />
    </DashboardProvider>,
  );
  await screen.findByRole('heading', { name: 'Revenue by region' });
};

describe('RevenueScreen', () => {
  it('renders the donut with a button legend and a drill-down hint', async () => {
    await setup();
    expect(document.querySelector('.recharts-pie')).toBeTruthy();
    expect(screen.getByText('Total revenue')).toBeTruthy();
    const group = screen.getByRole('group', { name: /select a region/i });
    expect(within(group).getAllByRole('button', { pressed: false }).length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText('Select a slice to drill down')).toBeTruthy();
  });

  it('selects a slice from the legend and shows the category split', async () => {
    await setup();
    const group = screen.getByRole('group', { name: /select a region/i });
    const first = within(group).getAllByRole('button')[0];
    await userEvent.click(first);
    expect(first.getAttribute('aria-pressed')).toBe('true');
    expect(screen.queryByText('Select a slice to drill down')).toBeNull();
    expect(screen.getByText(/^Monthly revenue in /)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(screen.getByText('Select a slice to drill down')).toBeTruthy();
  });

  it('selects by clicking a slice and switches to Category', async () => {
    await setup();
    await userEvent.click(document.querySelector('.recharts-pie-sector'));
    expect(screen.queryByText('Select a slice to drill down')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Category' }));
    expect(await screen.findByRole('heading', { name: 'Revenue by category' })).toBeTruthy();
    expect(screen.getByText('Select a slice to drill down')).toBeTruthy();
  });

  it('offers a table view', async () => {
    await setup();
    await userEvent.click(screen.getAllByRole('button', { name: 'Table view' })[0]);
    expect(screen.getByRole('table', { name: /revenue by region: data/i })).toBeTruthy();
  });
});
