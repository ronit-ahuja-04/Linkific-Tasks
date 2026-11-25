import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Hash, Lock, MessagesSquare } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { continuesGroup } from '../../lib/format';
import EmptyState from '../ui/EmptyState';
import UnderTheHood from '../ui/UnderTheHood';
import {
  applyChange, deleteMessage, discardAttachment, editMessage, fetchMessage, fetchMessages, friendlyError, markRoomRead,
  sendMessage, uploadAttachment, upsertMessage,
} from '../../lib/chat';
import Composer from './Composer';
import MessageItem from './MessageItem';
import { useRoomChannel } from './useRoomChannel';

/**
 * One room, live. The parent gives it key={roomId} so state resets per room.
 * The conversation is oldest first and stays scrolled to the newest message; the composer sits under it.
 * The log is a <div role="log"> around an <ol>: the list keeps its list semantics (audit A-1) and new messages
 * are announced politely.
 */
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

  const loadingEarlier = useRef(false);
  const loadEarlier = async () => {
    if (loadingEarlier.current) return; // the button and the scroll trigger can both ask: load once
    loadingEarlier.current = true;
    setLoadingMore(true);
    anchor.current = listRef.current?.scrollHeight ?? 0;
    const { data, error: failure, hasMore: more } = await fetchMessages(client, room.id, { before: messages[0]?.created_at });
    loadingEarlier.current = false;
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

  // INFINITE SCROLL UPWARD (Day 24): when the "Load earlier messages" button comes within 300 px of the top of the
  // conversation, the earlier page loads by itself, so reading back through history needs no clicks. The button stays
  // (keyboard and screen-reader users, and a fallback). It cannot loop: after a load, the reader's place is kept
  // (the layout effect above), which moves the button back out of view.
  const earlierRef = useRef(null);
  const loadEarlierLatest = useRef(loadEarlier);
  useEffect(() => { loadEarlierLatest.current = loadEarlier; });
  useEffect(() => {
    const target = earlierRef.current;
    const root = listRef.current;
    if (!target || !root || !hasMore || status !== 'ready') return undefined;
    if (typeof IntersectionObserver === 'undefined') return undefined; // an older browser: the button still works
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadEarlierLatest.current();
    }, { root, rootMargin: '300px 0px 0px 0px' });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, status]);

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

  // useCallback (Day 24): every MessageItem receives these two. MessageItem is memoised (React.memo), and memo compares
  // props by identity: a NEW function on every RoomView render (a new message, someone typing, presence) would make
  // all 500 messages re-render anyway. With useCallback they stay the same function as long as `client` does.
  const edit = useCallback(async (id, body) => {
    const { data, error: failure } = await editMessage(client, id, body);
    if (failure) return friendlyError(failure, 'Could not save the edit.');
    setMessages((list) => upsertMessage(list, data));
    return null;
  }, [client]);

  const remove = useCallback(async (id) => {
    const { error: failure } = await deleteMessage(client, id);
    if (failure) return friendlyError(failure, 'Could not delete the message.');
    setMessages((list) => list.filter((m) => m.id !== id));
    textareaRef.current?.focus(); // the deleted message's buttons are gone: put focus somewhere useful
    return null;
  }, [client]);

  // useMemo (Day 24): "does this message continue the previous person's group?" for every message. RoomView renders
  // far more often than the list changes (typing indicator, presence, the composer's sends), so compute it only when
  // the list itself changes. Booleans: an unchanged message keeps the same `grouped` value, so memo can skip it.
  const grouped = useMemo(() => messages.map((m, i) => continuesGroup(m, messages[i - 1])), [messages]);

  const others = typing.map((p) => p.username).filter(Boolean);
  const typingText = others.length === 0 ? '' : others.length === 1 ? `${others[0]} is typing...` : `${others.join(', ')} are typing...`;

  const Icon = room.is_private ? Lock : Hash;
  return (
    <div className="chat-room-page">
      <header className="chat-room-header">
        <Link to="/chat" className="chat-back"><ArrowLeft size={16} aria-hidden="true" />All rooms</Link>
        <div className="chat-room-title-row">
          <h1 id="room-title" className="chat-room-title">
            <Icon size={22} aria-hidden="true" />
            <span>{room.name}</span>
            {room.is_private ? <span className="sr-only"> (private room)</span> : null}
          </h1>
          <span className="chat-online-count" aria-hidden="true"><span className="chat-dot" />{online.length || 1} online</span>
        </div>
        {room.topic ? <p className="chat-topic">{room.topic}</p> : null}
      </header>

      <div className="chat-room-body">
        <section className="chat-conversation" aria-labelledby="room-title">
          {status === 'loading' ? <p className="muted chat-pad" role="status">Loading messages...</p> : null}
          {status === 'error' ? <p role="alert" className="alert alert-error chat-pad">{error}</p> : null}
          {status === 'ready' ? (
            <>
              {error ? <p role="alert" className="alert alert-error">{error}</p> : null}
              <div className="chat-scroll" ref={listRef} onScroll={onScroll}>
                {hasMore ? (
                  <button type="button" ref={earlierRef} className="btn btn-sm chat-earlier" onClick={loadEarlier} disabled={loadingMore}>{loadingMore ? 'Loading...' : 'Load earlier messages'}</button>
                ) : null}
                {messages.length === 0 ? (
                  <EmptyState compact headingLevel={2} icon={<MessagesSquare size={20} />} title="No messages yet">
                    Say hello: the first message starts the conversation.
                  </EmptyState>
                ) : null}
                <div className="chat-log" role="log" aria-label="Messages" aria-live="polite">
                  <ol className="chat-messages">
                    {messages.map((m, i) => (
                      <MessageItem key={m.id} message={m} mine={m.user_id === userId} grouped={grouped[i]} onEdit={edit} onDelete={remove} />
                    ))}
                  </ol>
                </div>
              </div>
              <p className="chat-typing" aria-live="polite">{typingText}</p>
              <Composer onSend={send} onTyping={notifyTyping} textareaRef={textareaRef} />
            </>
          ) : null}
        </section>

        <aside className="chat-details" aria-label="About this room">
          <div className="card chat-details-card">
            <h2 className="chat-details-title">About</h2>
            <p className="chat-details-text">{room.topic || 'No topic yet.'}</p>
            <p className="chat-details-text">{room.is_private ? 'Private: only members can find and read it.' : 'Public: anyone in the workspace can join.'}</p>
          </div>
          <div className="card chat-details-card">
            <h2 className="chat-details-title">Online now</h2>
            <p className="chat-online" aria-live="polite">
              <span className="chat-dot" aria-hidden="true" />
              Online now: {online.length ? online.join(', ') : 'just you'}
            </p>
          </div>
          <UnderTheHood>
            <ul>
              <li><code>from(&apos;messages&apos;).select(&apos;*, author:profiles(...)&apos;).eq(&apos;room_id&apos;, id).order(&apos;created_at&apos;, desc).order(&apos;id&apos;, desc).limit(50)</code>: the newest page with the author embedded, shown oldest first. The <code>id</code> order breaks ties between messages sent in the same instant.</li>
              <li><code>.lt(&apos;created_at&apos;, oldest)</code>: &quot;Load earlier&quot; asks for the page before the oldest message.</li>
              <li><code>channel(&apos;room:id&apos;).on(&apos;postgres_changes&apos;, ...)</code>: Postgres pushes new, edited and deleted messages.</li>
              <li><code>channel.send(&#123; type: &apos;broadcast&apos; &#125;)</code> and <code>channel.track()</code>: typing and who is online, never stored in the database.</li>
            </ul>
          </UnderTheHood>
        </aside>
      </div>
    </div>
  );
}
