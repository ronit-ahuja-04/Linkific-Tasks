/**
 * Pure announcement helpers. Posts come from two places that are never mixed up:
 * the read-only seed list in data/announcements.js, and a "changes" object kept in localStorage
 * ({ added, edited, removed }). applyChanges() merges them by id, so an edit never overwrites the seed.
 */

export const CATEGORIES = ['General', 'Schedule', 'Food', 'Swag', 'Urgent'];

/** Badge tone per category, used by the cards. */
export const CATEGORY_TONES = {
  General: 'neutral',
  Schedule: 'accent',
  Food: 'good',
  Swag: 'brand',
  Urgent: 'bad',
};

export const FORM_ID = 'announcement-form';

export const TITLE_MIN = 3;
export const TITLE_MAX = 80;
export const BODY_MIN = 10;
export const BODY_MAX = 600;

export const EMPTY_CHANGES = { added: [], edited: {}, removed: [] };

const EDITABLE_FIELDS = ['title', 'body', 'category', 'pinned'];

/**
 * Returns an object of field → message. An empty object means the draft is valid.
 */
export function validateAnnouncement(draft = {}) {
  const errors = {};
  const title = typeof draft.title === 'string' ? draft.title.trim() : '';
  const body = typeof draft.body === 'string' ? draft.body.trim() : '';

  if (title.length < TITLE_MIN) {
    errors.title = `Title needs at least ${TITLE_MIN} characters.`;
  } else if (title.length > TITLE_MAX) {
    errors.title = `Keep the title to ${TITLE_MAX} characters or fewer.`;
  }

  if (body.length < BODY_MIN) {
    errors.body = `Message needs at least ${BODY_MIN} characters.`;
  } else if (body.length > BODY_MAX) {
    errors.body = `Keep the message to ${BODY_MAX} characters or fewer.`;
  }

  if (!CATEGORIES.includes(draft.category)) {
    errors.category = 'Pick a category.';
  }

  return errors;
}

let idCounter = 0;

export function createAnnouncement(draft, now = Date.now()) {
  idCounter += 1;
  return {
    id: `ann-${now.toString(36)}-${idCounter}`,
    title: draft.title.trim(),
    body: draft.body.trim(),
    category: draft.category,
    pinned: Boolean(draft.pinned),
    createdAt: now,
  };
}

function pickEditable(fields) {
  const picked = {};
  for (const key of EDITABLE_FIELDS) {
    if (key in fields) {
      picked[key] = typeof fields[key] === 'string' ? fields[key].trim() : fields[key];
    }
  }
  return picked;
}

/**
 * Seed posts minus removed ones, with edits merged in by id, followed by posts added by organizers.
 */
export function applyChanges(seed, changes = EMPTY_CHANGES) {
  const { added = [], edited = {}, removed = [] } = changes;
  const kept = seed
    .filter((post) => !removed.includes(post.id))
    .map((post) => (edited[post.id] ? { ...post, ...edited[post.id] } : post));
  return [...kept, ...added];
}

export function addAnnouncement(changes, post) {
  return { ...changes, added: [...changes.added, post] };
}

export function editAnnouncement(changes, id, fields) {
  const picked = pickEditable(fields);

  if (changes.added.some((post) => post.id === id)) {
    return {
      ...changes,
      added: changes.added.map((post) => (post.id === id ? { ...post, ...picked } : post)),
    };
  }

  return { ...changes, edited: { ...changes.edited, [id]: { ...changes.edited[id], ...picked } } };
}

export function removeAnnouncement(changes, id) {
  const { [id]: _dropped, ...edited } = changes.edited;
  const isAdded = changes.added.some((post) => post.id === id);

  return {
    added: changes.added.filter((post) => post.id !== id),
    edited,
    removed: isAdded || changes.removed.includes(id) ? changes.removed : [...changes.removed, id],
  };
}

/** Pinned posts first, then newest first. Returns a new array. */
export function sortAnnouncements(list) {
  return [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt - a.createdAt);
}

export function filterAnnouncements(list, { category = 'all', query = '' } = {}) {
  const needle = query.trim().toLowerCase();

  return list.filter((post) => {
    if (category !== 'all' && post.category !== category) return false;
    if (!needle) return true;
    return post.title.toLowerCase().includes(needle) || post.body.toLowerCase().includes(needle);
  });
}

/** Posts newer than the last time the announcements page was opened. `seenAt` is null before the first visit. */
export function countUnread(list, seenAt) {
  if (seenAt == null) return list.length;
  return list.filter((post) => post.createdAt > seenAt).length;
}

/** The newest pinned post, or the newest post when nothing is pinned. */
export function getFeatured(list) {
  return sortAnnouncements(list)[0] ?? null;
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

export function formatPostDate(createdAt, now = Date.now()) {
  const age = now - createdAt;

  if (age < MINUTE) return 'Just now';
  if (age < HOUR) return `${Math.floor(age / MINUTE)} min ago`;
  if (age < 24 * HOUR) return `${Math.floor(age / HOUR)} h ago`;
  if (age < 48 * HOUR) return 'Yesterday';

  const date = new Date(createdAt);
  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}
