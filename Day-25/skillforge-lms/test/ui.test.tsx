import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sparkles } from 'lucide-react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { createAppStore } from '../src/app/store';
import { MotionProvider } from '../src/components/MotionProvider';
import { AppRouter } from '../src/routes/AppRouter';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  ErrorState,
  Input,
  LoadingState,
  Modal,
  Select,
  Textarea,
} from '../src/components/ui';

describe('SkillForge UI Component Library', () => {
  it('renders Button variants, icons, and accessible loading state', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <div>
        <Button variant="gold" size="lg" leftIcon={<Sparkles />} onClick={onClick}>
          Launch Quest
        </Button>
        <Button loading loadingText="Submitting...">
          Submit
        </Button>
      </div>,
    );

    const launchBtn = screen.getByRole('button', { name: 'Launch Quest' });
    await user.click(launchBtn);
    expect(onClick).toHaveBeenCalledTimes(1);

    const loadingBtn = screen.getByRole('button', { name: 'Submitting...' });
    expect(loadingBtn).toBeDisabled();
    expect(loadingBtn).toHaveAttribute('aria-busy', 'true');
  });

  it('renders Card sections and Badge tones', () => {
    render(
      <Card as="article" variant="elevated" padding="none">
        <CardHeader>
          <Badge tone="good">Cleared</Badge>
        </CardHeader>
        <CardBody>Quest body</CardBody>
        <CardFooter>Footer meta</CardFooter>
      </Card>,
    );

    expect(screen.getByRole('article')).toBeInTheDocument();
    expect(screen.getByText('Cleared')).toBeInTheDocument();
    expect(screen.getByText('Quest body')).toBeInTheDocument();
    expect(screen.getByText('Footer meta')).toBeInTheDocument();
  });

  it('wires Input, Select, and Textarea labels, hints, and validation errors', () => {
    render(
      <div>
        <Input
          label="Guild Handle"
          hint="Lowercase letters and numbers"
          error="Handle is too short"
        />
        <Select
          label="Role"
          options={[
            { value: 'student', label: 'Student' },
            { value: 'instructor', label: 'Instructor' },
          ]}
        />
        <Textarea label="Bio" hint="Optional motto" />
      </div>,
    );

    const handleInput = screen.getByLabelText('Guild Handle');
    expect(handleInput).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Handle is too short');

    expect(screen.getByLabelText('Role')).toHaveValue('student');
    expect(screen.getByLabelText('Bio')).toHaveAccessibleDescription('Optional motto');
  });

  it('opens Modal, handles Escape and close button dismissal', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <MotionProvider>
        <Modal open title="Realm Certificate" description="Issued by Guild" onClose={onClose}>
          <p>Certificate body</p>
        </Modal>
      </MotionProvider>,
    );

    expect(screen.getByRole('dialog', { name: 'Realm Certificate' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('renders LoadingState variants and ErrorState with retry action', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <div>
        <LoadingState variant="skeleton-cards" count={2} label="Loading courses..." />
        <ErrorState
          variant="panel"
          code="ERR_NETWORK"
          title="Connection Lost"
          message="Could not sync quest progress."
          onRetry={onRetry}
          actionLabel="Retry Sync"
        />
      </div>,
    );

    expect(screen.getByRole('status', { name: 'Loading courses...' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not sync quest progress.');
    await user.click(screen.getByRole('button', { name: 'Retry Sync' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders interactive ComponentLibraryPage showcase at /components', async () => {
    const user = userEvent.setup();
    const store = createAppStore();

    render(
      <Provider store={store}>
        <MotionProvider>
          <MemoryRouter initialEntries={['/components']}>
            <AppRouter />
          </MemoryRouter>
        </MotionProvider>
      </Provider>,
    );

    expect(
      await screen.findByRole('heading', { name: /Component Library & Design System/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open Demo Modal' }));
    expect(screen.getByRole('dialog', { name: 'Guild Component Modal' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirm Quest' }));
    await waitForElementToBeRemoved(() =>
      screen.queryByRole('dialog', { name: 'Guild Component Modal' }),
    );

    await user.click(screen.getByRole('button', { name: 'Trigger Error State' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Could not reach local Supabase node');
  });
});
