// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CountBadge from '../src/components/ui/CountBadge';
import EmptyState from '../src/components/ui/EmptyState';
import PageHeader from '../src/components/ui/PageHeader';
import RelativeTime from '../src/components/ui/RelativeTime';
import UnderTheHood from '../src/components/ui/UnderTheHood';
import { ThemeProvider } from '../src/context/ThemeContext';
import { fullDateTime, relativeTime } from '../src/lib/format';

const NOW = new Date('2026-11-23T12:00:00Z');
const ago = (seconds) => new Date(NOW.getTime() - seconds * 1000);

describe('relativeTime', () => {
  it('reads the way people say it', () => {
    expect(relativeTime(ago(10), NOW, 'en')).toBe('just now');
    expect(relativeTime(ago(5 * 60), NOW, 'en')).toBe('5 minutes ago');
    expect(relativeTime(ago(3 * 3600), NOW, 'en')).toBe('3 hours ago');
    expect(relativeTime(ago(26 * 3600), NOW, 'en')).toBe('yesterday');
    expect(relativeTime(ago(12 * 24 * 3600), NOW, 'en')).toBe('2 weeks ago');
    expect(relativeTime(new Date(NOW.getTime() + 2 * 3600 * 1000), NOW, 'en')).toBe('in 2 hours');
  });

  it('returns an empty string for a date it can not read', () => {
    expect(relativeTime('nonsense', NOW)).toBe('');
    expect(fullDateTime('nonsense')).toBe('');
  });
});

describe('RelativeTime', () => {
  it('shows the friendly time, keeps the exact one in dateTime and on hover', () => {
    render(<RelativeTime date={ago(2 * 24 * 3600)} now={NOW} />);
    const time = screen.getByText(/2 days ago/);
    expect(time.tagName).toBe('TIME');
    expect(time).toHaveProperty('dateTime', ago(2 * 24 * 3600).toISOString());
    expect(time.getAttribute('title')).toBe(fullDateTime(ago(2 * 24 * 3600)));
  });

  it('renders nothing without a valid date', () => {
    const { container } = render(<><RelativeTime date={null} /><RelativeTime date="nope" /></>);
    expect(container.innerHTML).toBe('');
  });
});

describe('CountBadge', () => {
  it('shows the number, and gives screen readers words instead', () => {
    render(<CountBadge count={3} attention label="3 unread mentions" />);
    expect(screen.getByText('3 unread mentions')).toHaveProperty('className', 'sr-only');
    expect(screen.getByText('3').getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByText('3').parentElement.className).toBe('count count-attention');
  });

  it('caps large numbers and hides itself at zero', () => {
    const { container, rerender } = render(<CountBadge count={140} />);
    expect(container.textContent).toBe('99+');
    rerender(<CountBadge count={0} />);
    expect(container.innerHTML).toBe('');
  });
});

describe('EmptyState and PageHeader', () => {
  it('EmptyState: heading at the level asked for, text and one action', () => {
    render(<EmptyState headingLevel={2} title="No notes yet" action={<button type="button">New note</button>}>Notes you write show up here.</EmptyState>);
    expect(screen.getByRole('heading', { level: 2, name: 'No notes yet' })).toBeTruthy();
    expect(screen.getByText('Notes you write show up here.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'New note' })).toBeTruthy();
  });

  it('PageHeader: an h1 by default, with description and actions', () => {
    render(<PageHeader title="Notes" description="Write things down." actions={<button type="button">New note</button>} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Notes' })).toBeTruthy();
    expect(screen.getByText('Write things down.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'New note' })).toBeTruthy();
  });
});

describe('UnderTheHood', () => {
  it('starts collapsed and opens from its summary', async () => {
    const { container } = render(<UnderTheHood><p>The supabase-js calls</p></UnderTheHood>);
    const details = container.querySelector('details');
    expect(details.open).toBe(false);
    expect(screen.getByText('Under the hood').closest('summary')).toBeTruthy();
    await userEvent.click(screen.getByText('Under the hood'));
    expect(details.open).toBe(true);
  });
});

describe('theme', () => {
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
    document.documentElement.removeAttribute('data-theme');
  });
  const stubSystemDark = (dark) => vi.stubGlobal('matchMedia', (query) => ({ matches: dark && query.includes('dark'), media: query, addEventListener() {}, removeEventListener() {} }));

  it('follows the system setting when nothing is saved', () => {
    stubSystemDark(true);
    render(<ThemeProvider><span /></ThemeProvider>);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('a saved choice wins over the system setting', () => {
    stubSystemDark(true);
    localStorage.setItem('huddle-theme', 'light');
    render(<ThemeProvider><span /></ThemeProvider>);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
