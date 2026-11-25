/**
 * FILES: pure logic for Supabase Storage + the `files` table. Every function takes the supabase `client` first,
 * so tests can pass a fake.
 *
 * A file lives in TWO places that must agree:
 *   1. the BYTES in Storage (bucket "attachments", PRIVATE)  -> client.storage.from('attachments')
 *   2. a ROW in the Postgres table `files` (name, size, who owns it, which note) -> client.from('files')
 * So an upload is two steps, and if the second fails we undo the first (a "rollback by hand").
 */
export const BUCKET = 'attachments';
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // the bucket itself also refuses > 10 MiB (file_size_limit)

/** Choices for "Share link". A signed URL stops working by itself after this many seconds. */
export const EXPIRY_OPTIONS = [
  { seconds: 60, label: '60 seconds' },
  { seconds: 3600, label: '1 hour' },
  { seconds: 86400, label: '24 hours' },
];

/** Keep letters, digits, dot, dash and underscore: no slashes (they would create folders), no spaces or odd characters */
export function safeName(name) {
  const cleaned = String(name ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^[-.]+/, '')
    .replace(/-{2,}/g, '-')
    .slice(-100);
  return cleaned || 'file';
}

/** `<user id>/<random>-<name>`: the storage policies check that the FIRST folder is the caller's own id */
export function buildPath(userId, name, uuid = crypto.randomUUID()) {
  return `${userId}/${uuid}-${safeName(name)}`;
}

/** Returns an error message, or null when the file may be uploaded */
export function validateFile(file) {
  if (!file) return 'Choose a file first.';
  if (file.size === 0) return `"${file.name}" is empty.`;
  if (file.size > MAX_FILE_BYTES) return `"${file.name}" is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_FILE_BYTES)}.`;
  return null;
}

export function formatBytes(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function isImage(mime) {
  return typeof mime === 'string' && mime.startsWith('image/');
}

/** Pictures we make a small preview of. Not GIF (it would lose its animation) or SVG (already small and sharp at any size). */
export const canThumbnail = (mime) => isImage(mime) && !/gif|svg/.test(mime);

/**
 * Day 24: upload a small WebP preview next to an image (`<path>.thumb.webp`) and return its path, or null.
 * Best effort: no canvas in this browser, or a failed upload, just means no thumbnail (the original is shown instead).
 * The resizer (src/lib/images.js) is downloaded only now, when an image is uploaded.
 */
export async function uploadThumbnail(bucket, path, file) {
  if (!canThumbnail(file.type)) return null;
  try {
    const { makeThumbnail } = await import('./images');
    const thumb = await makeThumbnail(file);
    const thumbPath = `${path}.thumb.${thumb.ext}`;
    const { error } = await bucket.upload(thumbPath, thumb.blob, { contentType: thumb.blob.type, upsert: false, cacheControl: '31536000' });
    return error ? null : thumbPath;
  } catch {
    return null;
  }
}

/** "3:05" for 185 seconds, "1:00:00" for an hour: what the countdown shows */
export function formatCountdown(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** Turn a Storage / Postgres error into one sentence for the user */
export function describeError(error, fallback = 'Something went wrong.') {
  if (!error) return fallback;
  const message = error.message || fallback;
  if (/exceeded the maximum allowed size|too large|413/i.test(message + (error.statusCode ?? ''))) return 'That file is larger than the 10 MB limit.';
  if (/row-level security|violates row-level/i.test(message)) return 'You are not allowed to do that (a security policy refused it).';
  if (/already exists|duplicate/i.test(message)) return 'A file with that name already exists. Try again.';
  return message;
}

/**
 * UPLOAD with rollback.
 *  1. storage.upload(path, file, { upsert: false }) sends the bytes. upsert:false means "fail instead of overwriting".
 *  2. insert a row in `files`. `.select(...).single()` asks Postgres to RETURN the new row (with the note title
 *     joined in), so the page can show it without a second query.
 *  If step 2 fails there would be bytes with no record (an orphan that nobody can see or pay attention to), so
 *  we remove them again.
 */
export async function uploadFile(client, userId, file, { noteId = null } = {}) {
  const invalid = validateFile(file);
  if (invalid) return { data: null, error: new Error(invalid) };

  const path = buildPath(userId, file.name);
  const contentType = file.type || 'application/octet-stream';
  const bucket = client.storage.from(BUCKET);

  const { error: uploadError } = await bucket.upload(path, file, { contentType, upsert: false });
  if (uploadError) return { data: null, error: uploadError };
  const thumbPath = await uploadThumbnail(bucket, path, file);

  const { data, error: rowError } = await client
    .from('files')
    .insert({ name: file.name.slice(0, 200), mime: contentType, size: file.size, path, note_id: noteId, thumb_path: thumbPath })
    .select('*, note:notes(id, title)')
    .single();

  if (rowError) {
    const { error: cleanupError } = await bucket.remove(thumbPath ? [path, thumbPath] : [path]); // ROLLBACK the bytes
    return { data: null, error: rowError, cleanupError };
  }
  return { data, error: null };
}

/**
 * My files, newest first.
 *
 * NOT "everything RLS lets me read": the files policies ALSO let me read files attached to messages in rooms I can
 * access (so a room can download them), and public rooms are open to everybody. Without the explicit owner filter
 * this list would show other people's files too. RLS says what I MAY see, the query still says what I WANT.
 */
export const FILES_PAGE = 100;

export function listFiles(client, userId, { from = 0, pageSize = FILES_PAGE } = {}) {
  // select('*, note:notes(id, title)') is an EMBEDDED SELECT: PostgREST follows the foreign key files.note_id -> notes.id
  // and joins the note, so one request returns each file together with its note title.
  // Day 24: one PAGE at a time (range), with the total (count: 'exact'). Before, the page stopped at the newest 100
  // files and the rest could not be reached at all; now the list loads more as it is scrolled (FilesPage).
  return client
    .from('files')
    .select('*, note:notes(id, title)', { count: 'exact' })
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false }) // a stable order: pages never repeat or skip a file with the same time
    .range(from, from + pageSize - 1);
}

