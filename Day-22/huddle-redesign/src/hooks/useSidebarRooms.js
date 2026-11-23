import { useCallback, useEffect, useRef, useState } from 'react';
import { loadMyRooms } from '../lib/dashboard';

/**
 * My rooms for the sidebar, A to Z, with unread counts (null until the first answer).
 * Reloaded on every page change (opening a room marks it read) and, through Realtime, shortly after a message
 * from someone else arrives in any room I can see. Row Level Security decides which inserts reach me.
 */
export function useSidebarRooms(client, userId, pathname) {
  const [rooms, setRooms] = useState(null);
  const debounce = useRef(null);
  const latest = useRef(0);

  const load = useCallback(() => {
    if (!client || !userId) return;
    const request = ++latest.current; // only the newest answer counts: a slow older one must not overwrite it
    loadMyRooms(client, userId).then(({ data, error }) => {
      if (request === latest.current && !error) setRooms([...data].sort((a, b) => a.name.localeCompare(b.name)));
    });
  }, [client, userId]);

  useEffect(() => {
    load();
  }, [load, pathname]);

  useEffect(() => {
    if (!client?.channel || !userId) return undefined;
    let active = true;
    let channel = null;
    // subscribe on the next tick: React's StrictMode mounts twice in development, and the first mount is gone by then
    const timer = setTimeout(() => {
      if (!active) return;
      channel = client
        .channel(`sidebar-rooms:${userId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, ({ new: row }) => {
          if (row?.user_id === userId) return;
          clearTimeout(debounce.current);
          debounce.current = setTimeout(load, 400); // a burst of messages is one reload
        })
        .subscribe();
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
      clearTimeout(debounce.current);
      if (channel) client.removeChannel(channel);
    };
  }, [client, userId, load]);

  return rooms;
}
