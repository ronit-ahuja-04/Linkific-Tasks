// @vitest-environment jsdom
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../src/auth/AuthContext';
import AppLayout from '../src/components/AppLayout';
import { ThemeProvider } from '../src/context/ThemeContext';
import { ToastProvider } from '../src/context/ToastContext';
import { ADA, makeFakeClient } from './helpers/chat';

const MEMBERS = [
  { room_id: 'r1', rooms: { id: 'r1', name: 'Random', is_private: false } },
  { room_id: 'r2', rooms: { id: 'r2', name: 'Leads', is_private: true } },
  { room_id: 'r3', rooms: { id: 'r3', name: 'General', is_private: false } },
];
const UNREAD = [{ room_id: 'r1', unread: 2 }, { room_id: 'r2', unread: 5 }];

function setup({ path = '/', members = MEMBERS } = {}) {
  const client = makeFakeClient();
  client.reply('room_members:select', { data: members, error: null });
  client.replyRpc('unread_counts', { data: UNREAD, error: null });
  const signOut = vi.fn(async () => ({ error: null }));
  const auth = { client, user: ADA, profile: { username: 'ada', full_name: 'Ada Lovelace', avatar_path: null }, status: 'authenticated', isAuthenticated: true, signOut };
  const page = (title) => <h1>{title}</h1>;
  render(
    <ThemeProvider>
      <AuthContext.Provider value={auth}>
        <ToastProvider>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route index element={page('Dashboard page')} />
                <Route path="/chat/:roomId?" element={page('Chat page')} />
                <Route path="/notes" element={page('Notes page')} />
                <Route path="/files" element={page('Files page')} />
                <Route path="/lab" element={page('Lab page')} />
                <Route path="/profile" element={page('Profile page')} />
              </Route>
              <Route path="/login" element={page('Login page')} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </AuthContext.Provider>
    </ThemeProvider>
  );
  return { client, signOut, nav: screen.getByRole('navigation', { name: 'Main' }) };
}

const roomLinks = (nav) => within(within(nav).getByRole('list', { name: 'Rooms' })).getAllByRole('link');

describe('AppLayout (the shell)', () => {
  it('has the landmarks, and the skip link is the first thing you can tab to', async () => {
    setup();
    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.getByRole('main').id).toBe('main');
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Skip to content' }));
    expect(document.activeElement.getAttribute('href')).toBe('#main');
  });

  it('marks the current page, and marks Chat as the current section while a room is open', async () => {
    const { nav } = setup({ path: '/chat/r2' });
    await waitFor(() => expect(roomLinks(nav)).toHaveLength(3));
    expect(within(nav).getByRole('link', { name: 'Chat' }).getAttribute('aria-current')).toBe('true');
    expect(within(nav).getByRole('link', { name: /^Leads/ }).getAttribute('aria-current')).toBe('page');
    expect(within(nav).getByRole('link', { name: 'Dashboard' }).getAttribute('aria-current')).toBeNull();
  });

  it('lists my rooms A to Z with unread counts in the link name; the open room shows none', async () => {
    const { nav } = setup({ path: '/chat/r2' });
    await waitFor(() => expect(roomLinks(nav)).toHaveLength(3));
    const links = roomLinks(nav);
    expect(links.map((a) => a.querySelector('.shell-room-name').firstChild.textContent)).toEqual(['General', 'Leads', 'Random']);
    expect(links[2].textContent).toMatch(/Random.*2.*2 unread/);
    expect(links[2].hasAttribute('data-unread')).toBe(true);
    expect(links[1].textContent).toContain('(private)');
    expect(links[1].textContent).not.toMatch(/unread/); // r2 is open: you are reading it
    expect(links[0].hasAttribute('data-unread')).toBe(false);
  });

  it('says so when I have no rooms yet, with a way to find one', async () => {
    const { nav } = setup({ members: [] });
    expect(await within(nav).findByText(/No rooms yet/)).toBeTruthy();
    expect(within(nav).getByRole('link', { name: 'Find a room' }).getAttribute('href')).toBe('/chat');
  });

  it('the phone menu: a disclosure button; Escape closes it and gives focus back to the button', async () => {
    const { nav } = setup();
    const button = screen.getByRole('button', { name: 'Menu' });
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-controls')).toBe(nav.id);
    await userEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(nav.hasAttribute('data-open')).toBe(true);
    await userEvent.tab(); // into the menu
    await userEvent.keyboard('{Escape}');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(button);
  });

  it('choosing a page closes the menu and moves focus to the new page heading', async () => {
    const { nav } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }));
    await userEvent.click(within(nav).getByRole('link', { name: 'Notes' }));
    expect(nav.hasAttribute('data-open')).toBe(false);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Notes page' })));
    expect(document.activeElement.getAttribute('tabindex')).toBe('-1');
  });

  it('does not take focus away from something the page focused itself', async () => {
    setup();
    await userEvent.click(within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', { name: 'Files' }));
    const main = screen.getByRole('main');
    const input = document.createElement('input');
    main.appendChild(input);
    input.focus(); // what a page does when it focuses its own field on arrival
    await act(() => new Promise((r) => requestAnimationFrame(r)));
    expect(document.activeElement).toBe(input);
  });

  it('shows who is signed in, and signs out to the sign-in page', async () => {
    const { nav, signOut } = setup();
    expect(within(nav).getByText('Ada Lovelace')).toBeTruthy();
    expect(within(nav).getByText('@ada')).toBeTruthy();
    await userEvent.click(within(nav).getByRole('button', { name: 'Sign out' }));
    expect(signOut).toHaveBeenCalled();
    expect(await screen.findByRole('heading', { name: 'Login page' })).toBeTruthy();
  });

  it('reloads the room counts when someone else posts, not when I do', async () => {
    const { client } = setup();
    await waitFor(() => expect(client.channels.some((c) => c.name === `sidebar-rooms:${ADA.id}`)).toBe(true));
    const channel = client.channels.find((c) => c.name === `sidebar-rooms:${ADA.id}`);
    const before = client.rpcCalls.filter((c) => c.name === 'unread_counts').length;
    channel.emitChange('INSERT', { new: { id: 'm1', room_id: 'r1', user_id: ADA.id } });
    await new Promise((r) => setTimeout(r, 500));
    expect(client.rpcCalls.filter((c) => c.name === 'unread_counts')).toHaveLength(before);
    channel.emitChange('INSERT', { new: { id: 'm2', room_id: 'r1', user_id: 'u-grace' } });
    await waitFor(() => expect(client.rpcCalls.filter((c) => c.name === 'unread_counts').length).toBe(before + 1));
  });
});
