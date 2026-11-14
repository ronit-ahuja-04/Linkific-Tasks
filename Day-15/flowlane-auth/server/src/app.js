import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { resolveConfig } from './config.js';
import { AppError } from './errors.js';
import { createAuthMiddleware } from './middleware/auth.js';
import { createFakeGithubProvider, createGithubProvider } from './oauth/github.js';
import { createAdminRouter } from './routes/admin.js';
import { createAuthRouter } from './routes/auth.js';
import { createDevRouter } from './routes/dev.js';
import { createOAuthRouter } from './routes/oauth.js';
import { createProjectsRouter } from './routes/projects.js';
import { createStore } from './store.js';

// Everything the app depends on is injectable, so tests can fake time, storage and GitHub.
export function createApp(options = {}) {
  const config = resolveConfig(options.config);
  const store = options.store ?? createStore({ dbFile: config.dbFile });
  const now = options.now ?? Date.now;
  const githubProvider =
    options.githubProvider ?? (config.oauthFake ? createFakeGithubProvider() : createGithubProvider(config.github));

  const ctx = { config, store, now, githubProvider };
  ctx.auth = createAuthMiddleware(ctx);

  const app = express();
  app.set('trust proxy', config.trustProxy);
  app.disable('x-powered-by');
  app.use(helmet()); // security headers: nosniff, frameguard, HSTS, a strict CSP...
  // Only our own client origin may call the API from a browser, and only it may send cookies.
  app.use(cors({ origin: config.clientOrigin, credentials: true }));

  if (!config.silent) {
    app.use((req, res, next) => {
      res.on('finish', () => console.log(`${req.method} ${req.originalUrl.split('?')[0]} ${res.statusCode}`)); // path only: no query strings (OAuth codes)
      next();
    });
  }

  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());
  // Responses carry tokens: never let a browser or proxy cache them.
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api/auth', createAuthRouter(ctx));
  app.use('/api/auth', createOAuthRouter(ctx));
  app.use('/api/admin', createAdminRouter(ctx));
  app.use('/api/dev', createDevRouter(ctx));
  app.use('/api', createProjectsRouter(ctx));

  app.use((req, res, next) => next(new AppError(404, 'not_found', 'Route not found.')));

  // Central error handler: every failure leaves the server in the same JSON shape.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof AppError) {
      const error = { code: err.code, message: err.message };
      if (err.fields) error.fields = err.fields;
      return res.status(err.status).json({ error });
    }
    if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
      return res.status(400).json({ error: { code: 'validation_failed', message: 'The request body is invalid or too large.' } });
    }
    if (!config.silent) console.error(`[error] ${req.method} ${req.originalUrl.split('?')[0]}: ${err.message}`);
    res.status(500).json({ error: { code: 'internal_error', message: 'Something went wrong.' } });
  });

  return app;
}
