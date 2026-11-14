// Development-only helpers. Each route answers 404 (falls through) unless its flag is on,
// and the flags can never be on in production (see config.js).
import { Router } from 'express';

export function createDevRouter(ctx) {
  const { config, store } = ctx;
  const router = Router();

  // A stand-in for the mailbox: shows the "emails" the app would have sent.
  router.get('/outbox', (req, res, next) => {
    if (!config.enableDevOutbox) return next();
    const messages = store.outbox.all().map(({ id, to, subject, text, link, createdAt }) => ({ id, to, subject, text, link, createdAt }));
    res.json({ messages });
  });
  router.delete('/outbox', (req, res, next) => {
    if (!config.enableDevOutbox) return next();
    store.outbox.removeWhere(() => true);
    res.status(204).end();
  });

  // The fake "GitHub": approves instantly and bounces back to our callback with a fixed code.
  router.get('/fake-github', (req, res, next) => {
    if (!config.oauthFake) return next();
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    res.redirect(302, `/api/auth/github/callback?code=fake-code&state=${encodeURIComponent(state)}`);
  });

  return router;
}
