/**
 * DASHBOARD: the queries behind the home page. All of them run as the signed-in user, so Row Level Security
 * decides what comes back (for example "team notes" never includes someone else's private notes).
 */

/** ONE round trip: a Postgres function (migration 4) that counts five things and returns them as JSON */
export function loadStats(client) {
  return client.rpc('workspace_stats');
}

/** Latest team notes: .eq('visibility','team') becomes WHERE visibility = 'team'; the embedded profiles() joins the author */
export function loadTeamNotes(client, limit = 5) {
  return client
    .from('notes')
    .select('id, title, updated_at, author:profiles(username, full_name)')
    .eq('visibility', 'team')
    .order('updated_at', { ascending: false })
    .limit(limit);
}

export function loadRecentFiles(client, userId, limit = 5) {
  // .eq('owner_id', ...): RLS also lets me read files shared in rooms, but this panel is MY files
  return client.from('files').select('id, name, size, mime, created_at').eq('owner_id', userId).order('created_at', { ascending: false }).limit(limit);
}

/**
 * Rooms I belong to, with the number of unread messages in each.
 * Two calls: the memberships (with the room joined in) and rpc('unread_counts'), merged here by room id.
 */
export async function loadMyRooms(client, userId) {
  const [members, unread] = await Promise.all([
    client.from('room_members').select('room_id, rooms(id, name, is_private)').eq('user_id', userId),
    client.rpc('unread_counts'),
  ]);
  const error = members.error || unread.error;
  if (error) return { data: [], error };
  return { data: mergeRooms(members.data, unread.data), error: null };
}

export function mergeRooms(members = [], unread = []) {
  const counts = new Map((unread ?? []).map((row) => [row.room_id, Number(row.unread)]));
  return (members ?? [])
    .filter((m) => m.rooms)
    .map((m) => ({ id: m.rooms.id, name: m.rooms.name, isPrivate: m.rooms.is_private, unread: counts.get(m.room_id) ?? 0 }))
    .sort((a, b) => b.unread - a.unread || a.name.localeCompare(b.name));
}

/** What needs me: my unread @mentions, newest first (the same rows the bell lists) */
export function loadUnreadMentions(client, limit = 3) {
  return client
    .from('notifications')
    .select('id, room_id, message, created_at, rooms(name)')
    .is('read_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);
}

/** A person as people know them: the full name, else the username */
export function displayName(person, fallback = 'someone') {
  return person?.full_name?.trim() || person?.username || fallback;
}

/** "Ada" for a greeting */
export function firstName(profile) {
  const full = profile?.full_name?.trim();
  return full ? full.split(/\s+/)[0] : profile?.username || 'there';
}

/** "Good morning" etc. The hour is passed in so the function stays pure */
export function greeting(hour) {
  if (hour < 5) return 'Working late';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** The tiles of the dashboard, in order */
export const STAT_TILES = [
  { key: 'my_notes', label: 'My notes', to: '/notes' },
  { key: 'team_notes', label: 'Team notes', to: '/notes' },
  { key: 'rooms', label: 'Rooms', to: '/chat' },
  { key: 'messages_today', label: 'Messages today', to: '/chat' },
  { key: 'unread_mentions', label: 'Unread mentions', to: '/chat' },
];

/** What each page shows, for the "What this app demonstrates" list */
export const DEMONSTRATES = [
  { page: 'Chat', to: '/chat', feature: 'Realtime', text: 'Postgres changes, Broadcast typing indicators and Presence (who is online) over one channel.' },
  { page: 'Notes', to: '/notes', feature: 'Database + RLS', text: 'Filters, ordering, pagination, tags (many-to-many), full-text search and live updates.' },
  { page: 'Files', to: '/files', feature: 'Storage', text: 'A private bucket, signed URLs that expire, and the difference from a public bucket.' },
  { page: 'Profile', to: '/profile', feature: 'Auth + public Storage', text: 'Sessions, password and magic-link sign-in, and avatars in a public bucket.' },
  { page: 'Query lab', to: '/lab', feature: 'supabase-js to SQL', text: 'Run each call and see the SQL, and watch Row Level Security say no.' },
];
