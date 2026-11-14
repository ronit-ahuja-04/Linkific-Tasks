/**
 * JWT helpers for the BROWSER. A JWT is three base64url parts: header.payload.signature.
 * The client only READS the payload (to know when the token expires). It never verifies the
 * signature: it cannot (the secret lives on the server) and it does not need to, because the
 * server verifies every request. Never trust decoded claims for security decisions in the UI;
 * they are only used for display and timing.
 */

/** base64url -> text. base64url swaps +/ for -_ and drops the "=" padding, so undo both. */
function base64UrlToText(part) {
  const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  // atob gives one char per byte; decode as UTF-8 so names like "José" or "李雷" survive
  return new TextDecoder().decode(bytes);
}

/** Returns the claims object, or null for anything that is not a decodable JWT */
export function decodeJwt(token) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) return null;
  try {
    const claims = JSON.parse(base64UrlToText(parts[1]));
    return claims !== null && typeof claims === 'object' && !Array.isArray(claims) ? claims : null;
  } catch {
    return null;
  }
}

/** Whole seconds until `exp` (never negative). 0 when there is no usable exp claim. */
export function secondsLeft(claims, nowMs) {
  if (!claims || typeof claims.exp !== 'number') return 0;
  return Math.max(0, Math.floor(claims.exp - nowMs / 1000));
}
