// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthContext } from '../src/auth/AuthContext';
import DashboardPage from '../src/pages/DashboardPage';
import { greeting, loadMyRooms, loadStats, loadTeamNotes, mergeRooms } from '../src/lib/dashboard';
import { makeClient } from './helpers/files';

const STATS = { my_notes: 3, team_notes: 7, rooms: 4, messages_today: 12, unread_mentions: 2 };
const TEAM = [{ id: 'n1', title: 'Release checklist', updated_at: '2026-11-17T10:00:00Z', author: { username: 'grace' } }];
const MEMBERS = [
  { room_id: 'r1', rooms: { id: 'r1', name: 'General', is_private: false } },
  { room_id: 'r2', rooms: { id: 'r2', name: 'Leads', is_private: true } },
];
const UNREAD = [{ room_id: 'r2', unread: 3 }];

function opts(over = {}) {
  return {
    tables: {
      notes: { data: TEAM, error: null },
      files: { data: [{ id: 'f1', name: 'plan.pdf', size: 2048, mime: 'application/pdf', created_at: '2026-11-17T09:00:00Z' }], error: null },
      room_members: { data: MEMBERS, error: null },
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

describe('DashboardPage', () => {
  it('shows the greeting, the five stat tiles and the title', async () => {
    setup();
    expect(document.title).toBe('Dashboard · Huddle');
    expect((await screen.findByRole('heading', { level: 1 })).textContent).toMatch(/Ada Lovelace/);
    expect(await screen.findByText('Release checklist')).toBeTruthy();
    expect(screen.getByTestId('stat-my_notes').textContent).toBe('3');
    expect(screen.getByTestId('stat-team_notes').textContent).toBe('7');
    expect(screen.getByTestId('stat-rooms').textContent).toBe('4');
    expect(screen.getByTestId('stat-messages_today').textContent).toBe('12');
    expect(screen.getByTestId('stat-unread_mentions').textContent).toBe('2');
  });

  it('lists team notes with the author, my files and rooms with unread counts', async () => {
    setup();
    expect(await screen.findByText(/by grace/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'plan.pdf' }).getAttribute('href')).toBe('/files');
    const leads = screen.getByRole('link', { name: /Private: Leads/ });
    expect(leads.getAttribute('href')).toBe('/chat/r2');
    expect(within(leads.closest('li')).getByText('3 unread')).toBeTruthy();
    expect(within(screen.getByRole('link', { name: /# General/ }).closest('li')).queryByText(/unread/)).toBeNull();
  });

  it('explains what each page demonstrates', async () => {
    setup();
    const section = (await screen.findByRole('heading', { name: 'What this app demonstrates' })).closest('section');
    for (const name of ['Chat', 'Notes', 'Files', 'Profile', 'Query lab']) expect(within(section).getByRole('link', { name })).toBeTruthy();
  });

  it('shows empty states', async () => {
    setup(opts({ tables: { notes: { data: [], error: null }, files: { data: [], error: null }, room_members: { data: [], error: null } }, rpcs: { workspace_stats: { data: STATS, error: null }, unread_counts: { data: [], error: null } } }));
    expect(await screen.findByText(/No team notes yet/)).toBeTruthy();
    expect(screen.getByText(/No files yet/)).toBeTruthy();
    expect(screen.getByText(/not in any room/)).toBeTruthy();
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
