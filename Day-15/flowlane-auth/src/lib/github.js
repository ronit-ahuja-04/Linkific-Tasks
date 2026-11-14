/**
 * Pure helpers for the "import issues from GitHub" feature: no React, no network.
 */

/** URLs of the issues already on the board (tasks that carry `source.url`) */
export const importedUrls = (tasks) =>
  new Set(
    Object.values(tasks ?? {})
      .map((task) => task?.source?.url)
      .filter(Boolean)
  );

export const isImported = (issue, urls) => urls.has(issue.url);

// A short stable hash (djb2) so ids differ even when two repos sanitise to the same text
function hash36(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i += 1) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

/**
 * Task id for an issue. Deterministic (importing the same issue twice gives the same id) and safe
 * as a Firestore field path segment (no dots, which would mean "nested field").
 */
export const taskIdForIssue = (issue) => `gh-${issue.number}-${hash36(issue.url || String(issue.id))}`;

const MAX_TAGS = 3;

/**
 * GitHub issue -> FlowLane task (same shape as createDraftTask in lib/board.js, minus the draft
 * flags, plus `source`). Labels become tags (the task shape has tags), text only; the tag colour
 * type is the neutral one so we never depend on GitHub's label colours.
 */
export function issueToTask(issue, { repo, uid }) {
  const created = new Date(issue.createdAt);
  return {
    id: taskIdForIssue(issue),
    content: issue.title,
    description: issue.body || '',
    date: (Number.isNaN(created.getTime()) ? new Date() : created).toLocaleDateString(),
    priority: 'medium',
    tags: issue.labels.slice(0, MAX_TAGS).map((label) => ({ id: `label-${label.name}`, type: 'dev', text: label.name })),
    comments: 0,
    users: [uid].filter(Boolean),
    source: { type: 'github', repo, number: issue.number, url: issue.url },
  };
}

/** Only http(s) links are rendered as links (a stored `javascript:` URL must never become a href) */
export function safeGithubUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : null;
  } catch {
    return null;
  }
}

/** Valid CSS colour from a GitHub label colour ("d73a4a"), or a neutral fallback */
export const labelColor = (color) => (/^[0-9a-fA-F]{6}$/.test(color ?? '') ? `#${color}` : '#8b949e');
