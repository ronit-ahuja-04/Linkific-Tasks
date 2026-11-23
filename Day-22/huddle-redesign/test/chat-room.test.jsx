// @vitest-environment jsdom
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import ChatPage from '../src/pages/ChatPage';
import { Wrapper, makeFakeClient, message, room } from './helpers/chat.jsx';

const roomChannel = (client) => client.channels.find((c) => c.name === 'room:r1');
const waitForRoomChannel = async (client) => {
  await waitFor(() => expect(roomChannel(client)).toBeTruthy());
  return roomChannel(client);
};

function setup({ messages = [message(1), message(2)], path = '/chat/r1', strict = false } = {}) {
  const client = makeFakeClient();
  client.reply('rooms:select', { data: [room(), room({ id: 'r2', name: 'Random' }), room({ id: 'r3', name: 'Open' })], error: null });
  client.replyRpc('unread_counts', { data: [{ room_id: 'r1', unread: 2 }, { room_id: 'r2', unread: 4 }], error: null });
  client.reply('messages:select', (call) => (client.op(call, 'eq')?.[0] === 'id' ? { data: null, error: null } : { data: [...messages].reverse(), error: null }));
  const tree = (
    <Wrapper client={client} path={path} route="/chat/:roomId?"><ChatPage /></Wrapper>
  );
  const utils = render(strict ? <StrictMode>{tree}</StrictMode> : tree);
  return { client, user: userEvent.setup(), ...utils };
}

describe('ChatPage: rooms', () => {
  it('/chat is the room browser: rooms with unread counts from the rpc, and the document title', async () => {
    const { client } = setup({ path: '/chat' });
    expect(await screen.findByRole('link', { name: /^Random.*4 unread$/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: /^General.*2 unread$/ })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1, name: 'Chat' })).toBeTruthy();
    expect(document.title).toBe('Chat · Huddle');
    expect(client.rpcCalls.map((c) => c.name)).toContain('unread_counts');
  });

  it('shows an error when rooms cannot be loaded', async () => {
    const client = makeFakeClient();
    client.reply('rooms:select', { data: null, error: { message: 'rooms down' } });
    render(<Wrapper client={client} path="/chat" route="/chat/:roomId?"><ChatPage /></Wrapper>);
    expect(await screen.findByRole('alert')).toHaveTextContent('rooms down');
  });

  it('says so when the room in the URL is not visible', async () => {
    setup({ path: '/chat/nope' });
    expect(await screen.findByText(/does not exist, or you cannot see it/)).toBeTruthy();
  });

  it('opening a room loads its messages, marks it read and clears its count (seen back in the browser)', async () => {
    const { client, user } = setup();
    expect(await screen.findByText('message 2')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1, name: 'General' })).toBeTruthy(); // the room is the page
    expect(document.title).toBe('General · Chat · Huddle');
    expect(client.rpcCalls).toContainEqual({ name: 'mark_room_read', args: { p_room: 'r1' } });
    await user.click(screen.getByRole('link', { name: 'All rooms' }));
    expect(await screen.findByRole('link', { name: /^Random.*4 unread$/ })).toBeTruthy(); // Random keeps its count
    expect(screen.getByRole('link', { name: 'General' })).toBeTruthy(); // read: no count any more
  });

  it('"New room" opens the form (and the dashboard can ask for it open)', async () => {
    const { user } = setup({ path: '/chat' });
    const button = await screen.findByRole('button', { name: 'New room' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByLabelText('Room name')).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByLabelText('Room name')).toBeNull();
  });

  it('search narrows the room list', async () => {
    const { user } = setup({ path: '/chat' });
    await screen.findByRole('link', { name: /^Random/ });
    await user.type(screen.getByLabelText('Find a room'), 'rand');
    expect(screen.getByRole('link', { name: /^Random/ })).toBeTruthy();
    expect(screen.queryByRole('link', { name: /^General/ })).toBeNull();
  });

  it('refreshes the counts from the database when a message arrives (unfiltered insert subscription)', async () => {
    const { client } = setup({ path: '/chat' });
    await screen.findByRole('link', { name: /^Random/ });
    await waitFor(() => expect(client.channels.find((c) => c.name === 'chat:unread')).toBeTruthy());
    // the database now says 5: the page asks again instead of adding 1 to a local number
    client.replyRpc('unread_counts', { data: [{ room_id: 'r1', unread: 2 }, { room_id: 'r2', unread: 5 }], error: null });
    act(() => client.channels.find((c) => c.name === 'chat:unread').emitChange('INSERT', { new: message(9, { room_id: 'r2' }) }));
    expect(await screen.findByRole('link', { name: /^Random.*5 unread$/ })).toBeTruthy();
  });

  it('ignores my own messages for the counts (no refetch)', async () => {
    const { client } = setup({ path: '/chat' });
    await screen.findByRole('link', { name: /^Random/ });
    await waitFor(() => expect(client.channels.find((c) => c.name === 'chat:unread')).toBeTruthy());
    const count = () => client.rpcCalls.filter((c) => c.name === 'unread_counts').length;
    const before = count();
    expect(before).toBeGreaterThan(0); // (the page did ask once when it opened)
    act(() => client.channels.find((c) => c.name === 'chat:unread').emitChange('INSERT', { new: message(10, { room_id: 'r2', user_id: 'u-ada' }) }));
    expect(count()).toBe(before);
  });
});

