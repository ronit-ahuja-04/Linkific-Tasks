// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getDataset } from '../../src/data/generateUsers';
import DirectoryScreen from '../../src/screens/DirectoryScreen';
import { DataProvider, useData } from '../../src/context/DataContext';
import { ToastProvider } from '../../src/context/ToastContext';
import { ThemeProvider } from '../../src/context/ThemeContext';

function Probe() {
  const { tab, selectedId } = useData();
  return <output data-testid="probe">{`${tab}:${selectedId}`}</output>;
}

function setup() {
  const user = userEvent.setup();
  render(
    <ThemeProvider>
      <ToastProvider>
        <DataProvider initialSize={1000}>
          <DirectoryScreen />
          <Probe />
        </DataProvider>
      </ToastProvider>
    </ThemeProvider>
  );
  return user;
}

const bodyRows = () => within(screen.getAllByRole('rowgroup')[1]).getAllByRole('row');
const countText = () => screen.getByText(/Showing .* of .* users/).textContent;

describe('DirectoryScreen', () => {
  it('shows the first page of 1,000 users', () => {
    setup();
    expect(countText()).toBe('Showing 1,000 of 1,000 users');
    expect(bodyRows()).toHaveLength(10);
    expect(screen.getByText('Page 1 of 100')).toBeTruthy();
  });

  it('narrows the results after the debounce and highlights matches', async () => {
    const user = setup();
    await user.type(screen.getByRole('searchbox', { name: 'Search users' }), 'zzzzqq');
    expect(await screen.findByText(/No users match/)).toBeTruthy();
    expect(countText()).toBe('Showing 0 of 1,000 users');
    expect(screen.queryByText(/typing…/)).toBeNull();

    await user.clear(screen.getByRole('searchbox', { name: 'Search users' }));
    await user.type(screen.getByRole('searchbox', { name: 'Search users' }), getDataset(1000)[0].lastName);
    expect(screen.getByText(/typing…/)).toBeTruthy();
    await waitFor(() => expect(screen.queryByText(/typing…/)).toBeNull());
    expect(countText()).not.toBe('Showing 1,000 of 1,000 users');
    expect(document.querySelector('tbody mark')).not.toBeNull();
  });

  it('sets aria-sort on click and cycles back to none', async () => {
    const user = setup();
    const header = screen.getByRole('columnheader', { name: /Salary/ });
    expect(header.getAttribute('aria-sort')).toBe('none');
    await user.click(within(header).getByRole('button'));
    expect(header.getAttribute('aria-sort')).toBe('ascending');
    await user.click(within(header).getByRole('button'));
    expect(header.getAttribute('aria-sort')).toBe('descending');
    await user.click(within(header).getByRole('button'));
    expect(header.getAttribute('aria-sort')).toBe('none');
  });

  it('supports shift+click multi sort with order badges', async () => {
    const user = setup();
    await user.click(within(screen.getByRole('columnheader', { name: /Department/ })).getByRole('button'));
    await user.keyboard('{Shift>}');
    await user.click(within(screen.getByRole('columnheader', { name: /Salary/ })).getByRole('button'));
    await user.keyboard('{/Shift}');
    expect(screen.getByRole('columnheader', { name: /Department/ }).getAttribute('aria-sort')).toBe('ascending');
    expect(screen.getByRole('columnheader', { name: /Salary/ }).getAttribute('aria-sort')).toBe('ascending');
    expect(within(screen.getByRole('columnheader', { name: /Salary/ })).getByText('2')).toBeTruthy();
  });

  it('paginates and resets to page 1 when sort changes', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Page 2 of 100')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByText('Page 1 of 100')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Previous' }).disabled).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(within(screen.getByRole('columnheader', { name: /Name/ })).getByRole('button'));
    expect(screen.getByText('Page 1 of 100')).toBeTruthy();

    await user.selectOptions(screen.getByLabelText('Rows per page'), '50');
    expect(screen.getByText('Page 1 of 20')).toBeTruthy();
    expect(bodyRows()).toHaveLength(50);
  });

  it('filters by department and resets filters', async () => {
    const user = setup();
    const reset = screen.getByRole('button', { name: 'Reset filters' });
    expect(reset.disabled).toBe(true);
    await user.click(screen.getByRole('checkbox', { name: 'Engineering' }));
    expect(countText()).not.toBe('Showing 1,000 of 1,000 users');
    for (const cell of screen.getAllByRole('cell', { name: 'Engineering' })) expect(cell).toBeTruthy();
    await user.click(reset);
    expect(countText()).toBe('Showing 1,000 of 1,000 users');
    expect(screen.getByRole('checkbox', { name: 'Engineering' }).checked).toBe(false);
  });

  it('groups users and filters to a group when its name is clicked', async () => {
    const user = setup();
    await user.selectOptions(screen.getByLabelText('Group by'), 'department');
    expect(screen.getByRole('columnheader', { name: 'Avg salary' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Filter to Engineering' }));
    expect(screen.getByRole('checkbox', { name: 'Engineering' }).checked).toBe(true);
    expect(screen.getByRole('columnheader', { name: /Salary/ })).toBeTruthy();
  });

  it('Random user highlights a row and shuffle keeps the same users', async () => {
    const user = setup();
    const before = bodyRows().length;
    await user.click(screen.getByRole('button', { name: 'Shuffle page' }));
    expect(bodyRows()).toHaveLength(before);
    await user.click(screen.getByRole('button', { name: 'Random user' }));
    expect(await screen.findByText(/^Surprise: /)).toBeTruthy();
    expect(document.querySelector('tr[aria-current="true"]')).not.toBeNull();
  });

  it('the Edit button selects the user and switches to the profile tab', async () => {
    const user = setup();
    expect(screen.getByTestId('probe').textContent).toBe('directory:1');
    const row = bodyRows()[0];
    const edit = within(row).getByRole('button', { name: /^Edit / });
    const name = edit.getAttribute('aria-label').replace('Edit ', '');
    expect(within(row).getByText(name)).toBeTruthy();
    await user.click(edit);
    expect(screen.getByTestId('probe').textContent).toMatch(/^profile:\d+$/);
  });
});
