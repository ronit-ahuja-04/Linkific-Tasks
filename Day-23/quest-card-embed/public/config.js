// Where the Intern Quest API is: ?api=<origin> on the address, or the local app by default.
// e.g. http://localhost:4000/?api=https://intern-quest-smoky.vercel.app to call the live site.
export const API = (() => {
  const fromQuery = new URLSearchParams(location.search).get('api');
  try {
    return new URL(fromQuery ?? 'http://localhost:3000').origin;
  } catch {
    return 'http://localhost:3000';
  }
})();

/** Which character to show: ?handle=<handle>, or `ronit` (the local demo data; on the live site use e.g. ronit-ahuja) */
export const HANDLE = (new URLSearchParams(location.search).get('handle') ?? 'ronit').toLowerCase();

/** Keep ?api= and ?handle= on links between the pages of this site */
export const withApi = (href) => {
  const keep = new URLSearchParams([...new URLSearchParams(location.search)].filter(([key]) => key === 'api' || key === 'handle'));
  return keep.size > 0 ? `${href}?${keep}` : href;
};
