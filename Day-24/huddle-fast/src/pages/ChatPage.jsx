import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import NewRoomForm from '../components/chat/NewRoomForm';
import RoomList from '../components/chat/RoomList';
import RoomView from '../components/chat/RoomView';
import PageHeader from '../components/ui/PageHeader';
import UnderTheHood from '../components/ui/UnderTheHood';
import { fetchUnreadCounts, friendlyError, listRooms } from '../lib/chat';
import '../styles/chat.css';

/**
 * CHAT, two screens on one route:
 *  - /chat: the room browser (search, my rooms with unread counts, public rooms to join, New room)
 *  - /chat/:roomId: one conversation, full width; the sidebar already lists my rooms, so no second list here.
 * On a phone these are naturally two screens, with "All rooms" to go back.
 */
export default function ChatPage() {
  const { client, user } = useAuth();
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [unread, setUnread] = useState({}); // { roomId: count } for rooms I belong to
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const location = useLocation();
  const [creating, setCreating] = useState(() => Boolean(location.state?.newRoom)); // "Start a room" on the dashboard
  const [query, setQuery] = useState('');

  // rooms (RLS filters them) + unread counts (rpc), in parallel
  useEffect(() => {
    let active = true;
    (async () => {
      const [roomsResult, unreadResult] = await Promise.all([listRooms(client), fetchUnreadCounts(client)]);
      if (!active) return;
      if (roomsResult.error) {
        setError(friendlyError(roomsResult.error, 'Could not load rooms.'));
        setStatus('error');
        return;
      }
      setRooms(roomsResult.data ?? []);
      setUnread(unreadResult.data ?? {});
      setStatus('ready');
    })();
    return () => { active = false; };
  }, [client]);

  // New messages in OTHER rooms raise their badge. One channel, no filter: RLS already limits what arrives.
  useEffect(() => {
    if (!client || !user?.id) return undefined;
    let channel = null;
    let latest = 0;
    // Ask the database for the real counts instead of adding 1 to a local number: two messages arriving
    // together, or one arriving while the first answer is still on its way, can never leave a stale badge.
    // Only the newest answer is used.
    const refresh = () => {
      latest += 1;
      const mine = latest;
      fetchUnreadCounts(client).then((result) => {
        if (mine === latest && !result.error) setUnread(result.data ?? {});
      });
    };
    const timer = setTimeout(() => {
      channel = client
        .channel('chat:unread')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, ({ new: row }) => {
          if (row.user_id === user.id) return;
          refresh();
        })
        // (re)connected: a message may have arrived while there was no channel yet, so ask once more
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') refresh();
        });
    }, 0);
    return () => {
      clearTimeout(timer);
      if (channel) client.removeChannel(channel);
    };
  }, [client, user?.id]);

  const markedRead = useCallback((id) => setUnread((counts) => ({ ...counts, [id]: 0 })), []);

  const created = (room) => {
    setRooms((list) => [...list, room].sort((a, b) => a.name.localeCompare(b.name)));
    setUnread((counts) => ({ ...counts, [room.id]: 0 }));
    navigate(`/chat/${room.id}`);
  };

  const room = rooms.find((r) => r.id === roomId);

  useEffect(() => {
    document.title = room ? `${room.name} · Chat · Huddle` : 'Chat · Huddle';
  }, [room]);

  if (roomId) {
    if (room) return <RoomView key={room.id} room={room} onRead={markedRead} />;
    return (
      <div className="chat-room-page">
        <Link to="/chat" className="chat-back"><ArrowLeft size={16} aria-hidden="true" />All rooms</Link>
        {status === 'loading' ? <p className="muted" role="status">Loading the room...</p> : null}
        {status === 'error' ? <p role="alert" className="alert alert-error">{error}</p> : null}
        {status === 'ready' ? (
          <>
            <h1>Room not found</h1>
            <p role="alert" className="alert alert-warning">That room does not exist, or you cannot see it.</p>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="chat-browser">
      <PageHeader
        title="Chat"
        description="Rooms you are in, and public rooms you can join."
        actions={
          <button type="button" className="btn btn-primary" aria-expanded={creating} aria-controls="new-room" onClick={() => setCreating((open) => !open)}>
            <Plus size={16} aria-hidden="true" />New room
          </button>
        }
      />
      {creating ? (
        <section id="new-room" className="card chat-new" aria-labelledby="new-room-title">
          <h2 id="new-room-title" className="card-title">Create a room</h2>
          <NewRoomForm onCreated={created} onCancel={() => setCreating(false)} />
        </section>
      ) : null}

      <div className="field chat-search">
        <label htmlFor="room-search">Find a room</label>
        <input id="room-search" className="input" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or topic" autoComplete="off" />
      </div>

      {status === 'loading' ? <p className="muted" role="status">Loading rooms...</p> : null}
      {status === 'error' ? <p role="alert" className="alert alert-error">{error}</p> : null}
      {status === 'ready' ? <RoomList rooms={rooms} unread={unread} query={query} /> : null}

      <UnderTheHood>
        <ul>
          <li><code>from(&apos;rooms&apos;).select()</code>: Row Level Security returns public rooms and my private ones, no filter needed.</li>
          <li><code>rpc(&apos;unread_counts&apos;)</code>: a SQL function counting messages after my last read.</li>
          <li><code>rpc(&apos;mark_room_read&apos;)</code>: opening a room joins it and resets its count.</li>
          <li>One Realtime channel on <code>messages</code> INSERT (no filter: RLS decides what reaches me) refreshes the counts.</li>
        </ul>
      </UnderTheHood>
    </div>
  );
}
