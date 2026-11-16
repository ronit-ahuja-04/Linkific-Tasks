import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Cloud Storage helpers (Day 16). Everything here is plain functions around three SDK calls:
 *   uploadBytesResumable  send the file and report progress
 *   getDownloadURL        a long-lived https link to display the file
 *   deleteObject          remove the file
 * The same limits are enforced twice: here (to give a friendly message at once) and in storage.rules
 * (the real protection, because anyone can bypass the browser code).
 */

export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const MAX_ATTACHMENTS_PER_TASK = 6;

/** Returns null when the file is fine, otherwise a code the UI turns into a translated message */
export function validateImage(file, maxBytes) {
  if (!file) return 'none';
  if (!IMAGE_TYPES.includes(file.type)) return 'type';
  if (file.size > maxBytes) return 'size';
  return null;
}

/** "My photo (1).PNG" -> "my-photo-1.png": safe in a URL and in a path, and the extension is kept */
export function safeFileName(name) {
  const clean = String(name ?? 'file').toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/-+\./g, '.').replace(/^[-.]+|-+$/g, '').replace(/\.{2,}/g, '.');
  return (clean || 'file').slice(-60);
}

const uniquePrefix = () =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}${Math.random().toString(16).slice(2)}`).slice(0, 8);

export const avatarPath = (uid, fileName) => `avatars/${uid}/${uniquePrefix()}-${safeFileName(fileName)}`;
export const attachmentPath = (projectId, taskId, fileName) =>
  `projects/${projectId}/tasks/${taskId}/${uniquePrefix()}-${safeFileName(fileName)}`;

/** "1.4 MB", "820 KB" */
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Upload a file to `path`. `onProgress` receives a number from 0 to 100.
 * Resolves to { url, path, name, size, contentType }. `cancel()` on the returned promise's `task` stops it.
 */
export function uploadFile(path, file, onProgress) {
  if (!storage) return Promise.reject(Object.assign(new Error('Storage is not configured'), { code: 'storage/not-configured' }));
  const task = uploadBytesResumable(ref(storage, path), file, { contentType: file.type });
  const done = new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snap) => onProgress?.(snap.totalBytes ? Math.round((snap.bytesTransferred / snap.totalBytes) * 100) : 0),
      reject,
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve({ url, path, name: file.name, size: file.size, contentType: file.type });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
  done.task = task;
  return done;
}

/** Delete a file. A file that is already gone counts as deleted. */
export async function deleteFile(path) {
  if (!storage || !path) return;
  try {
    await deleteObject(ref(storage, path));
  } catch (err) {
    if (err?.code !== 'storage/object-not-found') throw err;
  }
}

/** A short message key for a failed upload or delete, so the UI can say something useful */
export function storageErrorKey(err) {
  switch (err?.code) {
    case 'storage/unauthorized':
    case 'storage/unauthenticated':
      return 'storage.error.denied';
    case 'storage/quota-exceeded':
      return 'storage.error.quota';
    case 'storage/retry-limit-exceeded':
    case 'storage/network-request-failed':
      return 'storage.error.network';
    case 'storage/canceled':
      return 'storage.error.canceled';
    case 'storage/not-configured':
      return 'storage.error.notConfigured';
    case 'storage/bucket-not-found':
    case 'storage/project-not-found':
      return 'storage.error.noBucket';
    default:
      return 'storage.error.generic';
  }
}

/** The message key for a code from validateImage ('none' | 'type' | 'size') */
export const validationErrorKey = (code) =>
  ({ none: 'storage.error.none', type: 'storage.error.type', size: 'storage.error.size' })[code] ?? 'storage.error.generic';
