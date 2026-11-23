import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import NewRoomForm from '../components/chat/NewRoomForm';
import RoomList from '../components/chat/RoomList';
import RoomView from '../components/chat/RoomView';
import { fetchUnreadCounts, friendlyError, listRooms } from '../lib/chat';
import '../styles/chat.css';

export default function ChatPage() {
  const { client, user } = useAuth();
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [unread, setUnread] = useState({}); // { roomId: count } for rooms I belong to
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Chat - Huddle';
  }, []);

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
  // a badge only makes sense for the rooms I am NOT looking at
  const badges = roomId ? { ...unread, [roomId]: 0 } : unread; // (the room's own live messages are marked read as they arrive)

  return (
    <div className="chat-layout">
      <aside className="chat-side" aria-label="Rooms">
        <h1 className="page-title chat-title">Chat</h1>
        {status === 'loading' ? <p className="muted" role="status">Loading rooms...</p> : null}
        {status === 'error' ? <p role="alert" className="alert alert-error">{error}</p> : null}
        {status === 'ready' ? <RoomList rooms={rooms} unread={badges} activeId={roomId} /> : null}
        <NewRoomForm onCreated={created} />
        <details className="chat-how">
          <summary>How this works</summary>
          <ul>
            <li><code>from('rooms').select()</code>: RLS returns public rooms and my private ones, no filter needed.</li>
            <li><code>rpc('unread_counts')</code>: a SQL function counting messages after my last read.</li>
            <li><code>rpc('mark_room_read')</code>: opening a room joins it and resets its badge.</li>
          </ul>
        </details>
      </aside>
      <div className="chat-main">
        {status === 'ready' && !roomId ? <p className="muted chat-pad">Pick a room on the left, or create one.</p> : null}
        {status === 'ready' && roomId && !room ? <p role="alert" className="alert alert-warning">That room does not exist, or you cannot see it.</p> : null}
        {room ? <RoomView key={room.id} room={room} onRead={markedRead} /> : null}
      </div>
    </div>
  );
}
