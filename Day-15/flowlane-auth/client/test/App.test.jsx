// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import App from '../src/App';
import { AuthContext } from '../src/auth/AuthContext';
import { makeUser } from './auth/helpers';

// Tiny stubs keep these tests independent of the real pages
vi.mock('../src/components/app/AppLayout', () => ({ default: () => <div data-testid="layout"><Outlet /></div> }));
vi.mock('../src/pages/app/DashboardPage', () => ({ default: () => <h1>Dashboard stub</h1> }));
vi.mock('../src/pages/app/SecurityPage', () => ({ default: () => <h1>Security stub</h1> }));
vi.mock('../src/pages/app/AdminPage', () => ({ default: () => <h1>Admin stub</h1> }));
vi.mock('../src/pages/auth/LoginPage', () => ({ default: () => <h1>Login stub</h1> }));
vi.mock('../src/pages/auth/RegisterPage', () => ({ default: () => <h1>Register stub</h1> }));
vi.mock('../src/pages/auth/ForgotPasswordPage', () => ({ default: () => <h1>Forgot stub</h1> }));
vi.mock('../src/pages/auth/ResetPasswordPage', () => ({ default: () => <h1>Reset stub</h1> }));
vi.mock('../src/pages/auth/VerifyEmailPage', () => ({ default: () => <h1>Verify stub</h1> }));
vi.mock('../src/pages/auth/OAuthCallbackPage', () => ({ default: () => <h1>OAuth stub</h1> }));

const anon = { status: 'anonymous', user: null, isAuthenticated: false };
const member = { status: 'authenticated', user: makeUser(), isAuthenticated: true };
const admin = { status: 'authenticated', user: makeUser({ role: 'admin' }), isAuthenticated: true };

const renderAt = (path, auth) =>
  render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </AuthContext.Provider>
  );
const heading = (name) => expect(screen.getByRole('heading', { name })).toBeTruthy();

describe('App routing', () => {
  it.each([
    ['/login', 'Login stub'],
    ['/register', 'Register stub'],
    ['/forgot-password', 'Forgot stub'],
  ])('anonymous can open %s', (path, name) => {
    renderAt(path, anon);
    heading(name);
  });
  it.each(['/login', '/register', '/forgot-password'])('signed-in users are bounced from %s to the dashboard', (path) => {
    renderAt(path, member);
    heading('Dashboard stub');
  });
  it.each([
    ['/reset-password', 'Reset stub'],
    ['/verify-email', 'Verify stub'],
    ['/oauth/callback', 'OAuth stub'],
  ])('%s is reachable signed in or out', (path, name) => {
    renderAt(path, anon);
    heading(name);
  });
  it('public pages like /reset-password also open when signed in', () => {
    renderAt('/reset-password', member);
    heading('Reset stub');
  });
  it('protected pages redirect anonymous users to login', () => {
    renderAt('/dashboard', anon);
    heading('Login stub');
    expect(screen.queryByTestId('layout')).toBeNull();
  });
  it('dashboard and security render inside the layout when signed in', () => {
    renderAt('/dashboard', member);
    heading('Dashboard stub');
    expect(screen.getByTestId('layout')).toBeTruthy();
  });
  it('renders /security', () => {
    renderAt('/security', member);
    heading('Security stub');
  });
  it('/admin works for admins', () => {
    renderAt('/admin', admin);
    heading('Admin stub');
  });
  it('/admin shows the 403 page for members', () => {
    renderAt('/admin', member);
    expect(screen.getByText('You do not have access to this page.')).toBeTruthy();
  });
  it('/ redirects to the dashboard (then to login if anonymous)', () => {
    renderAt('/', member);
    heading('Dashboard stub');
  });
  it('/ for an anonymous user ends at login', () => {
    renderAt('/', anon);
    heading('Login stub');
  });
  it('shows the checking state while loading', () => {
    renderAt('/dashboard', { status: 'loading', user: null, isAuthenticated: false });
    expect(screen.getByRole('status').textContent).toContain('Checking your session');
  });
  it('unknown URLs show the not found page with a link home', () => {
    renderAt('/nope/never', anon);
    heading('404');
    expect(screen.getByRole('link', { name: /home/i }).getAttribute('href')).toBe('/');
    expect(document.title).toMatch(/not found/i);
  });
});
