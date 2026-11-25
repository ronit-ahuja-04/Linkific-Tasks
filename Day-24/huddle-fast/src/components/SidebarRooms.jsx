import { Hash, Lock } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import CountBadge from './ui/CountBadge';

/**
 * The "Rooms" group of the sidebar. A room with unread messages is bold AND shows the number, so the state
 * is never colour alone; the number is grey here because amber is kept for mentions (the bell).
 * The room that is open shows no count: you are reading it.
 */
export default function SidebarRooms({ rooms, openRoomId, labelId }) {
  return (
    <div className="shell-group">
      <p id={labelId} className="shell-group-label">Rooms</p>
      {rooms && rooms.length === 0 ? (
        <p className="shell-empty">No rooms yet. <Link to="/chat">Find a room</Link></p>
      ) : null}
      {rooms && rooms.length > 0 ? (
        <ul className="shell-list" aria-labelledby={labelId}>
          {rooms.map((room) => {
            const unread = room.id === openRoomId ? 0 : room.unread;
            const Icon = room.isPrivate ? Lock : Hash;
            return (
              <li key={room.id}>
                <NavLink to={`/chat/${room.id}`} className="shell-link shell-room" data-unread={unread > 0 ? '' : undefined}>
                  <Icon size={16} aria-hidden="true" />
                  <span className="shell-room-name">
                    {room.name}
                    {room.isPrivate ? <span className="sr-only"> (private)</span> : null}
                  </span>
                  <CountBadge count={unread} label={`, ${unread} unread`} />
                </NavLink>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
