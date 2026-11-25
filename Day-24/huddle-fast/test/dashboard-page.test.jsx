// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthContext } from '../src/auth/AuthContext';
import DashboardPage from '../src/pages/DashboardPage';
import { displayName, firstName, greeting, loadMyRooms, loadStats, loadTeamNotes, loadUnreadMentions, mergeRooms } from '../src/lib/dashboard';
import { makeClient } from './helpers/files';

const STATS = { my_notes: 3, team_notes: 7, rooms: 4, messages_today: 12, unread_mentions: 2 };
const TEAM = [{ id: 'n1', title: 'Release checklist', updated_at: '2026-11-17T10:00:00Z', author: { username: 'grace' } }];
const MEMBERS = [
  { room_id: 'r1', rooms: { id: 'r1', name: 'General', is_private: false } },
  { room_id: 'r2', rooms: { id: 'r2', name: 'Leads', is_private: true } },
];
const UNREAD = [{ room_id: 'r2', unread: 3 }];
const MENTIONS = [{ id: 'n1', room_id: 'r1', message: 'grace: @ada can you check the release list?', created_at: '2026-11-17T11:00:00Z', rooms: { name: 'General' } }];

function opts(over = {}) {
  return {
    tables: {
      notes: { data: TEAM, error: null },
      files: { data: [{ id: 'f1', name: 'plan.pdf', size: 2048, mime: 'application/pdf', created_at: '2026-11-17T09:00:00Z' }], error: null },
      room_members: { data: MEMBERS, error: null },
      notifications: { data: MENTIONS, error: null },
    },
    rpcs: { workspace_stats: { data: STATS, error: null }, unread_counts: { data: UNREAD, error: null } },
    ...over,
  };
}

function setup(clientOpts = opts()) {
  const client = makeClient(clientOpts);
  const value = { client, user: { id: 'u1' }, profile: { username: 'ada', full_name: 'Ada Lovelace' }, status: 'authenticated' };
  render(<MemoryRouter><AuthContext.Provider value={value}><DashboardPage /></AuthContext.Provider></MemoryRouter>);
  return client;
}

describe('dashboard lib', () => {
  it('greets by hour', () => {
    expect([greeting(3), greeting(9), greeting(14), greeting(20)]).toEqual(['Working late', 'Good morning', 'Good afternoon', 'Good evening']);
  });
  it('calls the workspace_stats function', () => {
    const client = makeClient();
    loadStats(client);
    expect(client.rpc).toHaveBeenCalledWith('workspace_stats');
  });
  it('queries team notes with eq visibility, a limit and the author joined', () => {
    const client = makeClient();
    loadTeamNotes(client, 5);
    const calls = client.log.map((c) => [c.method, ...c.args]);
    expect(calls).toContainEqual(['eq', 'visibility', 'team']);
    expect(calls).toContainEqual(['limit', 5]);
    expect(calls[0][1]).toContain('author:profiles');
  });
  it('merges memberships with unread counts and sorts unread first', () => {
    const rooms = mergeRooms(MEMBERS, UNREAD);
    expect(rooms.map((r) => [r.name, r.unread, r.isPrivate])).toEqual([['Leads', 3, true], ['General', 0, false]]);
  });
  it('loads rooms with both calls and returns the first error', async () => {
    const ok = await loadMyRooms(makeClient(opts()), 'u1');
    expect(ok.data).toHaveLength(2);
    const bad = await loadMyRooms(makeClient(opts({ rpcs: { unread_counts: { data: null, error: { message: 'no' } } } })), 'u1');
    expect(bad.error.message).toBe('no');
    expect(bad.data).toEqual([]);
  });
});

describe('dashboard lib (Day 22 additions)', () => {
  it('asks only for unread mentions, newest first', () => {
    const client = makeClient();
    loadUnreadMentions(client, 3);
    const calls = client.log.map((c) => [c.method, ...c.args]);
    expect(calls).toContainEqual(['is', 'read_at', null]);
    expect(calls).toContainEqual(['order', 'created_at', { ascending: false }]);
    expect(calls).toContainEqual(['limit', 3]);
  });
  it('names people the way people know them', () => {
    expect(displayName({ full_name: 'Grace Hopper', username: 'grace' })).toBe('Grace Hopper');
    expect(displayName({ full_name: '  ', username: 'grace' })).toBe('grace');
    expect(displayName(null)).toBe('someone');
    expect(firstName({ full_name: 'Ada Lovelace', username: 'ada' })).toBe('Ada');
    expect(firstName({ username: 'ada' })).toBe('ada');
  });
});

