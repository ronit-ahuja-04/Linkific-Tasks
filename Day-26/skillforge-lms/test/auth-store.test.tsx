import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { createAppStore } from '../src/app/store';
import { MotionProvider } from '../src/components/MotionProvider';
import {
  clearAuthError,
  hydrateAuth,
  registerUser,
  saveCharacterProfile,
  signInUser,
  signOutUser,
} from '../src/features/auth/authSlice';
import {
  fetchRealms,
  resetCatalogFilters,
  setCatalogCategory,
  setCatalogLevel,
  setCatalogQuery,
  setCatalogSkillTag,
  setCatalogSort,
} from '../src/features/catalog/catalogSlice';
import {
  claimRealmCertificate,
  completeQuestNode,
  enrollInRealm,
  passRealmBoss,
  solveArcadeChallenge,
} from '../src/features/quest/questSlice';
import {
  dismissToast,
  hydrateUiPrefs,
  pushToast,
  setTheme,
  toggleSound,
  toggleTheme,
} from '../src/features/ui/uiSlice';
import { AppRouter } from '../src/routes/AppRouter';

function renderRoute(route: string, preloadedStore = createAppStore()) {
  render(
    <Provider store={preloadedStore}>
      <MotionProvider>
        <MemoryRouter initialEntries={[route]}>
          <AppRouter />
        </MemoryRouter>
      </MotionProvider>
    </Provider>,
  );
  return preloadedStore;
}

