import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  applyChange, deleteMessage, discardAttachment, editMessage, fetchMessage, fetchMessages, friendlyError, markRoomRead,
  sendMessage, uploadAttachment, upsertMessage,
} from '../../lib/chat';
import Composer from './Composer';
import MessageItem from './MessageItem';
import { useRoomChannel } from './useRoomChannel';

/** The right-hand side: one room's messages, live. The parent gives it key={roomId} so state resets per room. */
export default function RoomView({ room, onRead }) {
  const { client, user, profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const listRef = useRef(null);
  const textareaRef = useRef(null);
  const stick = useRef(true); // keep the view at the bottom while new messages arrive
  const anchor = useRef(null); // scroll height before "Load earlier", to keep the reader's place
  const messagesRef = useRef(messages);
  const userId = user?.id;

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Open the room: join/mark it read (rpc), then load the newest page
  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data, error: failure, hasMore: more }] = await Promise.all([
        fetchMessages(client, room.id),
        markRoomRead(client, room.id).then(({ error: readError }) => { if (active && !readError) onRead?.(room.id); }),
      ]);
      if (!active) return;
      if (failure) {
        setError(friendlyError(failure, 'Could not load messages.'));
        setStatus('error');
        return;
      }
      setMessages(data);
      setHasMore(Boolean(more));
      setStatus('ready');
    })();
    return () => { active = false; };
  }, [client, room.id, onRead]);

  // Realtime: INSERT / UPDATE / DELETE of a message in this room
  const onChange = useCallback(
    async (payload) => {
      if (payload.eventType !== 'INSERT') {
        setMessages((list) => applyChange(list, payload));
        return;
      }
      const row = payload.new;
      if (messagesRef.current.some((m) => m.id === row.id)) return; // my own send already added it (de-duplicate)
      const known = messagesRef.current.find((m) => m.user_id === row.user_id && m.author)?.author;
      let message = row;
      if (known && !row.attachment_id) {
        message = { ...row, author: known };
      } else {
        // the event carries the bare row: fetch the author (and attachment) with the embedded select
        const { data } = await fetchMessage(client, row.id);
        message = data ?? row;
      }
      setMessages((list) => upsertMessage(list, message));
      if (row.user_id !== userId) markRoomRead(client, room.id); // I am looking at it: keep it read
    },
    [client, room.id, userId]
  );

  const { online, typing, notifyTyping } = useRoomChannel({ client, roomId: room.id, userId, username: profile?.username ?? user?.email, onMessageChange: onChange });

  // scrolling: stay at the bottom for new messages, keep the place after loading older ones
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (anchor.current !== null) {
      el.scrollTop += el.scrollHeight - anchor.current;
      anchor.current = null;
    } else if (stick.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const onScroll = () => {
    const el = listRef.current;
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const loadEarlier = async () => {
    setLoadingMore(true);
    anchor.current = listRef.current?.scrollHeight ?? 0;
    const { data, error: failure, hasMore: more } = await fetchMessages(client, room.id, { before: messages[0]?.created_at });
    setLoadingMore(false);
    if (failure) {
      anchor.current = null;
      setError(friendlyError(failure, 'Could not load earlier messages.'));
      return;
    }
    setError('');
    setMessages((list) => data.reduce((acc, m) => upsertMessage(acc, m), list));
    setHasMore(Boolean(more));
  };

  // returns an error sentence, or null when it worked (the Composer shows it)
  const send = async ({ body, file }) => {
    let attachment = null;
    if (file) {
      const uploaded = await uploadAttachment(client, userId, file);
      if (uploaded.error) return friendlyError(uploaded.error, 'Could not upload the file.');
      attachment = uploaded.data;
    }
    const { data, error: failure } = await sendMessage(client, { roomId: room.id, body, attachmentId: attachment?.id });
    if (failure) {
      if (attachment) await discardAttachment(client, attachment);
      return friendlyError(failure, 'Could not send the message.');
    }
    stick.current = true;
    setMessages((list) => upsertMessage(list, data));
    return null;
  };

  const edit = async (id, body) => {
    const { data, error: failure } = await editMessage(client, id, body);
    if (failure) return friendlyError(failure, 'Could not save the edit.');
    setMessages((list) => upsertMessage(list, data));
    return null;
  };

  const remove = async (id) => {
    const { error: failure } = await deleteMessage(client, id);
    if (failure) return friendlyError(failure, 'Could not delete the message.');
    setMessages((list) => list.filter((m) => m.id !== id));
    textareaRef.current?.focus(); // the deleted message's buttons are gone: put focus somewhere useful
    return null;
  };

  const others = typing.map((p) => p.username).filter(Boolean);
  const typingText = others.length === 0 ? '' : others.length === 1 ? `${others[0]} is typing...` : `${others.join(', ')} are typing...`;

  return (
    <section className="chat-room" aria-labelledby="room-title">
      <header className="chat-room-head">
        <div>
          <h2 id="room-title">{room.is_private ? 'Private: ' : '#'}{room.name}</h2>
          {room.topic ? <p className="muted">{room.topic}</p> : null}
        </div>
        <p className="chat-online" aria-live="polite">
          <span className="chat-dot" aria-hidden="true" />
          Online now: {online.length ? online.join(', ') : 'just you'}
        </p>
      </header>

      <details className="chat-how">
        <summary>How this works</summary>
        <ul>
          <li><code>from('messages').select('*, author:profiles(...)').eq('room_id', id).order('created_at', {'{ ascending: false }'}).limit(50)</code>: the latest page, with an embedded relationship.</li>
          <li><code>.lt('created_at', oldest)</code>: "Load earlier" asks for the page before the oldest message.</li>
          <li><code>channel('room:id').on('postgres_changes', ...)</code>: Postgres pushes new, edited and deleted messages.</li>
          <li><code>channel.send({'{ type: \'broadcast\' }'})</code> and <code>channel.track()</code>: typing and who is online, never stored in the database.</li>
        </ul>
      </details>

      {status === 'loading' ? <p className="muted chat-pad" role="status">Loading messages...</p> : null}
      {status === 'error' ? <p role="alert" className="alert alert-error">{error}</p> : null}
      {status === 'ready' ? (
        <>
          {error ? <p role="alert" className="alert alert-error">{error}</p> : null}
          <div className="chat-scroll" ref={listRef} onScroll={onScroll}>
            {hasMore ? (
              <button type="button" className="btn btn-sm chat-earlier" onClick={loadEarlier} disabled={loadingMore}>{loadingMore ? 'Loading...' : 'Load earlier messages'}</button>
            ) : null}
            {messages.length === 0 ? <p className="muted chat-pad">No messages yet. Say hello!</p> : null}
            <ul className="chat-messages" role="log" aria-label="Messages" aria-live="polite">
              {messages.map((m) => (
                <MessageItem key={m.id} message={m} mine={m.user_id === userId} onEdit={edit} onDelete={remove} />
              ))}
            </ul>
          </div>
          <p className="chat-typing muted" aria-live="polite">{typingText}</p>
          <Composer onSend={send} onTyping={notifyTyping} textareaRef={textareaRef} />
        </>
      ) : null}
    </section>
  );
}
