// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../../src/api/authApi', () => ({ resendVerification: vi.fn() }));
import { resendVerification } from '../../../src/api/authApi';
import AppLayout from '../../../src/components/app/AppLayout';
import { AuthContext } from '../../../src/auth/AuthContext';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import { ToastProvider } from '../../../src/context/ToastContext';

const makeAuth = (user = {}, extra = {}) => ({
  user: { id: 'u1', name: 'Ada Lovelace', email: 'ada@x.dev', role: 'member', emailVerified: true, ...user },
  status: 'authenticated',
  isAuthenticated: true,
  logout: vi.fn().mockResolvedValue(undefined),
  ...extra,
});

function setup(auth) {
  render(
    <ThemeProvider>
      <ToastProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <AuthContext.Provider value={auth}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<p>Dash content</p>} />
                <Route path="/security" element={<p>Security content</p>} />
              </Route>
              <Route path="/login" element={<p>Login page</p>} />
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      </ToastProvider>
    </ThemeProvider>
  );
  return userEvent.setup();
}

beforeEach(() => vi.clearAllMocks());

describe('AppLayout', () => {
  it('renders skip link, logo, main landmark and outlet', () => {
    setup(makeAuth());
    expect(screen.getByRole('link', { name: 'Skip to content' }).getAttribute('href')).toBe('#main');
    expect(screen.getByText('FlowLane')).toBeTruthy();
    const main = screen.getByRole('main');
    expect(main.id).toBe('main');
    expect(main.getAttribute('tabindex')).toBe('-1');
    expect(screen.getByText('Dash content')).toBeTruthy();
  });
  it('shows Dashboard and Security but not Admin for members', () => {
    setup(makeAuth());
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Security' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Admin' })).toBeNull();
  });
  it('shows Admin for admins', () => {
    setup(makeAuth({ role: 'admin' }));
    expect(screen.getByRole('link', { name: 'Admin' })).toBeTruthy();
  });
  it('shows name, role badge and avatar initial', () => {
    setup(makeAuth());
    expect(screen.getByText('Ada Lovelace')).toBeTruthy();
    expect(screen.getByText('member')).toBeTruthy();
    expect(screen.getByText('A')).toBeTruthy();
  });
  it('marks the current nav link', () => {
    setup(makeAuth());
    expect(screen.getByRole('link', { name: 'Dashboard' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Security' }).getAttribute('aria-current')).toBeNull();
  });
  it('navigates between pages', async () => {
    const user = setup(makeAuth());
    await user.click(screen.getByRole('link', { name: 'Security' }));
    expect(screen.getByText('Security content')).toBeTruthy();
  });
  it('logout calls auth.logout, navigates to /login and toasts', async () => {
    const auth = makeAuth();
    const user = setup(auth);
    await user.click(screen.getByRole('button', { name: /logout/i }));
    expect(auth.logout).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Login page')).toBeTruthy();
    expect(screen.getByText('Signed out')).toBeTruthy();
  });
  it('still navigates to /login when logout rejects', async () => {
    const auth = makeAuth({}, { logout: vi.fn().mockRejectedValue(new Error('net')) });
    const user = setup(auth);
    await user.click(screen.getByRole('button', { name: /logout/i }));
    expect(await screen.findByText('Login page')).toBeTruthy();
  });
  it('toggles the theme', async () => {
    const user = setup(makeAuth());
    await user.click(screen.getByRole('button', { name: /switch to dark theme/i }));
    expect(screen.getByRole('button', { name: /switch to light theme/i })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /switch to light theme/i }));
  });
  it('has no verify banner for verified users', () => {
    setup(makeAuth());
    expect(screen.queryByText(/verify your email/i)).toBeNull();
  });
  it('shows the verify banner for unverified users and resends', async () => {
    resendVerification.mockResolvedValue({ message: 'ok' });
    const user = setup(makeAuth({ emailVerified: false }));
    expect(screen.getByText('Verify your email to secure your account.')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Resend email' }));
    expect(resendVerification).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/verification email sent/i)).toBeTruthy();
  });
  it('shows an error toast when resend fails', async () => {
    resendVerification.mockRejectedValue({ status: 500, message: 'Mail is down' });
    const user = setup(makeAuth({ emailVerified: false }));
    await user.click(screen.getByRole('button', { name: 'Resend email' }));
    await waitFor(() => expect(screen.getByText('Mail is down')).toBeTruthy());
  });
});
