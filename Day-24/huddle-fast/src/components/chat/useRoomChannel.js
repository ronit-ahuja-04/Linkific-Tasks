import { useCallback, useEffect, useRef, useState } from 'react';

const TYPING_VISIBLE_MS = 3000; // a "typing" signal is forgotten after 3 s without a new one
const TYPING_SEND_EVERY_MS = 2000; // and we send at most one every 2 s (throttle)

/**
 * ONE Realtime CHANNEL per room, carrying three different features at once:
 *
 *   1. postgres_changes: Postgres tells us about rows inserted/updated/deleted in `messages`. This only works
 *      because migration 6 added the table to the `supabase_realtime` publication, and Realtime checks the
 *      table's RLS policies before it sends you a row, so you only receive what you could SELECT.
 *   2. broadcast: tiny messages between browsers that never touch the database (used for "ada is typing").
 *   3. presence: a shared little state per connected user (`track`), merged for everybody into `presenceState()`
 *      (used for "who is online in this room"). It disappears by itself when a tab closes.
 *
 * The effect creates the channel and its cleanup REMOVES it (`removeChannel`), which closes it on the server.
 * Creation is deferred by one tick so React StrictMode's double-run (mount, cleanup, mount) never subscribes twice.
 */
export function useRoomChannel({ client, roomId, userId, username, onMessageChange }) {
  const [online, setOnline] = useState([]);
  const [typing, setTyping] = useState([]);
  const channelRef = useRef(null);
  const lastSent = useRef(0);
  const typingTimers = useRef(new Map());
  const handler = useRef(onMessageChange);

  useEffect(() => {
    handler.current = onMessageChange;
  }, [onMessageChange]);

  useEffect(() => {
    if (!client || !roomId || !userId) return undefined;
    const timers = typingTimers.current;
    let channel = null;

    const start = () => {
      channel = client.channel(`room:${roomId}`, {
        // presence.key identifies this user in presenceState(); broadcast.self false: do not hear my own typing
        config: { presence: { key: userId }, broadcast: { self: false } },
      });
      for (const eventType of ['INSERT', 'UPDATE', 'DELETE']) {
        channel.on(
          'postgres_changes',
          // `filter` is evaluated by the Realtime server, so only this room's rows travel to the browser
          { event: eventType, schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
          (payload) => handler.current?.(payload)
        );
      }
      channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (!payload || payload.user_id === userId) return;
        setTyping((list) => (list.some((p) => p.user_id === payload.user_id) ? list : [...list, { user_id: payload.user_id, username: payload.username }]));
        clearTimeout(timers.get(payload.user_id));
        timers.set(
          payload.user_id,
          setTimeout(() => {
            timers.delete(payload.user_id);
            setTyping((list) => list.filter((p) => p.user_id !== payload.user_id));
          }, TYPING_VISIBLE_MS)
        );
      });
      channel.on('presence', { event: 'sync' }, () => {
        // presenceState() = { <key>: [ { username, ... } ] } for everybody connected to this channel
        const names = Object.values(channel.presenceState()).flatMap((metas) => metas.map((meta) => meta.username).filter(Boolean));
        setOnline([...new Set(names)].sort());
      });
      channel.subscribe((status) => {
        // only once the socket is joined can we announce ourselves
        if (status === 'SUBSCRIBED') channel.track({ username, online_at: new Date().toISOString() });
      });
      channelRef.current = channel;
    };

    const timer = setTimeout(start, 0);
    return () => {
      clearTimeout(timer);
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
      if (channel) client.removeChannel(channel);
      channelRef.current = null;
    };
  }, [client, roomId, userId, username]);

  /** Call on every keystroke: it sends a broadcast at most every 2 s */
  const notifyTyping = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    const now = Date.now();
    if (now - lastSent.current < TYPING_SEND_EVERY_MS) return;
    lastSent.current = now;
    channel.send({ type: 'broadcast', event: 'typing', payload: { user_id: userId, username } });
  }, [userId, username]);

  return { online, typing, notifyTyping };
}
