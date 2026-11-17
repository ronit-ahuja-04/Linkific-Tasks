import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../context/ToastContext';
import { countUnreadNotifications, listNotifications, markAllNotificationsRead } from '../lib/chat';
import '../styles/chat.css';

/**
 * The bell in the header: how many unread notifications I have, kept live by Realtime.
 * Notifications are created by a DATABASE TRIGGER when someone writes "@me" in a message: the browser can never
 * insert one (see migration 4), which is what makes them trustworthy.
 */
export default function NotificationBell() {
  const { client, user } = useAuth();
  const toast = useToast();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const rootRef = useRef(null);
  const openRef = useRef(false);
  const userId = user?.id;

  const refreshCount = useCallback(async () => {
    const { count: total, error: failure } = await countUnreadNotifications(client);
    if (!failure) setCount(total ?? 0);
  }, [client]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: failure } = await listNotifications(client, 10);
    setLoading(false);
    if (failure) setError(failure.message);
    else setItems(data ?? []);
  }, [client]);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // the count, then live changes of MY notifications (the filter is applied on the Realtime server)
  useEffect(() => {
    if (!client || !userId) return undefined;
    let active = true;
    let channel = null;
    const timer = setTimeout(() => {
      if (!active) return;
      refreshCount();
      channel = client
        .channel(`notifications:${userId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, ({ new: row }) => {
          setCount((n) => n + 1);
          toast.info(`New mention: ${row.message}`);
          if (openRef.current) loadItems();
        })
        // an UPDATE means read_at changed (maybe in another tab): ask the server for the true number
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => {
          refreshCount();
          if (openRef.current) loadItems();
        })
        .subscribe();
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
      if (channel) client.removeChannel(channel);
    };
  }, [client, userId, refreshCount, loadItems, toast]);

  // close on Escape or a click outside
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') setOpen(false); };
    const onClick = (event) => { if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) loadItems();
  };

  const markAll = async () => {
    const { error: failure } = await markAllNotificationsRead(client);
    if (failure) {
      setError(failure.message);
      return;
    }
    setCount(0);
    setItems((list) => list.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
  };

  if (!userId) return null;
  return (
    <div className="bell" ref={rootRef}>
      <button type="button" className="icon-btn bell-btn" onClick={toggle} aria-expanded={open} aria-controls="bell-panel"
        aria-label={count > 0 ? `Notifications, ${count} unread` : 'Notifications, none unread'}>
        <Bell size={18} aria-hidden="true" />
        {count > 0 ? <span className="bell-count" aria-hidden="true">{count > 99 ? '99+' : count}</span> : null}
      </button>
      {open ? (
        <div id="bell-panel" className="bell-panel" role="region" aria-label="Notification list">
          <div className="bell-head">
            <strong>Notifications</strong>
            <button type="button" className="btn btn-sm" onClick={markAll} disabled={count === 0}>Mark all read</button>
          </div>
          {error ? <p role="alert" className="field-error">{error}</p> : null}
          {loading ? <p className="muted" role="status">Loading...</p> : null}
          {!loading && !error && items.length === 0 ? <p className="muted">No notifications yet. Mention someone with @name!</p> : null}
          <ul className="bell-list">
            {items.map((n) => (
              <li key={n.id} className={n.read_at ? 'is-read' : 'is-unread'}>
                <Link to={`/chat/${n.room_id}`} onClick={() => setOpen(false)}>
                  <span className="bell-room">{n.read_at ? '' : <span className="badge">new</span>} Mention in #{n.rooms?.name ?? 'a room'}</span>
                  <span className="bell-msg">{n.message}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
