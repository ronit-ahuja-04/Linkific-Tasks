/** Errors that Supabase Auth puts in the URL: ?error=...&error_description=... (or the same after a # for older flows) */
export function urlAuthError(search = '', hash = '') {
  const read = (text) => {
    const p = new URLSearchParams(text.replace(/^[?#]/, ''));
    return p.get('error_description') || (p.get('error') ? p.get('error') : '');
  };
  return (read(search) || read(hash)).replace(/\+/g, ' ');
}
