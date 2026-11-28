import { AppError, toAppError } from '../errors';
import { supabase } from '../supabase';

/**
 * Course files in Supabase Storage. Paths always start with the course id (`<course>/...`): the storage policies
 * use that folder to decide who may upload, replace, delete or read a file.
 */
export type Bucket = 'course-media' | 'course-sources';

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // matches the bucket's file_size_limit

export const ACCEPTED: Record<'video' | 'captions', { types: string[]; label: string }> = {
  video: { types: ['video/mp4', 'video/webm'], label: 'MP4 or WebM' },
  captions: { types: ['text/vtt'], label: 'WebVTT (.vtt)' },
};

/** Client-side checks, so a wrong file fails in a second instead of after a long upload. The bucket re-checks. */
export function checkFile(file: File, accept: keyof typeof ACCEPTED): string | null {
  const rule = ACCEPTED[accept];
  if (!rule.types.includes(file.type)) return `That file isn't supported. Use ${rule.label}.`;
  if (file.size > MAX_UPLOAD_BYTES) {
    return `That file is ${(file.size / 1024 / 1024).toFixed(0)} MB. The limit is 50 MB: try a shorter or more compressed video.`;
  }
  if (file.size === 0) return 'That file is empty.';
  return null;
}

function extensionFor(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  return file.type.split('/')[1] ?? 'bin';
}

/** A fresh, unguessable object path for a lesson's file (never reuses a name, so caches can't show a stale video). */
export function lessonFilePath(courseId: string, lessonId: string, file: File) {
  return `${courseId}/lessons/${lessonId}/${crypto.randomUUID()}.${extensionFor(file)}`;
}

/**
 * Upload with progress. supabase-js's upload() has no progress events, so this posts to the same Storage REST
 * endpoint with XMLHttpRequest, using the signed-in user's access token (RLS applies exactly as with the SDK).
 */
export async function uploadWithProgress(
  bucket: Bucket,
  path: string,
  file: File,
  onProgress: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<string> {
  const client = supabase();
  const { data } = await client.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new AppError('auth', 'Please sign in again.');
  const base = import.meta.env.VITE_SUPABASE_URL as string;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  const encoded = path.split('/').map(encodeURIComponent).join('/');

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${base}/storage/v1/object/${bucket}/${encoded}`);
    xhr.setRequestHeader('authorization', `Bearer ${token}`);
    xhr.setRequestHeader('apikey', anonKey);
    xhr.setRequestHeader('content-type', file.type);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.setRequestHeader('cache-control', 'max-age=3600');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(1);
        resolve(path);
        return;
      }
      let message = '';
      try {
        message = (JSON.parse(xhr.responseText) as { message?: string }).message ?? '';
      } catch {
        // not JSON: fall through to the status-based message
      }
      if (xhr.status === 413 || /size/i.test(message)) {
        reject(new AppError('validation', 'That file is over the 50 MB limit.'));
      } else if (xhr.status === 403 || /row-level security|unauthori/i.test(message)) {
        reject(new AppError('forbidden', "You can't upload files to this course."));
      } else if (/mime|type/i.test(message)) {
        reject(new AppError('validation', "That file type isn't allowed here."));
      } else {
        reject(toAppError({ message, status: xhr.status }));
      }
    };
    xhr.onerror = () => reject(toAppError(new TypeError('fetch failed')));
    xhr.onabort = () => reject(new AppError('validation', 'Upload cancelled.', 'aborted'));
    signal?.addEventListener('abort', () => xhr.abort(), { once: true });
    xhr.send(file);
  });
}

/** A short-lived link to a private file (the media bucket is private, so drafts never leak). */
export async function signedUrl(bucket: Bucket, path: string, seconds = 3600): Promise<string> {
  const { data, error } = await supabase().storage.from(bucket).createSignedUrl(path, seconds);
  if (error) throw toAppError(error);
  return data.signedUrl;
}

/** Best-effort cleanup of a replaced file; a leftover file is harmless, so failures are ignored. */
export async function removeFile(bucket: Bucket, path: string): Promise<void> {
  await supabase().storage.from(bucket).remove([path]);
}
