/** Public URL of a profile picture (the 'avatars' bucket is public: no signing needed), or null */
export function avatarUrl(client, path) {
  if (!client || !path) return null;
  return client.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

/**
 * What an <img> needs for a profile picture (Day 24). Resized avatars come in two sizes (64 and 256 px, see
 * src/lib/images.js): `srcSet` lists both with their widths and the browser picks by the size the picture is shown at
 * (`sizes`) and the screen's pixel density. Older avatars are a single original file.
 */
export function avatarSources(client, path) {
  const url = avatarUrl(client, path);
  if (!url) return null;
  const match = path.match(/^(.*-)256\.(webp|png)$/);
  if (!match) return { src: url };
  const small = avatarUrl(client, `${match[1]}64.${match[2]}`);
  return { src: small, srcSet: `${small} 64w, ${url} 256w` };
}

/** Two letters for the circle shown when someone has no picture */
export function initials(profile) {
  const source = (profile?.full_name || profile?.username || '?').trim();
  const words = source.split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? '?') + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase();
}
