// @vitest-environment jsdom
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Composer from '../src/components/chat/Composer';
import MessageItem from '../src/components/chat/MessageItem';
import NewRoomForm from '../src/components/chat/NewRoomForm';
import RoomList from '../src/components/chat/RoomList';
import { Wrapper, makeFakeClient, message, room } from './helpers/chat.jsx';

describe('RoomList (the room browser)', () => {
  const rooms = [room({ id: 'a', name: 'General', topic: 'Everything' }), room({ id: 'b', name: 'Leads', is_private: true, topic: 'Only the leads' }), room({ id: 'c', name: 'Open', topic: 'Anyone welcome' })];

  it('puts the unread count in the link name, marks private rooms and separates rooms I have not joined', () => {
    render(<MemoryRouter><RoomList rooms={rooms} unread={{ a: 3, b: 0 }} /></MemoryRouter>);
    const general = screen.getByRole('link', { name: /^General.*3 unread$/ });
    expect(general).toHaveAttribute('href', '/chat/a');
    expect(general.closest('li')).toHaveAttribute('data-unread');
    expect(screen.getByText('3').classList.contains('chat-unread')).toBe(true); // the number the eye sees (hidden from screen readers: the link says it)
    const leads = screen.getByRole('link', { name: /^Leads/ });
    expect(leads.textContent).toBe('Leads (private)');
    expect(leads.textContent).not.toMatch(/unread/);
    expect(screen.getByRole('heading', { name: 'Public rooms to join' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute('href', '/chat/c');
    expect(screen.getByText('Anyone welcome')).toBeInTheDocument(); // the topic, as the second line
  });

  it('caps huge counts at 99+', () => {
    render(<MemoryRouter><RoomList rooms={[room()]} unread={{ r1: 250 }} /></MemoryRouter>);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('filters by name or topic, and says when nothing matches', () => {
    const { rerender } = render(<MemoryRouter><RoomList rooms={rooms} unread={{ a: 0 }} query="leads" /></MemoryRouter>);
    expect(screen.queryByRole('link', { name: /^General/ })).toBeNull();
    expect(screen.getByRole('link', { name: /^Leads/ })).toBeInTheDocument();
    expect(screen.getByText('None of your rooms match.')).toBeInTheDocument();
    rerender(<MemoryRouter><RoomList rooms={rooms} unread={{ a: 0 }} query="welcome" /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Open' })).toBeInTheDocument(); // matched on its topic
  });
});

describe('NewRoomForm', () => {
  const open = async (client, onCreated = vi.fn()) => {
    const user = userEvent.setup();
    render(<Wrapper client={client}><NewRoomForm onCreated={onCreated} /></Wrapper>);
    return { user, onCreated };
  };

  it('puts focus on the name as soon as it opens', async () => {
    await open(makeFakeClient());
    expect(screen.getByLabelText('Room name')).toHaveFocus();
  });

  it('inserts the room and reports it', async () => {
    const client = makeFakeClient();
    client.reply('rooms:insert', { data: room({ id: 'n1', name: 'Design' }), error: null });
    const { user, onCreated } = await open(client);
    await user.type(screen.getByLabelText('Room name'), 'Design');
    await user.click(screen.getByLabelText(/Private/));
    await user.click(screen.getByRole('button', { name: 'Create room' }));
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1' })));
    expect(client.op(client.callsOn('rooms', 'insert')[0], 'insert')[0]).toMatchObject({ name: 'Design', is_private: true });
  });

  it('validates the name length without calling the database', async () => {
    const client = makeFakeClient();
    const { user } = await open(client);
    await user.type(screen.getByLabelText('Room name'), 'x');
    await user.click(screen.getByRole('button', { name: 'Create room' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/at least 2/);
    expect(client.callsOn('rooms')).toHaveLength(0);
  });

  it('maps a duplicate slug (23505) to a friendly message', async () => {
    const client = makeFakeClient();
    client.reply('rooms:insert', { data: null, error: { code: '23505', message: 'duplicate key' } });
    const { user, onCreated } = await open(client);
    await user.type(screen.getByLabelText('Room name'), 'General');
    await user.click(screen.getByRole('button', { name: 'Create room' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('already exists');
    expect(onCreated).not.toHaveBeenCalled();
  });
});

describe('MessageItem', () => {
  const renderItem = (msg, props = {}) =>
    render(<Wrapper client={makeFakeClient()}><ul><MessageItem message={msg} mine onEdit={vi.fn(async () => null)} onDelete={vi.fn(async () => null)} {...props} /></ul></Wrapper>);

  it('renders text only (no HTML) and highlights mentions', () => {
    const { container } = renderItem(message(1, { body: '<img src=x onerror=alert(1)> hi @ada' }));
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('@ada').tagName).toBe('MARK');
  });

  it('shows edit and delete only for my own messages', () => {
    renderItem(message(1), { mine: false });
    expect(screen.queryByRole('button', { name: /Edit your message/ })).not.toBeInTheDocument();
  });

  it('edits through onEdit and shows the "edited" badge', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn(async () => null);
    renderItem(message(1, { edited_at: '2026-11-17T10:05:00Z' }), { onEdit });
    expect(screen.getByText('edited')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Edit your message/ }));
    const box = screen.getByLabelText('Edit message');
    expect(box).toHaveFocus();
    await user.clear(box);
    await user.type(box, 'changed');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onEdit).toHaveBeenCalledWith(1, 'changed');
    await waitFor(() => expect(screen.queryByLabelText('Edit message')).not.toBeInTheDocument());
  });

  it('shows an edit error and stays in edit mode', async () => {
    const user = userEvent.setup();
    renderItem(message(1), { onEdit: vi.fn(async () => 'No permission') });
    await user.click(screen.getByRole('button', { name: /Edit your message/ }));
    await user.type(screen.getByLabelText('Edit message'), '!');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No permission');
    expect(screen.getByLabelText('Edit message')).toBeInTheDocument();
  });

  it('asks for confirmation before deleting', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn(async () => null);
    renderItem(message(4), { onDelete });
    await user.click(screen.getByRole('button', { name: /Delete your message/ }));
    expect(onDelete).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }));
    expect(onDelete).toHaveBeenCalledWith(4);
  });

  it('downloads an attachment through a signed URL created on click', async () => {
    const user = userEvent.setup();
    const client = makeFakeClient();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const file = { id: 'f1', name: 'plan.pdf', mime: 'application/pdf', size: 2048, path: 'u/abc-plan.pdf' };
    render(<Wrapper client={client}><ul><MessageItem message={message(1, { attachment: file })} mine={false} onEdit={vi.fn()} onDelete={vi.fn()} /></ul></Wrapper>);
    expect(client.storageCalls).toHaveLength(0); // nothing signed until the click
    await user.click(screen.getByRole('button', { name: 'Download plan.pdf' }));
    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(client.storageCalls[0]).toMatchObject({ op: 'createSignedUrl', args: ['u/abc-plan.pdf', 60, { download: 'plan.pdf' }] });
    click.mockRestore();
  });

  it('reports a signed URL failure', async () => {
    const user = userEvent.setup();
    const client = makeFakeClient();
    client.replyStorage('createSignedUrl', { data: null, error: { message: 'Object not found' } });
    render(<Wrapper client={client}><ul><MessageItem message={message(1, { attachment: { id: 'f', name: 'a.txt', size: 1, path: 'p' } })} mine={false} onEdit={vi.fn()} onDelete={vi.fn()} /></ul></Wrapper>);
    await user.click(screen.getByRole('button', { name: /Download a.txt/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Object not found');
  });
});

describe('Composer', () => {
  const setup = (props = {}, client = makeFakeClient()) => {
    const onSend = vi.fn(async () => null);
    const ref = { current: null };
    const utils = render(<Wrapper client={client}><Composer onSend={onSend} onTyping={vi.fn()} textareaRef={ref} {...props} /></Wrapper>);
    return { onSend, client, user: userEvent.setup(), ...utils };
  };

  it('sends with Enter and clears the box; Shift+Enter makes a new line', async () => {
    const { onSend, user } = setup();
    const box = screen.getByLabelText('Message');
    await user.type(box, 'line one{Shift>}{Enter}{/Shift}line two');
    expect(onSend).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(onSend).toHaveBeenCalledWith({ body: 'line one\nline two', file: null });
    await waitFor(() => expect(box).toHaveValue(''));
  });

  it('disables Send while empty and while sending', async () => {
    let finish;
    const { user } = setup({ onSend: () => new Promise((r) => { finish = r; }) });
    const send = screen.getByRole('button', { name: /Send/ });
    expect(send).toBeDisabled();
    await user.type(screen.getByLabelText('Message'), 'hi{Enter}');
    expect(screen.getByRole('button', { name: /Sending/ })).toBeDisabled();
    finish(null);
    await waitFor(() => expect(screen.getByLabelText('Message')).toHaveValue(''));
  });

  it('keeps the text and shows the error when sending fails', async () => {
    const { user } = setup({ onSend: vi.fn(async () => 'Could not send the message.') });
    await user.type(screen.getByLabelText('Message'), 'hi{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not send');
    expect(screen.getByLabelText('Message')).toHaveValue('hi');
  });

  it('suggests usernames after @ with ilike and inserts the chosen one', async () => {
    const client = makeFakeClient();
    client.reply('profiles:select', { data: [{ id: 'u2', username: 'grace', full_name: 'Grace Hopper' }], error: null });
    const { user, onSend } = setup({}, client);
    await user.type(screen.getByLabelText('Message'), 'hi @gr');
    const option = await screen.findByRole('option', { name: /@grace/ });
    // debounced (Day 24): typing "@gr" sends ONE lookup, for what was typed when typing paused
    expect(client.callsOn('profiles')).toHaveLength(1);
    expect(client.op(client.callsOn('profiles')[0], 'ilike')).toEqual(['username', 'gr%']);
    await user.click(option);
    expect(screen.getByLabelText('Message')).toHaveValue('hi @grace ');
    expect(onSend).not.toHaveBeenCalled();
  });

  it('picks the highlighted suggestion with the keyboard instead of sending', async () => {
    const client = makeFakeClient();
    client.reply('profiles:select', { data: [{ id: 'a', username: 'ada', full_name: null }, { id: 'b', username: 'adam', full_name: null }], error: null });
    const { user, onSend } = setup({}, client);
    await user.type(screen.getByLabelText('Message'), '@ad');
    await screen.findByRole('listbox');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Message')).toHaveValue('@adam ');
  });

  it('rejects an oversized attachment before sending', async () => {
    const { user, onSend } = setup();
    const big = new File(['x'], 'big.zip');
    Object.defineProperty(big, 'size', { value: 11 * 1024 * 1024 });
    await user.upload(document.querySelector('input[type=file]'), big);
    expect(screen.getByRole('alert')).toHaveTextContent(/limit is 10 MB/);
    expect(onSend).not.toHaveBeenCalled();
  });

  it('sends a chosen file along with the text', async () => {
    const { user, onSend } = setup();
    const file = new File(['hello'], 'a.txt', { type: 'text/plain' });
    await user.upload(document.querySelector('input[type=file]'), file);
    expect(screen.getByText(/a\.txt/)).toBeInTheDocument();
    await user.type(screen.getByLabelText('Message'), 'see this{Enter}');
    expect(onSend).toHaveBeenCalledWith({ body: 'see this', file });
  });

  it('calls onTyping while the user types', async () => {
    const onTyping = vi.fn();
    const { user } = setup({ onTyping });
    await user.type(screen.getByLabelText('Message'), 'abc');
    expect(onTyping).toHaveBeenCalledTimes(3);
    expect(within(document.body).queryByRole('listbox')).not.toBeInTheDocument();
  });
});