describe('Redux Store, Auth Persistence & Slices', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('persists demo auth session across store instances and clears on sign-out', async () => {
    const store1 = createAppStore();
    await store1.dispatch(
      signInUser({ email: 'maya@skillforge.local', password: 'secret', rememberMe: true }),
    );
    expect(store1.getState().auth.profile?.handle).toBe('maya');
    expect(window.localStorage.getItem('skillforge_demo_profile')).toBeTruthy();

    const store2 = createAppStore();
    await store2.dispatch(hydrateAuth());
    expect(store2.getState().auth.profile?.handle).toBe('maya');

    await store2.dispatch(signOutUser());
    expect(store2.getState().auth.userId).toBeNull();
    expect(window.localStorage.getItem('skillforge_demo_profile')).toBeNull();
  });

  it('uses sessionStorage when rememberMe is false and hydrates properly', async () => {
    const store1 = createAppStore();
    await store1.dispatch(
      signInUser({ email: 'dev@skillforge.local', password: 'secret', rememberMe: false }),
    );
    expect(window.localStorage.getItem('skillforge_demo_profile')).toBeNull();
    expect(window.sessionStorage.getItem('skillforge_demo_profile')).toBeTruthy();

    const store2 = createAppStore();
    await store2.dispatch(hydrateAuth());
    expect(store2.getState().auth.profile?.handle).toBe('dev');
    expect(store2.getState().auth.profile?.role).toBe('instructor');
  });

  it('handles invalid credentials, registration, profile update, and error clearing', async () => {
    const store = createAppStore();

    await store.dispatch(signInUser({ email: 'unknown@skillforge.local', password: '123' }));
    expect(store.getState().auth.status).toBe('error');
    expect(store.getState().auth.error?.code).toBe('invalid_credentials');

    store.dispatch(clearAuthError());
    expect(store.getState().auth.error).toBeNull();

    await store.dispatch(
      registerUser({
        email: 'aria@skillforge.local',
        password: 'password123',
        fullName: 'Aria Vance',
        handle: 'aria',
        characterClass: 'fullstack_ranger',
        pipTint: 2,
        pipAccessory: 3,
      }),
    );
    expect(store.getState().auth.profile?.handle).toBe('aria');

    await store.dispatch(
      saveCharacterProfile({
        userId: 'demo-aria',
        params: {
          fullName: 'Aria V.',
          bio: 'TypeScript & RLS hero',
          characterClass: 'backend_knight',
          pipTint: 4,
          pipAccessory: 1,
        },
      }),
    );
    expect(store.getState().auth.profile?.characterClass).toBe('backend_knight');
    expect(store.getState().auth.profile?.bio).toBe('TypeScript & RLS hero');
  });

  it('persists UI theme and sound preferences and manages toast queue', () => {
    const store1 = createAppStore();
    store1.dispatch(setTheme('dark'));
    store1.dispatch(toggleSound());
    store1.dispatch(pushToast({ id: 't1', kind: 'success', text: 'Saved!' }));
    expect(store1.getState().ui.toasts).toHaveLength(1);
    store1.dispatch(dismissToast('t1'));
    expect(store1.getState().ui.toasts).toHaveLength(0);

    const store2 = createAppStore();
    store2.dispatch(hydrateUiPrefs());
    expect(store2.getState().ui.theme).toBe('dark');
    expect(store2.getState().ui.soundEnabled).toBe(false);

    store2.dispatch(toggleTheme());
    expect(store2.getState().ui.theme).toBe('light');
  });

  it('manages catalog filters and anti-farming quest XP deltas cleanly', async () => {
    const store = createAppStore();
    await store.dispatch(fetchRealms());
    expect(store.getState().catalog.realms.length).toBeGreaterThanOrEqual(4);

    store.dispatch(setCatalogQuery('React'));
    store.dispatch(setCatalogCategory('Frontend'));
    store.dispatch(setCatalogLevel('intermediate'));
    store.dispatch(setCatalogSkillTag('react'));
    store.dispatch(setCatalogSort('rating'));
    expect(store.getState().catalog.filters.query).toBe('React');

    store.dispatch(resetCatalogFilters());
    expect(store.getState().catalog.filters.query).toBe('');

    store.dispatch(enrollInRealm('c2222222-2222-4222-8222-222222222222'));
    store.dispatch(solveArcadeChallenge({ challengeId: 'arcade-1', xpReward: 40 }));
    expect(store.getState().quest.sessionEarnedXp).toBe(40);

    store.dispatch(
      completeQuestNode({
        lessonId: 'node-test-1',
        courseId: 'c2222222-2222-4222-8222-222222222222',
        lessonTitle: 'RLS Basics',
        xpReward: 100,
        baseUserXp: 720,
        baseCompletedLessons: 5,
        basePassedQuizzes: 1,
        baseCertificates: 0,
        streakDays: 4,
        pipTint: 1,
        pipAccessory: 4,
      }),
    );
    expect(store.getState().quest.sessionEarnedXp).toBe(140);

    // Replaying same node grants 0 extra XP (anti-farming)
    store.dispatch(
      completeQuestNode({
        lessonId: 'node-test-1',
        courseId: 'c2222222-2222-4222-8222-222222222222',
        lessonTitle: 'RLS Basics',
        xpReward: 100,
        baseUserXp: 720,
        baseCompletedLessons: 5,
        basePassedQuizzes: 1,
        baseCertificates: 0,
        streakDays: 4,
        pipTint: 1,
        pipAccessory: 4,
      }),
    );
    expect(store.getState().quest.sessionEarnedXp).toBe(140);

    store.dispatch(
      passRealmBoss({
        courseId: 'c2222222-2222-4222-8222-222222222222',
        courseTitle: 'Supabase Security',
        bossName: 'Gatekeeper',
        scorePercent: 80,
        xpReward: 250,
        baseUserXp: 720,
        baseCompletedLessons: 6,
        basePassedQuizzes: 1,
        baseCertificates: 0,
        streakDays: 4,
        pipTint: 1,
        pipAccessory: 4,
      }),
    );
    expect(store.getState().quest.sessionEarnedXp).toBe(390);

    store.dispatch(
      claimRealmCertificate({
        courseId: 'c2222222-2222-4222-8222-222222222222',
        courseTitle: 'Supabase Security',
        baseUserXp: 720,
        pipTint: 1,
        pipAccessory: 4,
      }),
    );
    expect(store.getState().quest.claimedCertificateIds).toContain(
      'c2222222-2222-4222-8222-222222222222',
    );
  });

  it('validates LoginPage fields, toggles password visibility, and signs up on RegisterPage', async () => {
    const user = userEvent.setup();
    renderRoute('/login');

    const passwordField = screen.getByLabelText('Password');
    expect(passwordField).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(passwordField).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Enter SkillForge' }));
    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 4 characters.')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Create your character' }));
    expect(
      await screen.findByRole('heading', { name: 'Forge Your Adventurer' }),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText('Full Name'), 'Sam Patel');
    await user.type(screen.getByLabelText('Guild Handle'), 'sam_p');
    await user.type(screen.getByLabelText('Email'), 'sam@skillforge.local');
    await user.type(screen.getByLabelText('Password'), 'hunter22');
    await user.click(screen.getByRole('button', { name: 'Start My Quest' }));

    expect(
      await screen.findByRole('heading', { name: 'Student Command Center' }),
    ).toBeInTheDocument();
  });

  it('renders AuthCallbackPage errors and redirects when session exists', async () => {
    renderRoute('/auth/callback?error_description=Access%20denied%20by%20user');
    expect(
      await screen.findByRole('heading', { name: 'GitHub Sign-In Cancelled' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Access denied by user')).toBeInTheDocument();

    window.localStorage.setItem(
      'skillforge_demo_profile',
      JSON.stringify({
        email: 'maya@skillforge.local',
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
      }),
    );

    const store = createAppStore();
    render(
      <Provider store={store}>
        <MotionProvider>
          <MemoryRouter initialEntries={['/auth/callback']}>
            <AppRouter />
          </MemoryRouter>
        </MotionProvider>
      </Provider>,
    );
    expect(
      await screen.findByRole('heading', { name: 'Student Command Center' }),
    ).toBeInTheDocument();
  });
});
