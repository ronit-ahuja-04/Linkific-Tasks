import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Guardian, Wisp } from '../src/components/characters';
import { Button } from '../src/components/ui';
import { validateSignIn, validateSignUp } from '../src/features/auth/validation';
import { AppError, toAppError } from '../src/lib/errors';
import { levelForLight, levelProgress, lightForLevel, stageForLevel } from '../src/lib/game/level';

describe('characters', () => {
  it('Wisp announces its mood to screen readers', () => {
    render(<Wisp mood="think" />);
    expect(screen.getByRole('img', { name: 'Wisp, thinking' })).toBeInTheDocument();
  });

  it('a decorative Wisp is hidden from screen readers', () => {
    const { container } = render(<Wisp decorative />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('Wisp takes its colours from its stage', () => {
    const { container } = render(<Wisp stage="beacon" />);
    expect(container.querySelector('svg')).toHaveAttribute('data-stage', 'beacon');
  });

  it('each island shows its own guardian, and an unknown one stays a mystery', () => {
    render(
      <>
        <Guardian guardian="byte" />
        <Guardian guardian="nova" />
        <Guardian guardian="mystery" />
      </>,
    );
    expect(screen.getByRole('img', { name: 'Byte, the robot crab' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Nova, the astronaut axolotl' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'A hidden guardian' })).toBeInTheDocument();
  });
});

describe('levels and Wisp stages', () => {
  it('levels need gently more Light each time', () => {
    expect(lightForLevel(1)).toBe(0);
    expect(lightForLevel(2)).toBe(100);
    expect(lightForLevel(3)).toBe(300);
    expect(levelForLight(0)).toBe(1);
    expect(levelForLight(99)).toBe(1);
    expect(levelForLight(100)).toBe(2);
    expect(levelProgress(200)).toBeCloseTo(0.5);
  });

  it('Wisp grows: Spark, Wisp, Lantern, Beacon', () => {
    expect([1, 4, 5, 9, 10, 19, 20].map(stageForLevel)).toEqual([
      'spark',
      'spark',
      'wisp',
      'wisp',
      'lantern',
      'lantern',
      'beacon',
    ]);
  });
});

describe('form validation', () => {
  it('sign-in needs a real-looking email and a password', () => {
    expect(validateSignIn({ email: 'nope', password: '' })).toEqual({
      email: 'Enter an email like name@example.com.',
      password: 'Enter your password.',
    });
    expect(validateSignIn({ email: 'maya@lumo.local', password: 'x' })).toEqual({});
  });

  it('sign-up checks the same rules as the database', () => {
    const errors = validateSignUp({
      displayName: ' ',
      handle: 'Ma',
      email: 'a@b',
      password: 'short',
    });
    expect(Object.keys(errors).sort()).toEqual(['displayName', 'email', 'handle', 'password']);
    expect(
      validateSignUp({
        displayName: 'Maya',
        handle: 'maya_codes',
        email: 'maya@lumo.local',
        password: 'long enough',
      }),
    ).toEqual({});
  });
});

describe('error model', () => {
  it('turns database and auth errors into messages people can act on', () => {
    expect(
      toAppError({ code: 'invalid_credentials', message: 'Invalid login credentials' }).kind,
    ).toBe('auth');
    expect(toAppError({ code: '42501', message: 'permission denied' }).kind).toBe('forbidden');
    expect(
      toAppError({
        code: '23505',
        message: 'duplicate key value violates unique constraint "profiles_handle_key"',
      }).message,
    ).toBe('That handle is taken.');
    expect(toAppError({ code: 'P0002' }).kind).toBe('not_found');
    expect(toAppError(new TypeError('Failed to fetch')).kind).toBe('offline');
    expect(toAppError({ code: 'weird' })).toBeInstanceOf(AppError);
  });
});

describe('Button', () => {
  it('while loading it stays focusable but ignores clicks', async () => {
    const onClick = vi.fn();
    render(
      <Button loading loadingText="Saving…" onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Saving…' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
