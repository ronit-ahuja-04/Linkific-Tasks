import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAppStore } from '../src/app/store';
import { passwordStrength, suggestHandle } from '../src/features/auth/validation';
import { ErrorBoundary, NotFoundPage } from '../src/features/errors/ErrorScreens';
import { Toaster } from '../src/features/toast/Toaster';
import { toastAdded } from '../src/features/toast/toastSlice';

vi.mock('../src/lib/api/auth', () => ({
  requestPasswordReset: vi.fn(),
  updatePassword: vi.fn(),
  currentProfile: vi.fn(),
}));

afterEach(() => vi.useRealTimers());

describe('password strength', () => {
  it('rates by length first, then variety, and never trusts a common password', () => {
    expect(passwordStrength('short').label).toBe('Too short');
    expect(passwordStrength('password').label).toBe('Weak');
    expect(passwordStrength('lanterns').label).toBe('Weak');
    expect(passwordStrength('Lanterns42').label).toBe('Okay');
    expect(passwordStrength('Lanterns42glow').label).toBe('Strong');
    expect(passwordStrength('Lanterns42 glow!').label).toBe('Great');
    expect(passwordStrength('the fog lifts at dawn, Wisp!').score).toBe(4);
    expect(passwordStrength('the fog lifts at dawn, Wisp!').tip).toBeNull();
  });
});

describe('handle suggestions', () => {
  it('turns a name into a valid handle', () => {
    expect(suggestHandle('Maya Iyer')).toBe('maya_iyer');
    expect(suggestHandle('Zoë Ramírez')).toBe('zoe_ramirez');
    expect(suggestHandle('  Dr. A.  ')).toBe('dr_a');
    expect(suggestHandle('李')).toBe(''); // nothing usable: the person types their own
  });
});

describe('the 404 screen', () => {
  it('names the missing path and offers a way home', () => {
    render(
      <Provider store={createAppStore()}>
        <MemoryRouter initialEntries={['/nowhere/at-all']}>
          <NotFoundPage />
        </MemoryRouter>
      </Provider>,
    );
    expect(
      screen.getByRole('heading', { name: 'This island isn’t on the map' }),
    ).toBeInTheDocument();
    expect(screen.getByText('/nowhere/at-all')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to the isles/ })).toHaveAttribute('href', '/');
    expect(screen.getByRole('button', { name: /Go back/ })).toBeInTheDocument();
  });
});

describe('the crash screen', () => {
  function Boom(): never {
    throw new Error('kaboom');
  }
  function App() {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    return (
      <>
        <button type="button" onClick={() => navigate('/fine')}>
          Somewhere else
        </button>
        <ErrorBoundary resetKey={pathname}>
          <Routes>
            <Route path="/broken" element={<Boom />} />
            <Route path="/fine" element={<p>All good</p>} />
          </Routes>
        </ErrorBoundary>
      </>
    );
  }

  it('replaces a crashed screen, and recovers when the route changes', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <MemoryRouter initialEntries={['/broken']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Gloom got into the gears' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reload/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Somewhere else' }));
    expect(screen.getByText('All good')).toBeInTheDocument();
  });
});

describe('notifications', () => {
  it('pause while hovered, then leave on their own', () => {
    vi.useFakeTimers();
    const store = createAppStore();
    render(
      <Provider store={store}>
        <Toaster />
      </Provider>,
    );
    act(() => {
      store.dispatch(toastAdded('success', 'Lesson saved.'));
    });
    const toast = screen.getByText('Lesson saved.').closest('li')!;
    fireEvent.mouseEnter(toast);
    act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByText('Lesson saved.')).toBeInTheDocument();
    fireEvent.mouseLeave(toast);
    act(() => vi.advanceTimersByTime(4_100)); // the countdown finishes…
    act(() => vi.advanceTimersByTime(300)); // …and it slides out
    expect(screen.queryByText('Lesson saved.')).not.toBeInTheDocument();
  });

  it('can be dismissed', async () => {
    const store = createAppStore();
    render(
      <Provider store={store}>
        <Toaster />
      </Provider>,
    );
    act(() => {
      store.dispatch(toastAdded('error', 'Could not upload.'));
    });
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    await vi.waitFor(() => expect(screen.queryByText('Could not upload.')).not.toBeInTheDocument());
  });
});

describe('reset password', () => {
  it('explains an expired link and offers a new one', async () => {
    const { ResetPasswordPage } = await import('../src/features/auth/PasswordPages');
    const store = createAppStore();
    store.dispatch({ type: 'auth/profileLoaded', payload: null });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/reset-password']}>
          <ResetPasswordPage />
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.getByRole('heading', { name: 'This link has expired' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Send a new link' })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
  });
});
