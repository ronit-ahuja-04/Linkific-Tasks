import { Link } from 'react-router-dom';
import { Hash, Lock } from 'lucide-react';

/**
 * The room browser on /chat: rooms I belong to (with unread counts), then public rooms I could join.
 * `query` filters by name or topic. Each row's link name carries what the eye gets from the row:
 * "Leads (private), 3 unread".
 */
export default function RoomList({ rooms, unread, query = '' }) {
  const q = query.trim().toLowerCase();
  const matches = (r) => !q || r.name.toLowerCase().includes(q) || (r.topic ?? '').toLowerCase().includes(q);
  const joined = rooms.filter((r) => r.id in unread && matches(r));
  const others = rooms.filter((r) => !(r.id in unread) && matches(r));

  const row = (room) => {
    const count = unread[room.id] ?? 0;
    const Icon = room.is_private ? Lock : Hash;
    return (
      <li key={room.id} className="row" data-unread={count > 0 ? '' : undefined}>
        <span className="row-icon" aria-hidden="true"><Icon size={16} /></span>
        <span className="row-main">
          <Link to={`/chat/${room.id}`} className="row-link">
            {room.name}
            {room.is_private ? <span className="sr-only"> (private)</span> : null}
            {count > 0 ? <span className="sr-only">, {count} unread</span> : null}
          </Link>
          {room.topic ? <span className="row-meta">{room.topic}</span> : null}
        </span>
        {count > 0 ? <span className="row-end"><span className="count chat-unread" aria-hidden="true">{count > 99 ? '99+' : count}</span></span> : null}
      </li>
    );
  };

  return (
    <>
      <section className="chat-section" aria-labelledby="rooms-joined">
        <h2 id="rooms-joined" className="chat-section-title">Your rooms</h2>
        {joined.length ? <ul className="rows">{joined.map(row)}</ul> : <p className="muted">{q ? 'None of your rooms match.' : 'You have not joined a room yet.'}</p>}
      </section>
      <section className="chat-section" aria-labelledby="rooms-public">
        <h2 id="rooms-public" className="chat-section-title">Public rooms to join</h2>
        {others.length ? <ul className="rows">{others.map(row)}</ul> : <p className="muted">{q ? 'No public room matches.' : 'You are in every public room.'}</p>}
      </section>
    </>
  );
}
