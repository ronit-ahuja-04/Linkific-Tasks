import { deleteFile } from './storage';

/**
 * A task's images live in two places: Cloud Storage holds the file, and the task document in Firestore
 * holds a small entry for each one: { id, name, url, path, size, contentType, by, createdAt }.
 */

/** Only http(s) links are ever used as an image source or a link target (anyone on a project can write the entry) */
export const safeImageUrl = (url) => (typeof url === 'string' && /^https?:\/\//i.test(url) ? url : null);

/** The entry saved on the task after an upload */
export const makeAttachment = (uploaded, uid) => ({
  id: uploaded.path.split('/').pop(),
  name: uploaded.name,
  url: uploaded.url,
  path: uploaded.path,
  size: uploaded.size,
  contentType: uploaded.contentType,
  by: uid,
  createdAt: Date.now(),
});

/**
 * Delete the files of some attachments. Best effort: one file that cannot be deleted must not stop the
 * others or fail the task or project delete that called this (an orphaned file is harmless, a stuck delete is not).
 */
export async function deleteAttachmentFiles(attachments) {
  const paths = (attachments ?? []).map((a) => a?.path).filter(Boolean);
  await Promise.allSettled(paths.map((path) => deleteFile(path)));
}
