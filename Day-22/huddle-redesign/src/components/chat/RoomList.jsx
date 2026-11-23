import { Link } from 'react-router-dom';
import { Hash, Lock } from 'lucide-react';

/** Rooms I belong to first (with unread badges), then the public rooms I have not joined yet */
export default function RoomList({ rooms, unread, activeId }) {
  const joined = rooms.filter((r) => r.id in unread);
  const others = rooms.filter((r) => !(r.id in unread));
  const item = (room) => {
    const count = unread[room.id] ?? 0;
    return (
      <li key={room.id}>
        <Link to={`/chat/${room.id}`} className="chat-room-link" aria-current={room.id === activeId ? 'page' : undefined}>
          {room.is_private ? <Lock size={14} aria-hidden="true" /> : <Hash size={14} aria-hidden="true" />}
          <span className="chat-room-name">{room.name}</span>
          {room.is_private ? <span className="sr-only">(private)</span> : null}
          {count > 0 ? <span className="chat-unread" aria-label={`${count} unread`}>{count > 99 ? '99+' : count}</span> : null}
        </Link>
      </li>
    );
  };
  return (
    <>
      <h2 className="chat-heading">Your rooms</h2>
      {joined.length ? <ul className="chat-rooms">{joined.map(item)}</ul> : <p className="muted chat-small">You have not joined a room yet.</p>}
      {others.length ? (
        <>
          <h2 className="chat-heading">Public rooms to join</h2>
          <ul className="chat-rooms">{others.map(item)}</ul>
        </>
      ) : null}
    </>
  );
}
