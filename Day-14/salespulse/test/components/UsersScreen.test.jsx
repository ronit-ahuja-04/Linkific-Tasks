// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createApi } from '../../src/api/mockApi';
import { DashboardProvider } from '../../src/context/DashboardContext';
import UsersScreen from '../../src/screens/UsersScreen';

const setup = () =>
  render(
    <DashboardProvider api={createApi({ delayMs: 0 })} initialRange={12}>
      <UsersScreen />
    </DashboardProvider>,
  );

describe('UsersScreen', () => {
  it('shows three charts, stat tiles and the weekend insight', async () => {
    const { container } = setup();
    await screen.findByRole('heading', { name: 'Visitors and sessions' });
    expect(screen.getByRole('heading', { name: 'Sign-ups' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Conversion rate' })).toBeTruthy();
    expect(container.querySelectorAll('.recharts-wrapper').length).toBe(3);
    expect(screen.getByText('Average conversion')).toBeTruthy();
    expect(screen.getByText(/Weekends average/)).toBeTruthy();
  });

  it('defaults to weekly and switches to daily', async () => {
    const user = userEvent.setup();
    setup();
    await screen.findByRole('heading', { name: 'Conversion rate' });
    expect(screen.getByRole('button', { name: 'Weekly' }).getAttribute('aria-pressed')).toBe('true');
    await user.click(screen.getByRole('button', { name: 'Daily' }));
    expect(screen.getByRole('button', { name: 'Daily' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Weekly' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('offers a table view for a chart', async () => {
    const user = userEvent.setup();
    setup();
    const card = (await screen.findByRole('heading', { name: 'Sign-ups' })).closest('section');
    await user.click(within(card).getByRole('button', { name: /Table view/ }));
    expect(within(card).getByRole('table')).toBeTruthy();
    expect(within(card).getAllByRole('row').length).toBeGreaterThan(2);
  });
});
