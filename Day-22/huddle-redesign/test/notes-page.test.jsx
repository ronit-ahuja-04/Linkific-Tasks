// @vitest-environment jsdom
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AuthContext } from '../src/auth/AuthContext';
import { ToastProvider } from '../src/context/ToastContext';
import NotesPage from '../src/pages/NotesPage';
import { createFakeClient } from './helpers/notes-fake';

const note = (patch) => ({
  id: 'n1', owner_id: 'me', title: 'My plan', body: 'Body text', visibility: 'private', pinned: false, priority: 2,
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-02T00:00:00Z',
  owner: { username: 'ada', full_name: 'Ada', avatar_path: null }, note_tags: [{ tags: { id: 't1', name: 'work' } }], ...patch,
});

function setup({ notes = [note()], count, state } = {}) {
  const fake = createFakeClient();
  fake.respond = (call) => {
    if (call.rpc === 'search_notes') {
      return { data: [{ id: 'n1', title: 'My plan', snippet: 'a [[plan]] <script>x</script>', rank: 0.5, visibility: 'team', owner_id: 'me', updated_at: '2026-01-02T00:00:00Z' }], error: null };
    }
    if (call.table === 'notes' && fake.hasOp(call, 'insert')) return { data: { id: 'new1' }, error: null };
    if (call.table === 'notes' && fake.hasOp(call, 'select') && !fake.hasOp(call, 'range')) return { data: notes[0], error: null };
    if (call.table === 'notes' && fake.hasOp(call, 'range')) return { data: notes, count: count ?? notes.length, error: null };
    if (call.table === 'tags') return { data: [{ id: 't1', name: 'work' }], error: null };
    return { data: null, error: null };
  };
  const value = { client: fake, user: { id: 'me' }, profile: { id: 'me', username: 'ada' } };
  const utils = render(
    <AuthContext.Provider value={value}>
      <ToastProvider><MemoryRouter initialEntries={[{ pathname: '/notes', state }]}><NotesPage /></MemoryRouter></ToastProvider>
    </AuthContext.Provider>
  );
  return { fake, ...utils };
}

const emit = async (fake, payload) => { await act(async () => { fake.channels[0].handlers[0].callback(payload); }); };

