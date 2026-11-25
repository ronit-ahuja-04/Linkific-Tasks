// @vitest-environment jsdom
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AuthContext } from '../src/auth/AuthContext';
import { ToastProvider } from '../src/context/ToastContext';
import { EXAMPLES } from '../src/lib/lab/examples';
import LabPage from '../src/pages/LabPage';
import { createFakeClient } from './helpers/notes-fake';
import { expectToast } from './helpers/toast';

function setup(respond) {
  const fake = createFakeClient();
  if (respond) fake.respond = respond;
  render(<AuthContext.Provider value={{ client: fake, user: { id: 'me' } }}><ToastProvider><LabPage /></ToastProvider></AuthContext.Provider>);
  return fake;
}

describe('LabPage', () => {
  it('lists every example with its code and SQL and sets the title', () => {
    setup();
    expect(document.title).toBe('Query lab · Huddle');
    expect(screen.getAllByRole('article')).toHaveLength(EXAMPLES.length);
    expect(screen.getByLabelText('Code for .eq(): equals').textContent).toContain(".eq('visibility', 'team')");
    expect(screen.getByLabelText('SQL for .eq(): equals').textContent).toContain("where visibility = 'team'");
  });

  it('filters the examples by topic', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: /Row Level Security demos/ }));
    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(EXAMPLES.filter((e) => e.group === 'rls').length);
    expect(screen.getByRole('button', { name: /Row Level Security demos/ }).getAttribute('aria-pressed')).toBe('true');
  });

  it('runs an example and shows the rows in a table', async () => {
    const user = userEvent.setup();
    const fake = setup(() => ({ data: [{ id: 'a', title: 'Hello' }, { id: 'b', title: 'World' }], error: null }));
    await user.click(screen.getByRole('button', { name: 'Run .eq(): equals' }));
    const article = screen.getAllByRole('article').find((a) => within(a).queryByRole('heading', { name: '.eq(): equals' }));
    expect(await within(article).findByRole('table')).toBeTruthy();
    expect(within(article).getByText('World')).toBeTruthy();
    expect(within(article).getByText('2 rows')).toBeTruthy();
    expect(fake.calls[0].table).toBe('notes');
  });

  it('shows an error returned by the database', async () => {
    const user = userEvent.setup();
    setup(() => ({ data: null, error: { code: '42501', message: 'denied' } }));
    await user.click(screen.getByRole('button', { name: 'Run .eq(): equals' }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/42501: denied/);
  });

  it('shows "what RLS did" after an RLS demo runs, with the empty-not-error explanation', async () => {
    const user = userEvent.setup();
    setup(() => ({ data: [], error: null }));
    await user.click(screen.getByRole('button', { name: "Run Read someone else's private note" }));
    expect(await screen.findByText(/What RLS did/)).toBeTruthy();
    expect(screen.getByText(/0 rows, and no error/)).toBeTruthy();
  });

  it('explains when an example has nothing to work with', async () => {
    const user = userEvent.setup();
    setup(() => ({ data: [], error: null }));
    await user.click(screen.getByRole('button', { name: "Run Update someone else's note" }));
    expect(await screen.findByText(/No team note by another user/)).toBeTruthy();
    expect(screen.queryByText(/What RLS did/)).toBeNull();
  });

  it('disables the Run button while a request is pending', async () => {
    const user = userEvent.setup();
    let release;
    setup(() => new Promise((resolve) => { release = () => resolve({ data: [], error: null }); }));
    const button = screen.getByRole('button', { name: 'Run .eq(): equals' });
    await user.click(button);
    expect(button.disabled).toBe(true);
    await act(async () => release());
    expect(button.disabled).toBe(false);
  });

  it('cleans up leftover scratch notes on request', async () => {
    const user = userEvent.setup();
    const fake = setup();
    await user.click(screen.getByRole('button', { name: 'Remove leftover scratch notes' }));
    expect(fake.calls[0].ops).toContainEqual(['like', 'title', 'lab-scratch-%']);
    await expectToast('Scratch notes removed');
  });
});