/** My notes for the "attach to a note" dropdown */
export function listMyNotes(client, userId) {
  return client.from('notes').select('id, title').eq('owner_id', userId).order('updated_at', { ascending: false }).limit(100);
}

/** DOWNLOAD: storage.download sends the request WITH my token, so the private-bucket policy lets me read it. Returns a Blob. */
export async function downloadFile(client, file) {
  return client.storage.from(BUCKET).download(file.path);
}

/** SIGNED URL: a link with a signature in it that works for a limited time, even for someone who is not signed in. */
export async function createShareLink(client, path, seconds) {
  const { data, error } = await client.storage.from(BUCKET).createSignedUrl(path, seconds);
  if (error) return { data: null, error };
  return { data: { url: data.signedUrl, seconds }, error: null };
}

/** Signed URLs for many files in one request (used for image previews). Returns a map path -> url. */
export async function createPreviewUrls(client, paths, seconds = 600) {
  if (paths.length === 0) return { data: {}, error: null };
  const { data, error } = await client.storage.from(BUCKET).createSignedUrls(paths, seconds);
  if (error) return { data: {}, error };
  const map = {};
  for (const item of data ?? []) if (item.signedUrl && !item.error) map[item.path] = item.signedUrl;
  return { data: map, error: null };
}

/** DELETE: bytes first, then the row. (If the bytes cannot be removed the row stays, so nothing is lost silently.) */
export async function deleteFile(client, file) {
  const { error: storageError } = await client.storage.from(BUCKET).remove(file.thumb_path ? [file.path, file.thumb_path] : [file.path]);
  if (storageError) return { error: storageError };
  const { error } = await client.from('files').delete().eq('id', file.id);
  return { error };
}

/** The URL a PUBLIC bucket would have for this path. For the private bucket it must NOT work: that is the demo. */
export function plainObjectUrl(client, path, bucket = BUCKET) {
  return client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/**
 * Open a URL WITHOUT any Authorization header (like a stranger would) and report what happened.
 * `fetchFn` is injectable for tests.
 */
export async function probeUrl(url, fetchFn = globalThis.fetch) {
  try {
    const response = await fetchFn(url, { method: 'GET', cache: 'no-store' });
    return { status: response.status, ok: response.ok };
  } catch (error) {
    return { status: null, ok: false, error: error.message };
  }
}
