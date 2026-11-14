import crypto from 'node:crypto';
import { Router } from 'express';
import { AppError } from '../errors.js';
import { STATE_COOKIE, createSession, revokeAllForUser, setRefreshCookie } from '../sessions.js';
import { randomToken } from '../tokens.js';
import { normalizeEmail, str } from '../validate.js';

const stateCookieOptions = (config) => ({
  httpOnly: true,
  // Lax (not Strict): the callback is a top-level navigation coming back from github.com,
  // and Strict cookies are not sent on that. Lax still blocks cross-site POSTs/subrequests.
  sameSite: 'lax',
  secure: config.isProd,
  path: '/api/auth',
});

const safeEqual = (a, b) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

export function createOAuthRouter(ctx) {
  const { config, store, now, githubProvider } = ctx;
  const router = Router();

  router.get('/github', (req, res) => {
    if (!githubProvider.enabled) throw new AppError(501, 'oauth_not_configured', 'GitHub sign-in is not configured.');
    // `state` ties the callback to THIS browser: an attacker cannot make you finish a login
    // flow they started (login CSRF), because your cookie would not match their state.
    const state = randomToken();
    res.cookie(STATE_COOKIE, state, { ...stateCookieOptions(config), maxAge: 10 * 60 * 1000 });
    res.redirect(302, githubProvider.authorizeUrl(state));
  });

  router.get('/github/callback', async (req, res) => {
    const fail = (why) => {
      if (!config.silent) console.warn(`[oauth] callback failed: ${why}`);
      res.clearCookie(STATE_COOKIE, stateCookieOptions(config));
      res.redirect(302, `${config.clientUrl}/login?error=oauth_failed`);
    };
    try {
      const { code, state } = req.query;
      const cookieState = req.cookies?.[STATE_COOKIE];
      if (typeof code !== 'string' || typeof state !== 'string' || !state || !cookieState || !safeEqual(state, cookieState)) {
        return fail('state mismatch or missing parameters');
      }
      if (!githubProvider.enabled) return fail('provider disabled');

      const profile = await githubProvider.exchange(code);
      const email = normalizeEmail(profile.email);
      if (!email || !profile.emailVerified) return fail('no verified email');

      let user = store.users.find((u) => u.githubId === profile.id);
      if (!user) {
        const existing = store.users.find((u) => u.email === email);
        if (existing) {
          // Link to the existing account (GitHub vouches for the email). If that account never
          // verified its email, someone else may have registered it with a password they know
          // ("pre-hijacking"): drop that password and sessions as part of the link.
          const patch = { githubId: profile.id, emailVerified: true, avatarUrl: existing.avatarUrl ?? profile.avatarUrl };
          if (!existing.emailVerified) {
            patch.passwordHash = null;
            revokeAllForUser(ctx, existing.id);
          }
          user = store.users.update(existing.id, patch);
        } else {
          user = store.users.insert({
            name: str(profile.name).trim() || profile.login || 'GitHub user',
            email,
            passwordHash: null,
            role: 'member',
            emailVerified: true,
            provider: 'github',
            githubId: profile.id,
            avatarUrl: profile.avatarUrl || null,
            createdAt: new Date(now()).toISOString(),
          });
        }
      }
      const { token } = createSession(ctx, user, req, false);
      setRefreshCookie(ctx, res, token, false);
      res.clearCookie(STATE_COOKIE, stateCookieOptions(config));
      // Only a redirect: no token in the URL. The client then calls /auth/refresh with the cookie.
      res.redirect(302, `${config.clientUrl}/oauth/callback`);
    } catch (err) {
      fail(err.message);
    }
  });

  return router;
}
