// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MethodsScreen from '../../src/screens/MethodsScreen';
import { DataProvider, useData } from '../../src/context/DataContext';
import { ToastProvider } from '../../src/context/ToastContext';
import { METHODS } from '../../src/lib/methods';

function Tab() {
  const { tab } = useData();
  return <output data-testid="tab">{tab}</output>;
}
const setup = () => {
  const user = userEvent.setup();
  render(
    <ToastProvider>
      <DataProvider initialSize={1000} initialTab="methods">
        <MethodsScreen />
        <Tab />
      </DataProvider>
    </ToastProvider>
  );
  return user;
};
const card = (name) => screen.getByRole('heading', { level: 3, name }).closest('article');

describe('MethodsScreen', () => {
  it('renders a card for every method and the header count', () => {
    setup();
    expect(screen.getAllByTestId('method-card').length).toBeGreaterThanOrEqual(35);
    expect(screen.getAllByTestId('method-card')).toHaveLength(METHODS.length);
    expect(screen.getByRole('heading', { level: 2, name: `${METHODS.length} Lodash methods demonstrated` })).toBeTruthy();
  });

  it('filters by category', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'String' }));
    const expected = METHODS.filter((m) => m.category === 'String').length;
    expect(screen.getAllByTestId('method-card')).toHaveLength(expected);
    expect(screen.queryByRole('heading', { level: 3, name: 'chunk' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'All' }));
    expect(screen.getAllByTestId('method-card')).toHaveLength(METHODS.length);
  });

  it('filters by method name', async () => {
    const user = setup();
    await user.type(screen.getByLabelText('Search methods'), 'flatten');
    expect(screen.getAllByTestId('method-card')).toHaveLength(2);
    await user.clear(screen.getByLabelText('Search methods'));
    await user.type(screen.getByLabelText('Search methods'), 'zzzz');
    expect(screen.queryAllByTestId('method-card')).toHaveLength(0);
    expect(screen.getByText('No method matches that search.')).toBeTruthy();
  });

  it('shows badges for same, different, random and no native', () => {
    setup();
    expect(within(card('uniq')).getByText('same result')).toBeTruthy();
    expect(within(card('uniqBy')).getByText('different result')).toBeTruthy();
    expect(within(card('uniqBy')).getByText(/keeps the first person per team/)).toBeTruthy();
    expect(within(card('shuffle')).getByText('random: result changes each run')).toBeTruthy();
    expect(within(card('omit')).getByText('no native equivalent')).toBeTruthy();
  });

  it.each(['shuffle', 'random'])('"Run again" works on %s', async (name) => {
    const user = setup();
    const c = card(name);
    expect(within(c).getByText('Run 1')).toBeTruthy();
    await user.click(within(c).getByRole('button', { name: 'Run again' }));
    expect(within(card(name)).getByText('Run 2')).toBeTruthy();
  });

  it('interactive entries switch to the Search lab tab', async () => {
    const user = setup();
    expect(screen.getByTestId("tab").textContent).toBe("methods");
    await user.click(within(card('debounce')).getByRole('button', { name: 'Try it live in Search lab' }));
    expect(screen.getByTestId("tab").textContent).toBe("search");
  });
});
