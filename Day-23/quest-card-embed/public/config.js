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

/** Keep ?api= on links between the pages of this site */
export const withApi = (href) => (new URLSearchParams(location.search).has('api') ? `${href}?api=${encodeURIComponent(API)}` : href);
