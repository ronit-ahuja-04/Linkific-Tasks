import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { createAppStore } from '../src/app/store';
import { MotionProvider } from '../src/components/MotionProvider';
import { clearAuth, setSessionUser } from '../src/features/auth/authSlice';
import { AppRouter } from '../src/routes/AppRouter';

function renderAt(route: string) {
  const store = createAppStore();
  render(
    <Provider store={store}>
      <MotionProvider>
        <MemoryRouter initialEntries={[route]}>
          <AppRouter />
        </MemoryRouter>
      </MotionProvider>
    </Provider>,
  );
  return { store };
}

describe('SkillForge LMS Phase 1', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders the RPG hero, Pip SVG, and primary navigation', async () => {
    renderAt('/');
    expect(screen.getByRole('heading', { name: /Turn every course into a/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Pip, a sprite/i })).toBeInTheDocument();

    const nav = screen.getByRole('navigation', { name: 'Primary navigation' });
    expect(within(nav).getByRole('link', { name: 'Catalog' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Guild Hall' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'My Learning' })).toBeInTheDocument();

    expect(await screen.findByText(/React Architecture & Design Patterns/i)).toBeInTheDocument();
  });

  it('toggles dark theme in Redux store and document root', async () => {
    const user = userEvent.setup();
    const { store } = renderAt('/');

    expect(store.getState().ui.theme).toBe('light');
    await user.click(screen.getByRole('button', { name: /Switch to dark theme/i }));
    expect(store.getState().ui.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('filters Course Realms in /courses and supports filter reset', async () => {
    const user = userEvent.setup();
    renderAt('/courses');

    expect(await screen.findByText('React Architecture & Design Patterns')).toBeInTheDocument();
    const search = screen.getByLabelText('Search realms');
    await user.type(search, 'Supabase');

    expect(screen.getByText('Supabase & Postgres Security Mastery')).toBeInTheDocument();
    expect(screen.queryByText('React Architecture & Design Patterns')).not.toBeInTheDocument();

    await user.type(search, 'zzzzz');
    expect(screen.getByText(/No Course Realms match those filters/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reset Filters' }));
    expect(screen.getByText('React Architecture & Design Patterns')).toBeInTheDocument();
  });

  it('renders The Guild Hall leaderboard and public character sheet', async () => {
    renderAt('/guild');
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Maya Sharma')).toBeInTheDocument();

    renderAt('/c/maya');
    expect(await screen.findByRole('heading', { name: 'Maya Sharma' })).toBeInTheDocument();
    expect(screen.getByText('First Quest')).toBeInTheDocument();
  });

  it('enforces role-based access for student vs admin routes and updates auth state', async () => {
    const user = userEvent.setup();
    const { store } = renderAt('/login');

    await user.click(screen.getByRole('button', { name: 'Student (@maya)' }));
    expect(
      await screen.findByRole('heading', { name: 'Student Command Center' }),
    ).toBeInTheDocument();
    expect(store.getState().auth.profile?.handle).toBe('maya');

    const nav = screen.getByRole('navigation', { name: 'Primary navigation' });
    expect(within(nav).queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();

    act(() => {
      store.dispatch(
        setSessionUser({
          userId: '44444444-4444-4444-8444-444444444444',
          email: 'admin@skillforge.local',
          profile: {
            id: '44444444-4444-4444-8444-444444444444',
            handle: 'alex',
            fullName: 'Alex Mercer',
            role: 'admin',
            characterClass: 'design_bard',
            pipTint: 5,
            pipAccessory: 1,
            bio: '',
            avatarUrl: null,
            createdAt: '2026-11-26T00:00:00.000Z',
          },
        }),
      );
    });

    expect(await within(nav).findByRole('link', { name: 'Studio' })).toBeInTheDocument();
    expect(await within(nav).findByRole('link', { name: 'Admin' })).toBeInTheDocument();

    act(() => {
      store.dispatch(clearAuth());
    });
    expect(store.getState().auth.userId).toBeNull();
  });

  it('blocks student role from accessing /admin route directly', async () => {
    const store = createAppStore({
      auth: {
        userId: '22222222-2222-4222-8222-222222222222',
        email: 'maya@skillforge.local',
        mode: 'demo',
        status: 'ready',
        error: null,
        profile: {
          id: '22222222-2222-4222-8222-222222222222',
          handle: 'maya',
          fullName: 'Maya Sharma',
          role: 'student',
          characterClass: 'frontend_mage',
          pipTint: 1,
          pipAccessory: 4,
          bio: '',
          avatarUrl: null,
          createdAt: '2026-11-26T00:00:00.000Z',
        },
      },
    });
    render(
      <Provider store={store}>
        <MotionProvider>
          <MemoryRouter initialEntries={['/admin']}>
            <AppRouter />
          </MemoryRouter>
        </MotionProvider>
      </Provider>,
    );
    expect(await screen.findByText(/Restricted Guild Zone/i)).toBeInTheDocument();
  });

  it('toggles sound FX and solves interactive Home Micro-Quest Arcade challenges', async () => {
    const user = userEvent.setup();
    const { store } = renderAt('/');

    await user.click(screen.getByRole('button', { name: 'Mute sound effects' }));
    expect(store.getState().ui.soundEnabled).toBe(false);
    expect(screen.getByRole('button', { name: 'Enable sound effects' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tap Pip companion on landing page' }));
    expect(screen.getByText(/Pip Joy Combo x1!/i)).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: /Using array index as key instead of quest\.id breaks DOM identity/i,
      }),
    );
    expect(await screen.findByText(/Quest Challenge Cleared!/i)).toBeInTheDocument();
    expect(store.getState().quest.sessionEarnedXp).toBeGreaterThanOrEqual(40);
  });

  it('plays the Winding Quest Map, solves node challenges, and shows RewardOverlay', async () => {
    const user = userEvent.setup();
    const { store } = renderAt('/courses/react-architecture-design-patterns');

    const nodeTwoBtn = await screen.findByRole('button', {
      name: /Derived State Beats Mirrored State/i,
    });
    await user.click(nodeTwoBtn);
    await user.click(
      await screen.findByRole('button', { name: /const progress = progressFor\(totalXp, 100\);/i }),
    );
    await user.click(screen.getByRole('button', { name: /Claim \+100 XP & Advance/i }));
    expect(
      await screen.findByRole('heading', { name: /Quest Node Cleared!/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Back to Quest Path/i }));
    expect(store.getState().quest.completedLessonIds).toContain('node-react-2');
  });

  it('renders the interactive Student Command Center with Daily Brain Sprint', async () => {
    const store = createAppStore({
      auth: {
        userId: '22222222-2222-4222-8222-222222222222',
        email: 'maya@skillforge.local',
        mode: 'demo',
        status: 'ready',
        error: null,
        profile: {
          id: '22222222-2222-4222-8222-222222222222',
          handle: 'maya',
          fullName: 'Maya Sharma',
          role: 'student',
          characterClass: 'frontend_mage',
          pipTint: 1,
          pipAccessory: 4,
          bio: '',
          avatarUrl: null,
          createdAt: '2026-11-26T00:00:00.000Z',
        },
      },
    });
    render(
      <Provider store={store}>
        <MotionProvider>
          <MemoryRouter initialEntries={['/dashboard']}>
            <AppRouter />
          </MemoryRouter>
        </MotionProvider>
      </Provider>,
    );
    expect(
      await screen.findByRole('heading', { name: 'Student Command Center' }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/Daily Brain Sprint/i)).toBeInTheDocument();
  });
});
