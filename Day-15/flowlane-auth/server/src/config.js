// Reads environment variables once and turns them into a typed config object.
// Everything that can differ between dev, test and production lives here, so the
// rest of the code never touches process.env directly.
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

const bool = (v, d = false) => (v === undefined || v === '' ? d : String(v).toLowerCase() === 'true');
const int = (v, d) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : d;
};

// TRUST_PROXY tells Express whether to believe X-Forwarded-* headers (needed behind a
// reverse proxy so req.ip and the Secure-cookie logic see the real client).
// "true" means "trust exactly one proxy hop"; a number is a hop count; a string is passed through.
function parseTrustProxy(v) {
  if (v === undefined || v === '' || v === 'false') return false;
  if (v === 'true') return 1;
  if (/^\d+$/.test(v)) return Number(v);
  return v;
}

export function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  const isProd = nodeEnv === 'production';

  // The JWT secret signs every access token. In production it MUST be provided
  // (a random one would invalidate all sessions on every restart and differ per instance).
  let jwtSecret = env.JWT_SECRET;
  let secretGenerated = false;
  if (!jwtSecret) {
    if (isProd) throw new Error('JWT_SECRET is required when NODE_ENV=production');
    jwtSecret = crypto.randomBytes(48).toString('base64url');
    secretGenerated = true;
  }

  const clientUrl = (env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');

  return {
    nodeEnv,
    isProd,
    port: int(env.PORT, 4000),
    clientUrl,
    clientOrigin: new URL(clientUrl).origin,
    jwtSecret,
    secretGenerated,
    accessTtlSeconds: int(env.ACCESS_TTL_SECONDS, 900),
    refreshTtlDays: int(env.REFRESH_TTL_DAYS, 30),
    sessionRefreshTtlHours: int(env.SESSION_REFRESH_TTL_HOURS, 24),
    bcryptCost: int(env.BCRYPT_COST, 12),
    github: {
      clientId: env.GITHUB_CLIENT_ID || '',
      clientSecret: env.GITHUB_CLIENT_SECRET || '',
      callbackUrl: env.GITHUB_CALLBACK_URL || `${clientUrl}/api/auth/github/callback`,
    },
    enableDevOutbox: bool(env.ENABLE_DEV_OUTBOX) && !isProd,
    oauthFake: bool(env.OAUTH_FAKE) && !isProd,
    seedDemo: bool(env.SEED_DEMO),
    dbFile: env.DB_FILE || path.resolve(here, '../data/db.json'),
    trustProxy: parseTrustProxy(env.TRUST_PROXY),
    // Brute-force protection: failed logins and forgot-password requests per IP per window.
    rateLimit: {
      loginMax: int(env.RATE_LIMIT_LOGIN_MAX, 10),
      loginWindowMs: int(env.RATE_LIMIT_LOGIN_WINDOW_MS, 15 * 60 * 1000),
      forgotMax: int(env.RATE_LIMIT_FORGOT_MAX, 5),
      forgotWindowMs: int(env.RATE_LIMIT_FORGOT_WINDOW_MS, 15 * 60 * 1000),
    },
    silent: bool(env.LOG_SILENT),
  };
}

// Merge test/embedding overrides on top of the defaults (nested objects merged one level deep).
export function resolveConfig(overrides) {
  if (!overrides) return loadConfig(process.env);
  const base = loadConfig({});
  const merged = {
    ...base,
    ...overrides,
    github: { ...base.github, ...overrides.github },
    rateLimit: { ...base.rateLimit, ...overrides.rateLimit },
  };
  merged.clientUrl = merged.clientUrl.replace(/\/+$/, '');
  merged.clientOrigin = new URL(merged.clientUrl).origin;
  return merged;
}
