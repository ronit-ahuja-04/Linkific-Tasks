// Authentication = "who are you?" (requireAuth). Authorization = "may you?" (requireRole).
import { AppError, unauthorized } from '../errors.js';
import { verifyAccessToken } from '../tokens.js';

export function createAuthMiddleware(ctx) {
  function requireAuth(req, res, next) {
    const header = req.get('authorization') || '';
    const match = /^Bearer (\S+)$/.exec(header);
    if (!match) return next(unauthorized('Missing access token.'));

    const result = verifyAccessToken(match[1], { secret: ctx.config.jwtSecret, nowMs: ctx.now() });
    // "expired" is a distinct code: the client reacts by refreshing and retrying once.
    if (result.status === 'expired') return next(new AppError(401, 'token_expired', 'Your access token expired.'));
    if (result.status !== 'valid') return next(unauthorized('Invalid access token.'));

    // A valid signature is not enough: the session must still exist and not be revoked
    // (logout, password reset, "sign out other device", refresh-token theft detection).
    const { claims } = result;
    const session = ctx.store.sessions.byId(claims.sid);
    if (!session || session.revokedAt || session.userId !== claims.sub) {
      return next(unauthorized('This session is no longer active.'));
    }
    const user = ctx.store.users.byId(claims.sub);
    if (!user) return next(unauthorized('Unknown user.'));

    // Role comes from the database, not the token, so demotions apply immediately.
    req.auth = { userId: user.id, role: user.role, sid: session.id };
    next();
  }

  const requireRole = (role) => (req, res, next) =>
    req.auth?.role === role ? next() : next(new AppError(403, 'forbidden', 'You do not have access to this resource.'));

  return { requireAuth, requireRole };
}