describe('DashboardPage', () => {
  it('greets by first name, and shows the five workspace numbers', async () => {
    setup();
    expect(document.title).toBe('Dashboard · Huddle');
    expect((await screen.findByRole('heading', { level: 1 })).textContent).toMatch(/, Ada$/);
    expect(await screen.findByText('Release checklist')).toBeTruthy();
    expect(screen.getByTestId('stat-my_notes').textContent).toBe('3');
    expect(screen.getByTestId('stat-team_notes').textContent).toBe('7');
    expect(screen.getByTestId('stat-rooms').textContent).toBe('4');
    expect(screen.getByTestId('stat-messages_today').textContent).toBe('12');
    expect(screen.getByTestId('stat-unread_mentions').textContent).toBe('2');
  });

  it('lists team notes with the author and a relative time, and my files', async () => {
    setup();
    expect(await screen.findByText(/by grace/)).toBeTruthy();
    const note = screen.getByRole('link', { name: 'Release checklist' });
    expect(note.closest('li').querySelector('time').getAttribute('dateTime')).toBe('2026-11-17T10:00:00.000Z');
    expect(screen.getByRole('link', { name: 'plan.pdf' }).getAttribute('href')).toBe('/files');
  });

  it('"Needs you": unread mentions first, then rooms with new messages; quiet rooms are not listed', async () => {
    setup();
    const needs = (await screen.findByRole('heading', { name: 'Needs you' })).closest('section');
    const mention = await within(needs).findByRole('link', { name: 'Mention in #General' });
    expect(mention.getAttribute('href')).toBe('/chat/r1');
    expect(within(needs).getByText(/can you check the release list/)).toBeTruthy();
    const leads = within(needs).getByRole('link', { name: /^Leads/ });
    expect(leads.textContent).toBe('Leads (private)'); // the lock icon is decoration; the word is for screen readers
    expect(leads.getAttribute('href')).toBe('/chat/r2');
    expect(within(leads.closest('li')).getByText('3 new messages')).toBeTruthy();
    expect(within(needs).queryByRole('link', { name: /^General/ })).toBeNull(); // no unread messages there
    expect(within(needs).getByText('2 unread mentions')).toBeTruthy(); // the amber count, in words for screen readers
    expect(within(needs).getByText('1 more in the notification bell.')).toBeTruthy(); // 2 unread, 1 listed
  });

  it('says "all caught up" when nothing is waiting', async () => {
    setup(opts({ tables: { notes: { data: [], error: null }, files: { data: [], error: null }, room_members: { data: MEMBERS, error: null }, notifications: { data: [], error: null } }, rpcs: { workspace_stats: { data: { ...STATS, unread_mentions: 0 }, error: null }, unread_counts: { data: [], error: null } } }));
    expect(await screen.findByText(/You are all caught up/)).toBeTruthy();
  });

  it('keeps what the app demonstrates, collapsed under the hood', async () => {
    setup();
    const details = screen.getByText('Under the hood: what this app demonstrates').closest('details');
    expect(details.open).toBe(false);
    for (const name of ['Chat', 'Notes', 'Files', 'Profile', 'Query lab']) expect(within(details).getByRole('link', { name })).toBeTruthy();
  });

  it('shows empty states', async () => {
    setup(opts({ tables: { notes: { data: [], error: null }, files: { data: [], error: null }, room_members: { data: [], error: null } }, rpcs: { workspace_stats: { data: STATS, error: null }, unread_counts: { data: [], error: null } } }));
    expect(await screen.findByText(/No team notes yet/)).toBeTruthy();
    expect(screen.getByText(/No files yet/)).toBeTruthy();
    const filesPanel = screen.getByRole('heading', { name: 'My recent files' }).closest('section');
    expect(within(filesPanel).getByRole('link', { name: 'Upload a file' }).getAttribute('href')).toBe('/files'); // an empty state offers the next step
  });

  it('shows an error for the stats without breaking the other sections', async () => {
    setup(opts({ rpcs: { workspace_stats: { data: null, error: { message: 'rpc failed' } }, unread_counts: { data: UNREAD, error: null } } }));
    expect((await screen.findByText(/Could not load the numbers: rpc failed/)).getAttribute('role')).toBe('alert');
    expect(await screen.findByText('Release checklist')).toBeTruthy();
  });

  it('shows a loading state first', () => {
    setup();
    expect(screen.getAllByText('Loading...').length).toBeGreaterThan(0);
  });
});
