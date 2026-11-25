/**
 * IMAGE RESIZING in the browser, at upload time (Day 24).
 *
 * A phone photo is 2–5 MB and 3000+ px wide; Huddle shows avatars at 24–96 px and file previews in a 56 px box.
 * Before Day 24 the original was stored and downloaded every time (the Files page: 17 MB). Now the browser draws a
 * small WebP copy on a canvas before uploading: the server never has to resize anything, and every later page view
 * downloads a few kilobytes instead.
 *
 * This module is imported dynamically (only when someone picks a file), so it is not in any page's first download.
 * Without the needed browser features (createImageBitmap, canvas WebP), callers fall back to the original file.
 */

/**
 * Draw `file` into at most maxSize x maxSize (or a centred square crop of that size), as WebP.
 * Returns { blob, width, height, ext }. Some browsers can not ENCODE WebP and silently give PNG instead: the blob's
 * own type decides the extension, so the stored file is never mislabelled.
 */
export async function resizeImage(file, { maxSize, square = false, quality = 0.82 }) {
  const bitmap = await createImageBitmap(file);
  let sx = 0;
  let sy = 0;
  let sw = bitmap.width;
  let sh = bitmap.height;
  if (square) {
    const side = Math.min(sw, sh);
    sx = (sw - side) / 2;
    sy = (sh - side) / 2;
    sw = side;
    sh = side;
  }
  const scale = Math.min(1, maxSize / sw, maxSize / sh); // never enlarge a small picture
  const width = Math.max(1, Math.round(sw * scale));
  const height = Math.max(1, Math.round(sh * scale));
  const canvas = typeof OffscreenCanvas === 'undefined' ? Object.assign(document.createElement('canvas'), { width, height }) : new OffscreenCanvas(width, height);
  const context = canvas.getContext('2d');
  context.imageSmoothingQuality = 'high';
  context.drawImage(bitmap, sx, sy, sw, sh, 0, 0, width, height);
  bitmap.close?.();
  const blob = canvas.convertToBlob
    ? await canvas.convertToBlob({ type: 'image/webp', quality })
    : await new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode the image'))), 'image/webp', quality));
  return { blob, width, height, ext: blob.type === 'image/webp' ? 'webp' : 'png' };
}

/** The two avatar sizes: 64 px covers the 24 and 32 px avatars on 2x screens, 256 px the 96 px one on the profile */
export const AVATAR_SIZES = [64, 256];

/** Square avatar variants, largest last: [{ size: 64, blob, ext }, { size: 256, ... }] */
export async function avatarVariants(file) {
  const variants = [];
  for (const size of AVATAR_SIZES) variants.push({ size, ...(await resizeImage(file, { maxSize: size, square: true })) });
  return variants;
}

/** A file preview's thumbnail: the box is 56 px, 112 px on a 2x screen; 160 px leaves room */
export const THUMB_SIZE = 160;
export const makeThumbnail = (file) => resizeImage(file, { maxSize: THUMB_SIZE });
