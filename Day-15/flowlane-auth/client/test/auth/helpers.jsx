import { ApiError } from '../../src/api/http';

const b64url = (text) => btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** Unsigned fake access token whose exp/iat are relative to `nowMs` */
export function makeToken({ nowMs = Date.now(), lifeSeconds = 900, name = 'Ada', role = 'member' } = {}) {
  const iat = Math.floor(nowMs / 1000);
  const claims = { sub: 'u1', role, email: 'ada@example.com', name, sid: 's1', iat, exp: iat + lifeSeconds };
  return `${b64url('{"alg":"HS256"}')}.${b64url(JSON.stringify(claims))}.sig`;
}

export const makeUser = (overrides = {}) => ({ id: 'u1', name: 'Ada', email: 'ada@example.com', role: 'member', emailVerified: true, provider: 'password', avatarUrl: null, createdAt: '2026-01-01T00:00:00.000Z', ...overrides });

export const makeResult = ({ user = makeUser(), nowMs, lifeSeconds = 900, token } = {}) => ({
  user,
  accessToken: token ?? makeToken({ nowMs, lifeSeconds, role: user.role }),
  expiresIn: lifeSeconds,
});

export const apiError = (status, code, message = code) => new ApiError({ status, code, message });
