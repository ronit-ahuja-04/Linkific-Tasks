import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppStore } from '../src/app/store';
import { LoginPage } from '../src/features/auth/AuthPages';
import { RequireRole } from '../src/routes/RequireRole';
import { homeFor } from '../src/routes/home';
import type { Profile } from '../src/lib/types';

const api = vi.hoisted(() => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  currentProfile: vi.fn(),
}));
vi.mock('../src/lib/api/auth', () => api);

const profile = (role: Profile['role']): Profile => ({
  id: 'u1',
  handle: 'maya',
  display_name: 'Maya',
  role,
  timezone: 'UTC',
  daily_goal_minutes: 10,
  wisp_persona: 'cheeky',
  light: 0,
  flame_days: 0,
  best_flame: 0,
  last_goal_date: null,
  embers: 2,
});

function renderAt(path: string, store = createAppStore()) {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/map"
            element={
              <RequireRole>
                <h1>Map</h1>
              </RequireRole>
            }
          />
          <Route
            path="/studio"
            element={
              <RequireRole roles={['instructor', 'admin']}>
                <h1>Studio</h1>
              </RequireRole>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireRole roles={['admin']}>
                <h1>Admin</h1>
              </RequireRole>
            }
          />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

beforeEach(() => vi.resetAllMocks());

describe('route guards', () => {
  it('a signed-out visitor is sent to sign in', () => {
    renderAt('/map', createAppStore({ auth: { status: 'signedOut' } }));
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
  });

  it('a learner who opens /admin lands on the map instead', () => {
    renderAt(
      '/admin',
      createAppStore({ auth: { status: 'signedIn', profile: profile('learner') } }),
    );
    expect(screen.getByRole('heading', { name: 'Map' })).toBeInTheDocument();
  });

  it('instructors reach the studio, admins reach admin', () => {
    renderAt(
      '/studio',
      createAppStore({ auth: { status: 'signedIn', profile: profile('instructor') } }),
    );
    expect(screen.getByRole('heading', { name: 'Studio' })).toBeInTheDocument();
    expect(homeFor('admin')).toBe('/admin');
    expect(homeFor('instructor')).toBe('/studio');
    expect(homeFor('learner')).toBe('/map');
  });
});

describe('sign in', () => {
  it('shows field errors without calling the server', async () => {
    renderAt('/login', createAppStore({ auth: { status: 'signedOut' } }));
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByText('Enter an email like name@example.com.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(api.signIn).not.toHaveBeenCalled();
  });

  it('a wrong password shows the server message and moves focus to it', async () => {
    api.signIn.mockRejectedValue({
      code: 'invalid_credentials',
      message: 'Invalid login credentials',
    });
    renderAt('/login', createAppStore({ auth: { status: 'signedOut' } }));
    await userEvent.type(screen.getByLabelText('Email'), 'maya@lumo.local');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    const alert = await screen.findByText('That email and password don’t match.');
    expect(alert).toHaveFocus();
  });

  it('a successful sign-in sends each role to its home', async () => {
    api.signIn.mockResolvedValue(profile('instructor'));
    renderAt('/login', createAppStore({ auth: { status: 'signedOut' } }));
    await userEvent.type(screen.getByLabelText('Email'), 'riya@lumo.local');
    await userEvent.type(screen.getByLabelText('Password'), 'lumo-demo-123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('heading', { name: 'Studio' })).toBeInTheDocument();
    expect(api.signIn).toHaveBeenCalledWith('riya@lumo.local', 'lumo-demo-123');
  });

  it('the password can be shown and hidden', async () => {
    renderAt('/login', createAppStore({ auth: { status: 'signedOut' } }));
    const password = screen.getByLabelText('Password');
    expect(password).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
  });
});