describe('ChatPage: messages', () => {
  it('shows the last page oldest first with the embedded author', async () => {
    setup();
    await screen.findByText('message 1');
    // A-1: the log keeps a real list inside it, and the items are oldest first
    const log = screen.getByRole('log', { name: 'Messages' });
    const items = within(within(log).getByRole('list')).getAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual([expect.stringContaining('message 1'), expect.stringContaining('message 2')]);
    // grouping: the second message (same author, a second later) shows no second name, but still says who wrote it
    expect(within(items[0]).getByText('Grace Hopper').tagName).toBe('STRONG');
    expect(items[1]).toHaveAttribute('data-grouped');
    expect(within(items[1]).queryByRole('img')).toBeNull();
    expect(items[1].querySelector('.sr-only').textContent).toMatch(/^Grace Hopper, /);
  });

  it('shows an empty state', async () => {
    setup({ messages: [] });
    expect(await screen.findByText(/No messages yet/)).toBeTruthy();
  });

  it('"Load earlier" appears for a full page and queries before the oldest message', async () => {
    const full = Array.from({ length: 50 }, (_, i) => message(i + 1));
    const { client, user } = setup({ messages: full });
    await user.click(await screen.findByRole('button', { name: 'Load earlier messages' }));
    const second = client.callsOn('messages', 'select').find((c) => client.op(c, 'lt'));
    expect(client.op(second, 'lt')).toEqual(['created_at', full[0].created_at]);
  });

  it('sends a message: inserts it, shows it at once, and the realtime echo does not duplicate it', async () => {
    const { client, user } = setup();
    await screen.findByText('message 1');
    const mine = message(10, { user_id: 'u-ada', body: 'hello team', author: { username: 'ada', full_name: 'Ada', avatar_path: null } });
    client.reply('messages:insert', { data: mine, error: null });
    const channel = await waitForRoomChannel(client);
    await user.type(screen.getByLabelText('Message'), 'hello team{Enter}');
    expect(await screen.findByText('hello team')).toBeTruthy();
    await act(async () => channel.emitChange('INSERT', { new: { ...mine, author: undefined } }));
    expect(screen.getAllByText('hello team')).toHaveLength(1);
  });

  it('shows an error and keeps the text when the insert is refused by RLS', async () => {
    const { client, user } = setup();
    await screen.findByText('message 1');
    client.reply('messages:insert', { data: null, error: { code: '42501', message: 'new row violates row-level security policy' } });
    await user.type(screen.getByLabelText('Message'), 'nope{Enter}');
    expect(await screen.findByText(/not allowed/)).toBeTruthy();
    expect(screen.getByLabelText('Message')).toHaveValue('nope');
  });

  it('uploads an attachment, inserts the files row, then the message with attachment_id', async () => {
    const { client, user } = setup();
    await screen.findByText('message 1');
    client.reply('files:insert', { data: { id: 'f9', name: 'a.txt', mime: 'text/plain', size: 5, path: 'u-ada/x-a.txt' }, error: null });
    client.reply('messages:insert', { data: message(11, { user_id: 'u-ada', attachment_id: 'f9', body: 'file time', attachment: { id: 'f9', name: 'a.txt', size: 5, path: 'u-ada/x-a.txt' } }), error: null });
    await user.upload(document.querySelector('input[type=file]'), new File(['hello'], 'a.txt', { type: 'text/plain' }));
    await user.type(screen.getByLabelText('Message'), 'file time{Enter}');
    expect(await screen.findByRole('button', { name: 'Download a.txt' })).toBeTruthy();
    expect(client.storageCalls[0].args[0]).toMatch(/^u-ada\/.+-a\.txt$/);
    expect(client.op(client.callsOn('messages', 'insert')[0], 'insert')[0]).toMatchObject({ attachment_id: 'f9' });
  });

  it('removes the uploaded file again when the message insert fails', async () => {
    const { client, user } = setup();
    await screen.findByText('message 1');
    client.reply('files:insert', { data: { id: 'f9', name: 'a.txt', size: 5, path: 'p9' }, error: null });
    client.reply('messages:insert', { data: null, error: { message: 'boom' } });
    await user.upload(document.querySelector('input[type=file]'), new File(['hello'], 'a.txt'));
    await user.type(screen.getByLabelText('Message'), 'x{Enter}');
    await screen.findByText('boom');
    expect(client.storageCalls.map((c) => c.op)).toEqual(['upload', 'remove']);
    expect(client.callsOn('files', 'delete')).toHaveLength(1);
  });

  it('edits my own message through update().eq(id) and delete removes it (focus returns to the box)', async () => {
    const mineMsg = message(5, { user_id: 'u-ada', body: 'original', author: { username: 'ada', full_name: 'Ada', avatar_path: null } });
    const { client, user } = setup({ messages: [mineMsg] });
    await screen.findByText('original');
    client.reply('messages:update', { data: { ...mineMsg, body: 'fixed', edited_at: '2026-11-17T11:00:00Z' }, error: null });
    await user.click(screen.getByRole('button', { name: /Edit your message/ }));
    const box = screen.getByLabelText('Edit message');
    await user.clear(box);
    await user.type(box, 'fixed');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('fixed')).toBeTruthy();
    expect(screen.getByText('edited')).toBeTruthy();
    expect(client.op(client.callsOn('messages', 'update')[0], 'eq')).toEqual(['id', 5]);
    await user.click(screen.getByRole('button', { name: /Delete your message/ }));
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }));
    await waitFor(() => expect(screen.queryByText('fixed')).toBeNull());
    expect(screen.getByLabelText('Message')).toHaveFocus();
  });
});