describe('NotesPage', () => {
  it('sets the document title and lists notes with owner, tags and visibility', async () => {
    setup();
    expect(await screen.findByText('My plan')).toBeTruthy();
    expect(document.title).toBe('Notes · Huddle');
    const card = screen.getByTestId('note-card');
    expect(within(card).getByText('#work')).toBeTruthy();
    expect(within(card).getByText('Private')).toBeTruthy();
    expect(screen.getByText('You')).toBeTruthy();
    expect(screen.getByText('Showing 1 to 1 of 1 notes')).toBeTruthy();
  });

  it('shows the owner of a teammate note and no edit buttons for it', async () => {
    setup({ notes: [note({ owner_id: 'other', owner: { username: 'grace' }, visibility: 'team' })] });
    expect(await screen.findByText('@grace')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Edit My plan/ })).toBeNull();
  });

  it('shows "No notes yet" with no filters, and "No notes match" (with a way out) when filtered', async () => {
    const user = userEvent.setup();
    setup({ notes: [] });
    expect(await screen.findByRole('heading', { name: 'No notes yet' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Write a note' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Mine' }));
    expect(await screen.findByRole('heading', { name: 'No notes match' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Clear all filters' }));
    expect(screen.getByRole('button', { name: 'All' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('opens the new-note form straight away when the dashboard asks for it', async () => {
    setup({ state: { compose: true } });
    expect(await screen.findByRole('form', { name: 'New note' })).toBeTruthy();
  });

  it('shows an error from the list query', async () => {
    const fake = createFakeClient();
    fake.respond = (call) => (call.table === 'notes' ? { data: null, error: { code: '42501', message: 'x' } } : { data: [], error: null });
    render(<AuthContext.Provider value={{ client: fake, user: { id: 'me' } }}><ToastProvider><MemoryRouter><NotesPage /></MemoryRouter></ToastProvider></AuthContext.Provider>);
    expect((await screen.findByRole('alert')).textContent).toMatch(/not allowed/);
  });

  it('paginates with the range and the count', async () => {
    const user = userEvent.setup();
    const { fake } = setup({ count: 13 });
    await screen.findByText('My plan');
    expect(screen.getByText('Page 1 of 3')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(fake.callsFor('notes').some((c) => fake.op(c, 'range')?.[0] === 6)).toBe(true));
    expect(await screen.findByText('Page 2 of 3')).toBeTruthy();
  });

  it('quick chips apply at once; "More filters" applies on submit; active filters show as removable chips', async () => {
    const user = userEvent.setup();
    const { fake } = setup();
    await screen.findByText('My plan');
    const lastQuery = () => fake.callsFor('notes').filter((c) => fake.hasOp(c, 'range')).at(-1);
    await user.click(screen.getByRole('button', { name: 'Team' }));
    await user.click(screen.getByRole('button', { name: 'Pinned' }));
    expect(screen.getByRole('button', { name: 'Team' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Pinned' }).getAttribute('aria-pressed')).toBe('true');
    const more = screen.getByRole('button', { name: /More filters/ });
    expect(more.getAttribute('aria-expanded')).toBe('false');
    await user.click(more);
    expect(more.getAttribute('aria-expanded')).toBe('true');
    await user.type(screen.getByLabelText('Name contains'), 'plan');
    await user.click(screen.getByRole('button', { name: 'Apply filters' }));
    await waitFor(() => {
      expect(lastQuery().ops).toContainEqual(['eq', 'visibility', 'team']);
      expect(lastQuery().ops).toContainEqual(['ilike', 'title', '%plan%']);
      expect(lastQuery().ops).toContainEqual(['eq', 'pinned', true]);
    });
    // the panel filter is now a chip, and the button says how many are active
    expect(screen.getByRole('button', { name: /More filters, 1 active/ })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Remove filter: Name: plan' }));
    await waitFor(() => expect(lastQuery().ops.some((op) => op[0] === 'ilike')).toBe(false));
    expect(lastQuery().ops).toContainEqual(['eq', 'visibility', 'team']); // the other filters stay
  });

  it('creates a note and its tags', async () => {
    const user = userEvent.setup();
    const { fake } = setup();
    await screen.findByText('My plan');
    await user.click(screen.getByRole('button', { name: /New note/ }));
    await user.type(screen.getByLabelText('Title'), 'Fresh');
    await user.selectOptions(screen.getByLabelText('Who can read it'), 'team');
    await user.type(screen.getByLabelText('Tags'), 'Work, new');
    await user.click(screen.getByRole('button', { name: 'Create note' }));
    await waitFor(() => expect(fake.callsFor('notes').some((c) => fake.hasOp(c, 'insert'))).toBe(true));
    const insert = fake.callsFor('notes').find((c) => fake.hasOp(c, 'insert'));
    expect(fake.op(insert, 'insert')[0][0]).toMatchObject({ title: 'Fresh', visibility: 'team', owner_id: 'me' });
    await waitFor(() => expect(fake.callsFor('note_tags').some((c) => fake.hasOp(c, 'insert'))).toBe(true));
    await waitFor(() => expect(screen.queryByRole('form', { name: 'New note' })).toBeNull());
  });

  it('refuses an empty title without calling the database', async () => {
    const user = userEvent.setup();
    const { fake } = setup();
    await screen.findByText('My plan');
    await user.click(screen.getByRole('button', { name: /New note/ }));
    await user.click(screen.getByRole('button', { name: 'Create note' }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/title/);
    expect(fake.callsFor('notes').some((c) => fake.hasOp(c, 'insert'))).toBe(false);
  });

  it('shows the server error when saving fails', async () => {
    const user = userEvent.setup();
    const { fake } = setup();
    await screen.findByText('My plan');
    const original = fake.respond;
    fake.respond = (call) => (call.table === 'notes' && fake.hasOp(call, 'insert') ? { data: null, error: { code: '23514', message: 'check' } } : original(call));
    await user.click(screen.getByRole('button', { name: /New note/ }));
    await user.type(screen.getByLabelText('Title'), 'x');
    await user.click(screen.getByRole('button', { name: 'Create note' }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/Check the fields/);
  });

  it('asks for confirmation before deleting, then deletes by id', async () => {
    const user = userEvent.setup();
    const { fake } = setup();
    await screen.findByText('My plan');
    await user.click(screen.getByRole('button', { name: 'Delete My plan' }));
    expect(fake.callsFor('notes').some((c) => fake.hasOp(c, 'delete'))).toBe(false);
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }));
    await waitFor(() => expect(fake.callsFor('notes').some((c) => fake.hasOp(c, 'delete'))).toBe(true));
    const del = fake.callsFor('notes').find((c) => fake.hasOp(c, 'delete'));
    expect(fake.op(del, 'eq')).toEqual(['id', 'n1']);
  });

  it('searches with the rpc and renders the snippet safely with <mark>', async () => {
    const user = userEvent.setup();
    const { fake, container } = setup();
    await screen.findByText('My plan');
    await user.type(screen.getByLabelText('Full-text search'), 'plan');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    const result = await screen.findByTestId('search-result');
    expect(fake.calls.find((c) => c.rpc)).toMatchObject({ rpc: 'search_notes', args: { q: 'plan' } });
    expect(within(result).getByText('plan').tagName).toBe('MARK');
    expect(result.textContent).toContain('<script>x</script>');
    expect(container.querySelector('script')).toBeNull();
    expect(result.textContent).toMatch(/Rank 0.500/);
  });

  it('shows the live indicator once subscribed', async () => {
    const { fake } = setup();
    await screen.findByText('My plan');
    expect(screen.getByText('Connecting...')).toBeTruthy();
    await act(async () => { fake.channels[0].statusCallback('SUBSCRIBED'); });
    expect(screen.getByText('Live')).toBeTruthy();
  });

  it('refreshes the list when a realtime event arrives', async () => {
    const { fake } = setup();
    await screen.findByText('My plan');
    const before = fake.callsFor('notes').filter((c) => fake.hasOp(c, 'range')).length;
    const original = fake.respond;
    fake.respond = (call) => (call.table === 'notes' && fake.hasOp(call, 'range')
      ? { data: [note(), note({ id: 'n2', title: 'Teammate wrote this', owner_id: 'other', visibility: 'team', owner: { username: 'grace' } })], count: 2, error: null }
      : original(call));
    await emit(fake, { eventType: 'INSERT', new: { id: 'n2' } });
    expect(await screen.findByText('Teammate wrote this')).toBeTruthy();
    expect(fake.callsFor('notes').filter((c) => fake.hasOp(c, 'range')).length).toBeGreaterThan(before);
    expect(screen.getByText('A note was added live.')).toBeTruthy();
  });

  it('removes the realtime channel when the page unmounts', async () => {
    const { fake, unmount } = setup();
    await screen.findByText('My plan');
    unmount();
    expect(fake.removed).toHaveLength(1);
  });
});
