// @vitest-environment jsdom
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import NotificationBell from '../src/components/NotificationBell';
import { Wrapper, makeFakeClient } from './helpers/chat.jsx';

const note = (id, over = {}) => ({ id, type: 'mention', room_id: 'r1', message_id: id, message: `hey @ada ${id}`, created_at: '2026-11-17T10:00:00Z', read_at: null, rooms: { name: 'General' }, ...over });

function setup({ count = 2, items = [note(1), note(2)] } = {}) {
  const client = makeFakeClient();
  client.reply('notifications:select', (call) => (client.op(call, 'select')[1]?.head ? { count, data: null, error: null } : { data: items, error: null }));
  client.reply('notifications:update', { data: null, error: null });
  render(<Wrapper client={client}><NotificationBell /></Wrapper>);
  return { client, user: userEvent.setup() };
}
const channelOf = async (client) => {
  await waitFor(() => expect(client.channels.find((c) => c.name === 'notifications:u-ada')).toBeTruthy());
  return client.channels.find((c) => c.name === 'notifications:u-ada');
};

describe('NotificationBell', () => {
  it('shows the unread count from a head+exact count query', async () => {
    const { client } = setup({ count: 3 });
    expect(await screen.findByRole('button', { name: 'Notifications, 3 unread' })).toBeTruthy();
    const call = client.callsOn('notifications', 'select')[0];
    expect(client.op(call, 'select')).toEqual(['id', { count: 'exact', head: true }]);
    expect(client.op(call, 'is')).toEqual(['read_at', null]);
  });

  it('shows no badge when nothing is unread', async () => {
    setup({ count: 0 });
    expect(await screen.findByRole('button', { name: 'Notifications, none unread' })).toBeTruthy();
    expect(document.querySelector('.bell-count')).toBeNull();
  });

  it('subscribes to INSERT and UPDATE for my user id only, and removes the channel on unmount', async () => {
    const client = makeFakeClient();
    client.reply('notifications:select', { count: 0, data: null, error: null });
    const { unmount } = render(<Wrapper client={client}><NotificationBell /></Wrapper>);
    const channel = await channelOf(client);
    expect(channel.listeners.map((l) => [l.filter.event, l.filter.filter, l.filter.table])).toEqual([
      ['INSERT', 'user_id=eq.u-ada', 'notifications'], ['UPDATE', 'user_id=eq.u-ada', 'notifications'],
    ]);
    unmount();
    expect(client.removed).toContain(channel);
  });

  it('counts a live INSERT up and raises a toast with the message', async () => {
    const { client } = setup({ count: 0 });
    const channel = await channelOf(client);
    act(() => channel.emitChange('INSERT', { new: note(9, { message: 'ping @ada now' }) }));
    expect(await screen.findByRole('button', { name: 'Notifications, 1 unread' })).toBeTruthy();
    expect(screen.getByText(/New mention: ping @ada now/)).toBeTruthy();
  });

  it('recounts on a live UPDATE (read in another tab)', async () => {
    const { client } = setup({ count: 2 });
    const channel = await channelOf(client);
    await screen.findByRole('button', { name: 'Notifications, 2 unread' });
    client.reply('notifications:select', { count: 1, data: null, error: null });
    await act(async () => channel.emitChange('UPDATE', { new: note(1, { read_at: 'x' }) }));
    expect(await screen.findByRole('button', { name: 'Notifications, 1 unread' })).toBeTruthy();
  });

  it('opens a dropdown of the latest 10 with links to the room, and aria-expanded', async () => {
    const { client, user } = setup();
    const bell = await screen.findByRole('button', { name: /Notifications, 2/ });
    expect(bell.getAttribute('aria-expanded')).toBe('false');
    await user.click(bell);
    expect(bell.getAttribute('aria-expanded')).toBe('true');
    const link = (await screen.findByText('hey @ada 1')).closest('a');
    expect(link.getAttribute('href')).toBe('/chat/r1');
    const list = client.callsOn('notifications', 'select').find((c) => !client.op(c, 'select')[1]?.head);
    expect(client.op(list, 'limit')).toEqual([10]);
    expect(client.op(list, 'order')).toEqual(['created_at', { ascending: false }]);
  });

  it('"Mark all read" updates read_at where it is null and clears the badge', async () => {
    const { client, user } = setup();
    await user.click(await screen.findByRole('button', { name: /Notifications, 2/ }));
    await user.click(await screen.findByRole('button', { name: 'Mark all read' }));
    await screen.findByRole('button', { name: 'Notifications, none unread' });
    const update = client.callsOn('notifications', 'update')[0];
    expect(Object.keys(client.op(update, 'update')[0])).toEqual(['read_at']);
    expect(client.op(update, 'is')).toEqual(['read_at', null]);
  });

  it('shows an empty state and closes with Escape', async () => {
    const { user } = setup({ count: 0, items: [] });
    await user.click(await screen.findByRole('button', { name: /Notifications/ }));
    expect(await screen.findByText(/No notifications yet/)).toBeTruthy();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('region', { name: 'Notification list' })).toBeNull();
  });

  it('shows an error when the list cannot be loaded', async () => {
    const client = makeFakeClient();
    client.reply('notifications:select', (call) => (client.op(call, 'select')[1]?.head ? { count: 0, error: null } : { data: null, error: { message: 'list failed' } }));
    render(<Wrapper client={client}><NotificationBell /></Wrapper>);
    await userEvent.click(await screen.findByRole('button', { name: /Notifications/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('list failed');
  });
});