describe('ChatPage: realtime', () => {
  it('subscribes to postgres_changes filtered by room, and removes the channel on unmount', async () => {
    const { client, unmount } = setup();
    const channel = await waitForRoomChannel(client);
    const events = channel.listeners.filter((l) => l.type === 'postgres_changes');
    expect(events.map((l) => l.filter.event).sort()).toEqual(['DELETE', 'INSERT', 'UPDATE']);
    expect(events[0].filter).toMatchObject({ schema: 'public', table: 'messages', filter: 'room_id=eq.r1' });
    unmount();
    expect(client.removed).toContain(channel);
  });

  it('is StrictMode safe: exactly one room channel survives the double mount', async () => {
    const { client } = setup({ strict: true });
    await screen.findByText('message 1');
    await waitFor(() => expect(client.channels.filter((c) => c.name === 'room:r1').length).toBeGreaterThan(0));
    const created = client.channels.filter((c) => c.name === 'room:r1');
    const alive = created.filter((c) => !client.removed.includes(c));
    expect(alive).toHaveLength(1);
  });

  it('merges a live INSERT from someone else, reusing the known author without refetching', async () => {
    const { client } = setup();
    await screen.findByText('message 1');
    const channel = await waitForRoomChannel(client);
    const before = client.callsOn('messages', 'select').length;
    await act(async () => channel.emitChange('INSERT', { new: { ...message(3, { body: 'fresh from grace' }), author: undefined, attachment: undefined } }));
    expect(await screen.findByText('fresh from grace')).toBeTruthy();
    expect(client.callsOn('messages', 'select')).toHaveLength(before); // author came from an older message
    expect(client.rpcCalls.filter((c) => c.name === 'mark_room_read').length).toBeGreaterThan(1); // keeps the room read
  });

  it('fetches the author for a live INSERT from an unknown user', async () => {
    const { client } = setup();
    await screen.findByText('message 1');
    const channel = await waitForRoomChannel(client);
    client.reply('messages:select', (call) => (client.op(call, 'eq')?.[0] === 'id'
      ? { data: message(4, { user_id: 'u-new', body: 'hi from new', author: { username: 'linus', full_name: 'Linus', avatar_path: null } }), error: null }
      : { data: [], error: null }));
    await act(async () => channel.emitChange('INSERT', { new: { id: 4, room_id: 'r1', user_id: 'u-new', body: 'hi from new', created_at: '2026-11-17T10:30:00Z' } }));
    expect(await screen.findByText('hi from new')).toBeTruthy();
    expect(screen.getByText('Linus').tagName).toBe('STRONG'); // a new author starts a new group: name shown
  });

  it('applies live UPDATE and DELETE events', async () => {
    const { client } = setup();
    await screen.findByText('message 1');
    const channel = await waitForRoomChannel(client);
    act(() => channel.emitChange('UPDATE', { new: { ...message(1), body: 'rewritten', edited_at: '2026-11-17T10:10:00Z' } }));
    expect(screen.getByText('rewritten')).toBeTruthy();
    act(() => channel.emitChange('DELETE', { old: { id: 2 } }));
    expect(screen.queryByText('message 2')).toBeNull();
  });

  it('shows "is typing" from a broadcast, ignores my own, and clears it after 3 seconds', async () => {
    const { client } = setup();
    await screen.findByText('message 1');
    const channel = await waitForRoomChannel(client);
    vi.useFakeTimers();
    try {
      act(() => channel.emitBroadcast('typing', { user_id: 'u-ada', username: 'ada' }));
      expect(screen.queryByText(/is typing/)).toBeNull();
      act(() => channel.emitBroadcast('typing', { user_id: 'u-grace', username: 'grace' }));
      expect(screen.getByText('grace is typing...')).toBeTruthy();
      act(() => vi.advanceTimersByTime(3100));
      expect(screen.queryByText(/is typing/)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('sends a throttled typing broadcast while I type', async () => {
    const { client, user } = setup();
    await screen.findByText('message 1');
    const channel = await waitForRoomChannel(client);
    await user.type(screen.getByLabelText('Message'), 'hello');
    expect(channel.send).toHaveBeenCalledTimes(1); // five keystrokes, one broadcast
    expect(channel.sent[0]).toMatchObject({ type: 'broadcast', event: 'typing', payload: { user_id: 'u-ada', username: 'ada' } });
  });

  it('tracks my presence once subscribed and lists who is online from the sync event', async () => {
    const { client } = setup();
    await screen.findByText('message 1');
    const channel = await waitForRoomChannel(client);
    expect(channel.track).toHaveBeenCalledWith(expect.objectContaining({ username: 'ada' }));
    expect(channel.options.config.presence.key).toBe('u-ada');
    expect(screen.getByText(/Online now: just you/)).toBeTruthy();
    act(() => channel.emitPresence({ 'u-ada': [{ username: 'ada' }], 'u-grace': [{ username: 'grace' }, { username: 'grace' }] }));
    expect(screen.getByText('Online now: ada, grace')).toBeTruthy();
  });
});
