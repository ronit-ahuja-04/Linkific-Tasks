// Helpers for the refresh-token "session family" and the fl_refresh cookie.
//
// One login = one session (a "family"). Each refresh replaces the opaque token inside the
// session with a new one (rotation) and remembers the old hash. If someone later presents an
// old hash, a stolen copy is being replayed, so the whole family is revoked.
import { hashToken, randomToken, signAccessToken } from './tokens.js';

export const REFRESH_COOKIE = 'fl_refresh';
export const STATE_COOKIE = 'fl_oauth_state';
const DAY = 24 * 60 * 60 * 1000;
const MAX_PREV_HASHES = 50;

export function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    emailVerified: Boolean(u.emailVerified),
    provider: u.provider,
    avatarUrl: u.avatarUrl ?? null,
    createdAt: u.createdAt,
  };
}

const sessionTtlMs = (config, remember) =>
  remember ? config.refreshTtlDays * DAY : config.sessionRefreshTtlHours * 60 * 60 * 1000;

// HttpOnly: JavaScript cannot read it (XSS cannot steal it). SameSite=Strict: the browser never
// sends it on cross-site requests (CSRF defence). Path=/api/auth: it is only sent to the auth
// endpoints, not to every API call. Secure: HTTPS only (production). No maxAge = session cookie
// that disappears when the browser closes; "remember me" gets a 30 day maxAge.
export function refreshCookieOptions(config, remember) {
  const opts = { httpOnly: true, sameSite: 'strict', secure: config.isProd, path: '/api/auth' };
  if (remember) opts.maxAge = config.refreshTtlDays * DAY;
  return opts;
}

export function setRefreshCookie(ctx, res, token, remember) {
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions(ctx.config, remember));
}

export function clearRefreshCookie(ctx, res) {
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions(ctx.config, false));
}

export function createSession(ctx, user, req, remember) {
  const nowMs = ctx.now();
  const token = randomToken();
  const session = ctx.store.sessions.insert({
    userId: user.id,
    tokenHash: hashToken(token),
    prevHashes: [],
    createdAt: new Date(nowMs).toISOString(),
    lastUsedAt: new Date(nowMs).toISOString(),
    expiresAt: nowMs + sessionTtlMs(ctx.config, remember),
    userAgent: String(req.get('user-agent') || '').slice(0, 200),
    remember: Boolean(remember),
    revokedAt: null,
  });
  return { session, token };
}

// Creates a session, sets the cookie and returns the Auth result body.
export function startSession(ctx, req, res, user, remember) {
  const { session, token } = createSession(ctx, user, req, remember);
  setRefreshCookie(ctx, res, token, remember);
  return buildAuthResult(ctx, user, session);
}

export function buildAuthResult(ctx, user, session) {
  return {
    user: publicUser(user),
    accessToken: signAccessToken({
      secret: ctx.config.jwtSecret,
      user,
      sid: session.id,
      nowMs: ctx.now(),
      ttlSeconds: ctx.config.accessTtlSeconds,
    }),
    expiresIn: ctx.config.accessTtlSeconds,
  };
}

export const isActive = (ctx, s) => !s.revokedAt && s.expiresAt > ctx.now();

export function revokeSession(ctx, id) {
  ctx.store.sessions.update(id, { revokedAt: new Date(ctx.now()).toISOString() });
}

export function revokeAllForUser(ctx, userId) {
  const at = new Date(ctx.now()).toISOString();
  for (const s of ctx.store.sessions.filter((x) => x.userId === userId && !x.revokedAt)) {
    ctx.store.sessions.update(s.id, { revokedAt: at });
  }
}

// Rotation. Returns { user, session, token } or null (caller answers refresh_invalid).
export function rotateRefreshToken(ctx, presented, req) {
  const hash = hashToken(presented);
  const current = ctx.store.sessions.find((s) => s.tokenHash === hash);
  if (current) {
    if (!isActive(ctx, current)) return null;
    const user = ctx.store.users.byId(current.userId);
    if (!user) return null;
    const token = randomToken();
    const nowMs = ctx.now();
    const session = ctx.store.sessions.update(current.id, {
      tokenHash: hashToken(token),
      prevHashes: [...current.prevHashes, hash].slice(-MAX_PREV_HASHES),
      lastUsedAt: new Date(nowMs).toISOString(),
      expiresAt: nowMs + sessionTtlMs(ctx.config, current.remember),
      userAgent: String(req.get('user-agent') || current.userAgent).slice(0, 200),
    });
    return { user, session, token };
  }
  // An already-rotated token: either the attacker or the real user is replaying it.
  // We cannot tell which, so kill the entire family; the real user simply logs in again.
  const reused = ctx.store.sessions.find((s) => s.prevHashes.includes(hash));
  if (reused && !reused.revokedAt) revokeSession(ctx, reused.id);
  return null;
}

// Used by logout: find the session a presented token belongs to (current or old token).
export function findSessionByToken(ctx, presented) {
  const hash = hashToken(presented);
  return ctx.store.sessions.find((s) => s.tokenHash === hash || s.prevHashes.includes(hash));
}

// Stub mailer: instead of sending email we store it in the "outbox" (readable via /dev/outbox).
export function sendMail(ctx, { to, subject, text, link }) {
  ctx.store.outbox.insert({ to, subject, text, link, createdAt: new Date(ctx.now()).toISOString() });
  const extra = ctx.store.outbox.all().length - 200;
  if (extra > 0) {
    const old = new Set(ctx.store.outbox.all().slice(0, extra).map((m) => m.id));
    ctx.store.outbox.removeWhere((m) => old.has(m.id));
  }
}

// Creates a single-use token record (reset or verify) and returns the raw token.
export function issueOneTimeToken(ctx, collection, userId, ttlMs) {
  const token = randomToken();
  ctx.store[collection].insert({
    userId,
    tokenHash: hashToken(token),
    expiresAt: ctx.now() + ttlMs,
    usedAt: null,
  });
  return token;
}

export function consumeOneTimeToken(ctx, collection, raw) {
  if (typeof raw !== 'string' || !raw) return null;
  const hash = hashToken(raw);
  const rec = ctx.store[collection].find((t) => t.tokenHash === hash);
  if (!rec || rec.usedAt || rec.expiresAt <= ctx.now()) return null;
  ctx.store[collection].update(rec.id, { usedAt: new Date(ctx.now()).toISOString() });
  return rec;
}

export function sendVerificationEmail(ctx, user) {
  const token = issueOneTimeToken(ctx, 'verifyTokens', user.id, 24 * 60 * 60 * 1000);
  const link = `${ctx.config.clientUrl}/verify-email?token=${token}`;
  sendMail(ctx, {
    to: user.email,
    subject: 'Verify your FlowLane email',
    text: `Hi ${user.name}, confirm your email address: ${link}`,
    link,
  });
}
