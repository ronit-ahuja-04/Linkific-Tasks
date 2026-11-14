// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageProvider } from '../src/context/LanguageContext.jsx';
import { ThemeProvider } from '../src/context/ThemeContext.jsx';
import { ToastProvider } from '../src/context/ToastContext.jsx';
import SettingsView from '../src/pages/SettingsView.jsx';

vi.mock('../src/context/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1', providerIds: [] } }) }));
vi.mock('../src/components/SecurityPanel', () => ({ default: () => <p>security panel body</p> }));

afterEach(cleanup);

function renderSettings() {
  return render(
    <LanguageProvider><ThemeProvider><ToastProvider><SettingsView onBack={() => {}} /></ToastProvider></ThemeProvider></LanguageProvider>,
  );
}

describe('SettingsView security tab', () => {
  it('shows a third tab called Security', () => {
    renderSettings();
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Appearance', 'Language', 'Security']);
  });

  it('renders the SecurityPanel only after switching to it', async () => {
    renderSettings();
    expect(screen.queryByText('security panel body')).toBeNull();
    await userEvent.click(screen.getByRole('tab', { name: 'Security' }));
    expect(screen.getByText('security panel body')).toBeTruthy();
    await userEvent.click(screen.getByRole('tab', { name: 'Appearance' }));
    expect(screen.queryByText('security panel body')).toBeNull();
  });
});
