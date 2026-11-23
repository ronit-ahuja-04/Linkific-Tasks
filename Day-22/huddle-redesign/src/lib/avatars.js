/** Public URL of a profile picture (the 'avatars' bucket is public: no signing needed), or null */
export function avatarUrl(client, path) {
  if (!client || !path) return null;
  return client.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

/** Two letters for the circle shown when someone has no picture */
export function initials(profile) {
  const source = (profile?.full_name || profile?.username || '?').trim();
  const words = source.split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? '?') + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase();
}
