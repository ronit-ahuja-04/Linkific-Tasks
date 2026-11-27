import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { createAppStore } from '../src/app/store';
import { PageHeader } from '../src/components/layout';
import { MotionProvider } from '../src/components/MotionProvider';
import { Button } from '../src/components/ui';
import { AppRouter } from '../src/routes/AppRouter';

function renderRoute(route: string, preloadedStudent = false) {
  const store = createAppStore(
    preloadedStudent
      ? {
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
        }
      : undefined,
  );

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

describe('SkillForge Layout & Routing', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders semantic Footer with quick navigation and UI Component Library link', async () => {
    renderRoute('/');
    const footer = await screen.findByRole('contentinfo');

    expect(within(footer).getByRole('link', { name: 'Course Realms Catalog' })).toHaveAttribute(
      'href',
      '/courses',
    );
    expect(within(footer).getByRole('link', { name: 'UI Component Library' })).toHaveAttribute(
      'href',
      '/components',
    );
    expect(within(footer).getByRole('link', { name: 'Forge Adventurer' })).toHaveAttribute(
      'href',
      '/register',
    );
  });

  it('renders a dedicated 404 page on unknown routes instead of silently redirecting', async () => {
    renderRoute('/does-not-exist/secret-dungeon');

    expect(await screen.findByText(/404 · Uncharted Territory/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Realm Not Found' })).toBeInTheDocument();
    expect(screen.getByText('/does-not-exist/secret-dungeon')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Return Home/i })).toHaveAttribute('href', '/');
  });

  it('handles unknown dynamic slugs gracefully', async () => {
    renderRoute('/courses/unknown-realm-slug');
    expect(
      await screen.findByRole('heading', { name: 'Realm Not Discovered Yet' }),
    ).toBeInTheDocument();
  });

  it('handles unknown character handles gracefully', async () => {
    renderRoute('/c/ghost-adventurer');
    expect(
      await screen.findByRole('heading', { name: 'Adventurer Not Found' }),
    ).toBeInTheDocument();
  });

  it('redirects unauthenticated users from protected routes to /login', async () => {
    renderRoute('/dashboard');
    expect(
      await screen.findByRole('heading', { name: 'Sign In to SkillForge' }),
    ).toBeInTheDocument();
  });

  it('blocks students from /instructor route', async () => {
    renderRoute('/instructor', true);
    expect(await screen.findByText(/Restricted Guild Zone/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Access Requires instructor \/ admin/i }),
    ).toBeInTheDocument();
  });

  it('signs out cleanly from Navbar, clears auth state, and shows feedback toast', async () => {
    const user = userEvent.setup();
    const { store } = renderRoute('/dashboard', true);

    expect(
      await screen.findByRole('heading', { name: 'Student Command Center' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(store.getState().auth.userId).toBeNull();
    expect(await screen.findByText(/Signed out cleanly/i)).toBeInTheDocument();
  });

  it('renders PageHeader with back breadcrumb and action slot', () => {
    render(
      <MemoryRouter>
        <PageHeader
          eyebrow="Guild Studio"
          title="Character Forge"
          description="Edit your Pip look."
          backTo={{ to: '/dashboard', label: 'Back to Dashboard' }}
          actions={<Button size="sm">Save</Button>}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Back to Dashboard' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
    expect(screen.getByRole('heading', { name: 'Character Forge' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });
});
