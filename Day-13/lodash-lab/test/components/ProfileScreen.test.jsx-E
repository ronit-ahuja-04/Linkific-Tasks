// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import ProfileScreen from '../../src/screens/ProfileScreen';
import { DataProvider, useData } from '../../src/context/DataContext';
import { ToastProvider } from '../../src/context/ToastContext';
import { getDataset } from '../../src/data/generateUsers';

let latest;
function Probe() {
  latest = useData();
  return null;
}
const setup = () =>
  render(
    <ToastProvider>
      <DataProvider initialSize={1000}>
        <ProfileScreen />
        <Probe />
      </DataProvider>
    </ToastProvider>
  );

describe('ProfileScreen', () => {
  it('editing a nested field marks dirty, lists the path, and undo reverts', () => {
    setup();
    expect(screen.getByText(/Clean/)).toBeTruthy();
    const city = screen.getByLabelText('City');
    const before = city.value;
    fireEvent.change(city, { target: { value: 'Atlantis' } });
    expect(screen.getByText(/Dirty/)).toBeTruthy();
    const list = screen.getByRole('list', { name: 'Changed fields' });
    expect(within(list).getByText('address.city')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Undo address.city' }));
    expect(screen.getByLabelText('City').value).toBe(before);
    expect(screen.getByText(/Clean/)).toBeTruthy();
  });

  it('shows an error for an invalid email and disables Save', () => {
    setup();
    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), { target: { value: 'nope' } });
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('Enter a valid email address')).toBeTruthy();
    expect(input.getAttribute('aria-describedby')).toBe('f-email-error');
    expect(screen.getByRole('button', { name: 'Save' }).disabled).toBe(true);
  });

  it('saves into context, toasts, and never touches the original object', () => {
    setup();
    const original = getDataset(1000).find((u) => u.id === latest.selectedId);
    const snapshot = JSON.stringify(original);
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Atlantis' } });
    expect(JSON.stringify(original)).toBe(snapshot);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(latest.users.find((u) => u.id === original.id).address.city).toBe('Atlantis');
    expect(JSON.stringify(original)).toBe(snapshot);
    expect(screen.getByText(`Saved ${original.firstName} ${original.lastName}`)).toBeTruthy();
    expect(screen.getByText(/Clean/)).toBeTruthy();
  });
});
