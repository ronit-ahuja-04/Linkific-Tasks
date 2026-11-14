// Access tokens (JWT) and opaque random tokens.
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

export const ISSUER = 'flowlane-auth';
export const AUDIENCE = 'flowlane-web';

// The algorithm is pinned on both sign and verify. If verify accepted whatever the token header
// says, an attacker could send alg "none" (no signature) or switch to a different algorithm.
const ALG = 'HS256';

export function signAccessToken({ secret, user, sid, nowMs, ttlSeconds }) {
  const iat = Math.floor(nowMs / 1000);
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email, name: user.name, sid, iss: ISSUER, aud: AUDIENCE, iat, exp: iat + ttlSeconds },
    secret,
    { algorithm: ALG },
  );
}

// Returns { status: 'valid', claims } | { status: 'expired' } | { status: 'invalid' }.
// The clock is injected so tests can fast-forward time. Signature is checked before expiry,
// so a forged token can never be reported as merely "expired".
export function verifyAccessToken(token, { secret, nowMs }) {
  try {
    const claims = jwt.verify(token, secret, {
      algorithms: [ALG],
      issuer: ISSUER,
      audience: AUDIENCE,
      clockTimestamp: Math.floor(nowMs / 1000),
    });
    if (!claims.sub || !claims.sid) return { status: 'invalid' };
    return { status: 'valid', claims };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) return { status: 'expired' };
    return { status: 'invalid' };
  }
}

// 256 bits of randomness, URL-safe. Used for refresh, reset, verification tokens and OAuth state.
export const randomToken = () => crypto.randomBytes(32).toString('base64url');

// Only the SHA-256 hash of an opaque token is stored, so a leaked database file cannot be used
// to impersonate anybody. (A fast hash is fine here: the tokens are already high-entropy.)
export const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');
