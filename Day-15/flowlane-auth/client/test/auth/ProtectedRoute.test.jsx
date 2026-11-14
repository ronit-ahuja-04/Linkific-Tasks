// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthContext } from '../../src/auth/AuthContext';
import ProtectedRoute, { PrivateRoute, PublicOnlyRoute, RequireRole } from '../../src/auth/ProtectedRoute';
import { makeUser } from './helpers';

const value = (status, user = null) => ({ status, user, isAuthenticated: status === 'authenticated' });

function Where() {
  const location = useLocation();
  return <p data-testid="where">{location.pathname}{location.state?.from ? `|from=${location.state.from.pathname}${location.state.from.search}` : ''}</p>;
}

function renderRoutes(auth, initial, state) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[state ? { pathname: initial, state } : initial]}>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<><h1>Login page</h1><Where /></>} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<h1>Dashboard</h1>} />
            <Route path="/projects" element={<h1>Projects</h1>} />
            <Route element={<RequireRole role="admin" />}>
              <Route path="/admin" element={<h1>Admin area</h1>} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('ProtectedRoute', () => {
  it('shows a status message while the session is being checked', () => {
    renderRoutes(value('loading'), '/dashboard');
    expect(screen.getByRole('status').textContent).toContain('Checking your session…');
    expect(screen.queryByText('Dashboard')).toBeNull();
  });
  it('redirects anonymous users to /login and remembers where they were going', () => {
    renderRoutes(value('anonymous'), '/projects?tab=1');
    expect(screen.getByRole('heading', { name: 'Login page' })).toBeTruthy();
    expect(screen.getByTestId('where').textContent).toContain('/login|from=/projects?tab=1');
  });
  it('renders the page for authenticated users', () => {
    renderRoutes(value('authenticated', makeUser()), '/dashboard');
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeTruthy();
  });
  it('PrivateRoute is an alias of the default export', () => {
    expect(PrivateRoute).toBe(ProtectedRoute);
  });
});

describe('PublicOnlyRoute', () => {
  it('shows the public page to anonymous users', () => {
    renderRoutes(value('anonymous'), '/login');
    expect(screen.getByRole('heading', { name: 'Login page' })).toBeTruthy();
  });
  it('shows the checking message while loading', () => {
    renderRoutes(value('loading'), '/login');
    expect(screen.getByRole('status')).toBeTruthy();
  });
  it('bounces authenticated users to the dashboard by default', () => {
    renderRoutes(value('authenticated', makeUser()), '/login');
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeTruthy();
  });
  it('bounces authenticated users back to the page they came from', () => {
    renderRoutes(value('authenticated', makeUser()), '/login', { from: { pathname: '/projects' } });
    expect(screen.getByRole('heading', { name: 'Projects' })).toBeTruthy();
  });
});

describe('RequireRole', () => {
  it('lets the right role through', () => {
    renderRoutes(value('authenticated', makeUser({ role: 'admin' })), '/admin');
    expect(screen.getByRole('heading', { name: 'Admin area' })).toBeTruthy();
  });
  it('shows the 403 page for the wrong role, with a link to the dashboard', () => {
    renderRoutes(value('authenticated', makeUser({ role: 'member' })), '/admin');
    expect(screen.getByText('You do not have access to this page.')).toBeTruthy();
    expect(screen.queryByText('Admin area')).toBeNull();
    expect(screen.getByRole('link', { name: /dashboard/i }).getAttribute('href')).toBe('/dashboard');
  });
  it('anonymous users hit the login redirect before the role check', () => {
    renderRoutes(value('anonymous'), '/admin');
    expect(screen.getByRole('heading', { name: 'Login page' })).toBeTruthy();
  });
});
