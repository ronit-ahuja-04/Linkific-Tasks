// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

vi.mock('firebase/firestore', async () => (await import('./mocks/firestore.js')).firestoreMock);
vi.mock('firebase/auth', async () => (await import('./mocks/auth.js')).authMock);
vi.mock('../src/lib/firebase', () => ({ db: {}, auth: {}, googleProvider: {}, isFirebaseConfigured: true }));

const feed = vi.hoisted(() => ({ value: { messages: [], ready: true } }));
vi.mock('../src/lib/useLatestMessages', () => ({ useLatestMessages: () => feed.value }));

import { loadedStore, task } from './mocks/setup.js';
import { LanguageProvider } from '../src/context/LanguageContext.jsx';
import LivePulse from '../src/components/LivePulse.jsx';
import { boardReceived } from '../src/store/slices/boardSlice.js';
import { projectsReceived } from '../src/store/slices/projectsSlice.js';
import { makeEmptyBoard } from '../src/lib/board.js';

const NOW = new Date('2026-01-01T12:00:00Z').getTime();

function boardWith(tasks, columns) {
  const b = makeEmptyBoard();
  b.tasks = Object.fromEntries(tasks.map((x) => [x.id, x]));
  for (const [col, ids] of Object.entries(columns)) b.columns[col].taskIds = ids;
  return b;
}
const receive = (store, board, at = NOW) => store.dispatch(boardReceived({ projectId: 'p1', ...board, receivedAt: at }));

function setup({ board, lang } = {}) {
  vi.useFakeTimers({ now: NOW });
  if (lang) localStorage.setItem('flowlane-language', lang);
  const store = loadedStore();
  if (board) receive(store, board);
  render(
    <Provider store={store}>
      <MemoryRouter><LanguageProvider><LivePulse projectId="p1" /></LanguageProvider></MemoryRouter>
    </Provider>,
  );
  return store;
}
const value = (id) => within(screen.getByTestId(id)).getByText(/^\d+$/).textContent;

beforeEach(() => { localStorage.clear(); feed.value = { messages: [], ready: true }; });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('LivePulse', () => {
  it('shows the tiles, the columns, the priorities and who has what', () => {
    setup({
      board: boardWith(
        [task('a', { priority: 'high', users: ['u1'] }), task('b', { users: ['u1', 'u2'], attachments: [{ id: 1 }] }), task('c', { priority: 'low' }), task('d')],
        { todo: ['a', 'd'], inprogress: ['b'], done: ['c'] },
      ),
    });
    expect(value('tile-total')).toBe('4');
    expect(value('tile-done')).toBe('1');
    expect(within(screen.getByTestId('tile-done')).getByText('25% finished')).toBeTruthy();
    expect(value('tile-inprogress')).toBe('1');
    expect(value('tile-urgent')).toBe('1');
    expect(value('tile-images')).toBe('1');
    expect(value('column-todo')).toBe('2');
    expect(value('priority-high')).toBe('1');
    expect(within(screen.getByTestId('person-u1')).getByText('Ann')).toBeTruthy();
    expect(within(screen.getByTestId('person-u1')).getByText('2 open, 0 done')).toBeTruthy();
    // c is unassigned too but done, so only d counts
    expect(screen.getByTestId('unassigned').textContent).toBe('Not assigned to anyone: 1');
  });

  it('gives each bar a text alternative with its numbers', () => {
    setup({ board: boardWith([task('a'), task('b')], { todo: ['a', 'b'] }) });
    expect(screen.getByRole('img', { name: 'To Do: 2 of 2' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Done: 0 of 2' })).toBeTruthy();
  });

  it('invites you to add a task when the board is empty', () => {
    setup({ board: boardWith([], {}) });
    expect(screen.getByText(/No tasks yet/)).toBeTruthy();
    expect(screen.getByText('Nobody is assigned to a task yet.')).toBeTruthy();
    expect(value('tile-total')).toBe('0');
  });

  it('changes by itself when the board in the store changes (what a Firestore snapshot does)', () => {
    const store = setup({ board: boardWith([task('a')], { todo: ['a'] }) });
    expect(value('tile-total')).toBe('1');
    expect(value('tile-done')).toBe('0');
    act(() => receive(store, boardWith([task('a'), task('b', { priority: 'high' })], { todo: ['b'], done: ['a'] })));
    expect(value('tile-total')).toBe('2');
    expect(value('tile-done')).toBe('1');
    expect(value('tile-urgent')).toBe('1');
    expect(value('column-done')).toBe('1');
  });

  it('says how long ago the last update came, and keeps counting', () => {
    setup({ board: boardWith([task('a')], { todo: ['a'] }) });
    expect(screen.getByTestId('pulse-age').textContent).toBe('Updated just now');
    act(() => { vi.advanceTimersByTime(10_000); });
    expect(screen.getByTestId('pulse-age').textContent).toBe('Updated 10s ago');
    act(() => { vi.advanceTimersByTime(120_000); });
    expect(screen.getByTestId('pulse-age').textContent).toBe('Updated 2 min ago');
  });

  it('starts counting again when a new update arrives', () => {
    const store = setup({ board: boardWith([task('a')], { todo: ['a'] }) });
    act(() => { vi.advanceTimersByTime(30_000); });
    act(() => receive(store, boardWith([task('a')], { todo: ['a'] }), NOW + 30_000));
    expect(screen.getByTestId('pulse-age').textContent).toBe('Updated just now');
  });

  it('waits for the first update when none has arrived', () => {
    setup();
    expect(screen.getByTestId('pulse-age').textContent).toBe('Waiting for the first update...');
  });

  it('lists all projects with links, and marks the open one', () => {
    const store = setup({ board: boardWith([task('a')], { todo: ['a'] }) });
    const b = boardWith([task('x'), task('y')], { done: ['x'], todo: ['y'] });
    act(() => {
      store.dispatch(projectsReceived([
        { id: 'p1', name: 'Project', owner: 'u1', members: ['u1'] },
        { id: 'p2', name: 'Second', owner: 'u1', members: ['u1'], tasks: b.tasks, columns: b.columns, columnOrder: b.columnOrder },
      ]));
    });
    const second = screen.getByTestId('project-p2');
    expect(within(second).getByRole('link', { name: 'Second' }).getAttribute('href')).toBe('/projects/p2');
    expect(within(second).getByText('1 (50%)')).toBeTruthy();
    expect(within(screen.getByTestId('project-p1')).getByText('(open now)')).toBeTruthy();
    expect(within(second).queryByText('(open now)')).toBeNull();
  });

  it('shows the latest chat messages as plain text, or invites you to say hi', () => {
    feed.value = { messages: [{ id: 'm1', senderName: 'Bob', text: '<b>hello</b>' }, { id: 'm2', senderName: 'Ann', text: 'hi' }], ready: true };
    setup({ board: boardWith([task('a')], { todo: ['a'] }) });
    const items = within(screen.getByTestId('chat-feed')).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toBe('Bob<b>hello</b>'); // shown as text, never as HTML
    cleanup();
    feed.value = { messages: [], ready: true };
    setup({ board: boardWith([task('a')], { todo: ['a'] }) });
    expect(screen.getByText('No messages yet. Say hi in the Activity tab!')).toBeTruthy();
  });

  it('is translated', () => {
    setup({ lang: 'es', board: boardWith([task('a')], { todo: ['a'] }) });
    expect(screen.getByRole('heading', { name: 'Resumen en vivo' })).toBeTruthy();
    expect(screen.getByTestId('pulse-age').textContent).toBe('Actualizado ahora mismo');
  });
});
