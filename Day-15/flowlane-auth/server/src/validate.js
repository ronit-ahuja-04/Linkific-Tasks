// Small input validators shared by the routes. They return a message (string) or null.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const str = (v) => (typeof v === 'string' ? v : '');
export const normalizeEmail = (v) => str(v).trim().toLowerCase();

export function emailError(email) {
  if (!email) return 'Email is required.';
  if (email.length > 254 || !EMAIL_RE.test(email)) return 'Enter a valid email address.';
  return null;
}

export function nameError(name) {
  const n = str(name).trim();
  if (n.length < 2) return 'Name must be at least 2 characters.';
  if (n.length > 60) return 'Name must be at most 60 characters.';
  return null;
}

export const body = (req) => (req.body && typeof req.body === 'object' ? req.body : {});
