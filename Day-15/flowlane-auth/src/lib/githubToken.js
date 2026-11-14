/**
 * The GitHub access token, kept in MEMORY only.
 *
 * Firebase gives us a GitHub OAuth access token once, right after the GitHub popup. It is not
 * saved by Firebase, and we deliberately do not save it either (not in localStorage, not in
 * sessionStorage): any script on the page could read those. Memory means a reload forgets it, and
 * the "Connect GitHub" button simply runs the popup again.
 *
 * It is a tiny external store so React can subscribe with useSyncExternalStore (see
 * context/GitHubContext.jsx) and non-React code (the axios client) can read it.
 */
let token = null;
const listeners = new Set();

export const getGithubToken = () => token;

export function setGithubToken(next) {
  const value = next || null;
  if (value === token) return;
  token = value;
  listeners.forEach((listener) => listener());
}

export const clearGithubToken = () => setGithubToken(null);

export function subscribeGithubToken(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
