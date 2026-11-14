import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AppError, notFound, validationFailed } from '../errors.js';
import { csrfGuard } from '../middleware/csrf.js';
import { hashPassword, passwordError, verifyPassword } from '../passwords.js';
import {
  REFRESH_COOKIE, buildAuthResult, clearRefreshCookie, consumeOneTimeToken, findSessionByToken, isActive,
  issueOneTimeToken, publicUser, revokeAllForUser, revokeSession, rotateRefreshToken, sendMail,
  sendVerificationEmail, setRefreshCookie, startSession,
} from '../sessions.js';
import { body, emailError, nameError, normalizeEmail, str } from '../validate.js';

const MINUTE = 60 * 1000;

export function createAuthRouter(ctx) {
  const { config, store, now, auth } = ctx;
  const router = Router();
  const csrf = csrfGuard(config);

  const limiterHandler = (req, res, next) =>
    next(new AppError(429, 'rate_limited', 'Too many attempts. Please wait a while and try again.'));
  // Login: only FAILED attempts count, so a real user logging in repeatedly is not locked out,
  // but password guessing is capped per IP.
  const loginLimiter = rateLimit({
    windowMs: config.rateLimit.loginWindowMs,
    limit: config.rateLimit.loginMax,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: limiterHandler,
  });
  const forgotLimiter = rateLimit({
    windowMs: config.rateLimit.forgotWindowMs,
    limit: config.rateLimit.forgotMax,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: limiterHandler,
  });

  router.post('/register', async (req, res) => {
    const b = body(req);
    const email = normalizeEmail(b.email);
    const fields = {};
    const nErr = nameError(b.name);
    if (nErr) fields.name = nErr;
    const eErr = emailError(email);
    if (eErr) fields.email = eErr;
    const pErr = passwordError(b.password);
    if (pErr) fields.password = pErr;
    if (Object.keys(fields).length) throw validationFailed(fields);

    if (store.users.find((u) => u.email === email)) {
      throw new AppError(409, 'email_taken', 'An account with this email already exists.', { email: 'This email is already registered.' });
    }
    const user = store.users.insert({
      name: str(b.name).trim(),
      email,
      passwordHash: await hashPassword(b.password, config.bcryptCost),
      role: 'member',
      emailVerified: false,
      provider: 'password',
      githubId: null,
      avatarUrl: null,
      createdAt: new Date(now()).toISOString(),
    });
    sendVerificationEmail(ctx, user);
    res.status(201).json(startSession(ctx, req, res, user, false));
  });

  router.post('/login', loginLimiter, async (req, res) => {
    const b = body(req);
    const email = normalizeEmail(b.email);
    const fields = {};
    if (!email) fields.email = 'Email is required.';
    if (typeof b.password !== 'string' || !b.password) fields.password = 'Password is required.';
    if (Object.keys(fields).length) throw validationFailed(fields);

    const user = store.users.find((u) => u.email === email);
    const ok = await verifyPassword(user, b.password, config.bcryptCost);
    // The SAME error and message for "no such email" and "wrong password": otherwise the login
    // form becomes a tool to discover which emails have accounts.
    if (!ok) throw new AppError(401, 'invalid_credentials', 'Incorrect email or password.');
    res.json(startSession(ctx, req, res, user, b.remember === true));
  });

  router.post('/refresh', csrf, (req, res) => {
    const presented = req.cookies?.[REFRESH_COOKIE];
    const rotated = presented ? rotateRefreshToken(ctx, presented, req) : null;
    if (!rotated) {
      clearRefreshCookie(ctx, res);
      throw new AppError(401, 'refresh_invalid', 'Your session is no longer valid. Please sign in again.');
    }
    setRefreshCookie(ctx, res, rotated.token, rotated.session.remember);
    res.json(buildAuthResult(ctx, rotated.user, rotated.session));
  });

  router.post('/logout', csrf, (req, res) => {
    const presented = req.cookies?.[REFRESH_COOKIE];
    const session = presented ? findSessionByToken(ctx, presented) : null;
    if (session && !session.revokedAt) revokeSession(ctx, session.id);
    clearRefreshCookie(ctx, res);
    res.status(204).end();
  });

  // Always the same answer, whether or not the email exists (no account enumeration).
  router.post('/forgot-password', forgotLimiter, (req, res) => {
    const email = normalizeEmail(body(req).email);
    const eErr = emailError(email);
    if (eErr) throw validationFailed({ email: eErr });
    const user = store.users.find((u) => u.email === email);
    if (user?.passwordHash) {
      const token = issueOneTimeToken(ctx, 'resetTokens', user.id, 30 * MINUTE);
      const link = `${config.clientUrl}/reset-password?token=${token}`;
      sendMail(ctx, {
        to: user.email,
        subject: 'Reset your FlowLane password',
        text: `Use this link within 30 minutes to choose a new password: ${link}`,
        link,
      });
    }
    res.status(202).json({ message: 'If an account exists for that email, a reset link is on its way.' });
  });

  router.post('/reset-password', async (req, res) => {
    const { token, password } = body(req);
    const pErr = passwordError(password);
    if (pErr) throw validationFailed({ password: pErr });
    const record = consumeOneTimeToken(ctx, 'resetTokens', token);
    if (!record) throw validationFailed({ token: 'This reset link is invalid or has expired.' });
    const user = store.users.byId(record.userId);
    if (!user) throw validationFailed({ token: 'This reset link is invalid or has expired.' });
    store.users.update(user.id, { passwordHash: await hashPassword(password, config.bcryptCost) });
    // If the password was changed because it leaked, every existing login must die.
    revokeAllForUser(ctx, user.id);
    res.json({ message: 'Your password was updated. Please sign in.' });
  });

  router.post('/verify-email', (req, res) => {
    const record = consumeOneTimeToken(ctx, 'verifyTokens', body(req).token);
    const user = record && store.users.byId(record.userId);
    if (!user) throw validationFailed({ token: 'This verification link is invalid or has expired.' });
    res.json({ user: publicUser(store.users.update(user.id, { emailVerified: true })) });
  });

  router.get('/providers', (req, res) => {
    res.json({ github: { enabled: Boolean(ctx.githubProvider.enabled) } });
  });

  router.get('/me', auth.requireAuth, (req, res) => {
    res.json({ user: publicUser(store.users.byId(req.auth.userId)) });
  });

  router.post('/resend-verification', auth.requireAuth, (req, res) => {
    const user = store.users.byId(req.auth.userId);
    if (user.emailVerified) return res.json({ message: 'Your email is already verified.' });
    sendVerificationEmail(ctx, user);
    res.status(202).json({ message: 'Verification email sent.' });
  });

  router.get('/sessions', auth.requireAuth, (req, res) => {
    const sessions = store.sessions
      .filter((s) => s.userId === req.auth.userId && isActive(ctx, s))
      .map((s) => ({
        id: s.id,
        createdAt: s.createdAt,
        lastUsedAt: s.lastUsedAt,
        userAgent: s.userAgent,
        remember: s.remember,
        current: s.id === req.auth.sid,
      }))
      .reverse();
    res.json({ sessions });
  });

  router.delete('/sessions/:id', auth.requireAuth, (req, res) => {
    const s = store.sessions.byId(req.params.id);
    // Someone else's session looks exactly like a missing one.
    if (!s || s.userId !== req.auth.userId) throw notFound('Session not found.');
    revokeSession(ctx, s.id);
    res.status(204).end();
  });

  return router;
}
