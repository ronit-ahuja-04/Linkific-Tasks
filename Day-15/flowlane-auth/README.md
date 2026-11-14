# FlowLane Auth: JWT and OAuth, built by hand

A small FlowLane-style project board (projects and tasks) behind a complete authentication system: **JWT access tokens, rotating refresh tokens, GitHub sign-in (OAuth 2.0), protected routes, roles, password reset, email verification, "remember me" and auto-logout.** A React client talks to its own Express API. Nothing here uses Firebase or an auth service: every piece of the flow is in this repo so it can be read, tested and explained.

```
flowlane-auth/
  client/   React 19 + Vite + react-router + axios      (282+ tests)
  server/   Node 20 + Express 5, JWT, bcrypt, JSON file  (120 tests)
  e2e/      Playwright: the real client against the real server (48 tests)
```

## Run it

```bash
npm run install:all                 # root, server and client dependencies
cp server/.env.example server/.env  # then edit (see below)
npm run dev                         # API on :4000, app on http://localhost:5173
```

Quick demo without any setup: put these in `server/.env`:

```
SEED_DEMO=true          # demo@flowlane.dev / Demo-Pass-123 (member) and admin@flowlane.dev / Admin-Pass-123 (admin)
ENABLE_DEV_OUTBOX=true  # "sent" emails (verify, reset) are readable at GET /api/dev/outbox instead of being emailed
OAUTH_FAKE=true         # a built-in fake GitHub, so "Continue with GitHub" works without credentials
```

The demo accounts, the outbox and the fake provider exist only outside production (the server refuses them when `NODE_ENV=production`).

### Real GitHub sign-in
1. GitHub → Settings → Developer settings → OAuth Apps → **New OAuth App**.
2. Homepage URL `http://localhost:5173`, Authorization callback URL `http://localhost:5173/api/auth/github/callback` (it goes through the Vite proxy, so everything stays on one origin).
3. Put the Client ID and a generated Client secret in `server/.env` as `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`. The secret stays on the server, never in the browser. `server/.env` is git-ignored.

The real GitHub calls are covered by tests with a mocked `fetch`, and the whole flow by tests with the fake provider. **Not verified here: a live round trip with a real GitHub OAuth app** (it needs your credentials). If something is off, the failure lands on `/login?error=oauth_failed`.

## The concepts

**Authentication is "who are you?", authorization is "what may you do?"** Signing in answers the first. The second is enforced on every request: a *role* check (`/admin/users` needs `admin`) and an *ownership* check (a project belongs to one user; asking for someone else's gives a plain 404, so it does not even reveal that it exists).

**A JWT is three base64url parts: `header.payload.signature`.** The payload holds claims (`sub` = user id, `role`, `exp` = expiry, `sid` = session id...). The signature (HMAC-SHA256 with a server secret) proves nobody changed it. It is **signed, not encrypted**: anyone can read the claims, so never put secrets in one. The Security page decodes yours so you can see this.

**Two tokens, two jobs.**

| | Access token | Refresh token |
|---|---|---|
| What | JWT, 15 minutes | random string, 30 days (or until the browser closes) |
| Sent | `Authorization: Bearer ...` on every API call | cookie `fl_refresh`, only to `/api/auth/*` |
| Stored in the browser | **memory only** (a JavaScript variable) | **HttpOnly cookie** (JavaScript cannot read it) |
| Stored on the server | nothing (verified by signature, plus a revoked-session check) | only its SHA-256 hash, one row per session |
| If stolen | useful for at most 15 minutes | rotation detects the theft (below) |

**Why not `localStorage`?** Any script that runs on the page (one XSS bug, one compromised dependency) can read `localStorage` and send the token away. An in-memory token is gone on reload, and an HttpOnly cookie cannot be read by scripts at all. The price: on reload the app has no access token, so it asks `/auth/refresh` (the cookie rides along) for a new one. That is also what keeps you signed in. A cookie has its own risk, CSRF, handled below. [AUTH_STORAGE_COMPARISON.md](../AUTH_STORAGE_COMPARISON.md) compares the options.

**Refresh token rotation and reuse detection.** Every refresh returns a *new* refresh token and retires the old one. If an old token is presented again, someone has a copy (the real user and the thief now hold different tokens), so the server **revokes the whole session**: both stop working and the user signs in again. Verified in the e2e tests against the real API.

**"Remember me".** Checked: the cookie lives 30 days. Unchecked: a *session cookie* (gone when the browser closes) with a server-side limit of 24 hours.

**Auto-logout.** The client schedules a silent refresh about 60 seconds before the access token expires (or at 80% of its life for short tokens). If the refresh fails with "your session is gone" it signs you out and shows *"Your session expired. Please sign in again."* A dropped connection is **not** treated as an expired session: it retries every 5 seconds until the token itself has expired.

**OAuth 2.0 authorization-code flow (GitHub).**

```
Browser                    Our server                      GitHub
  | click "Continue with GitHub" |                            |
  |----GET /api/auth/github----->| make random `state`,       |
  |<---302 to GitHub + state-----| remember it in a cookie    |
  |-----------------------------------approve--------------->|
  |<--------------302 /api/auth/github/callback?code&state----|
  |----callback (cookie)-------->| state == cookie?  (CSRF)   |
  |                              |--code + client secret----->|
  |                              |<--GitHub access token------|
  |                              |--GET user + verified email>|
  |                              | find or create the user,   |
  |                              | start a session            |
  |<--302 /oauth/callback + refresh cookie (no token in URL)--|
  |----POST /auth/refresh------->| the normal refresh gives   |
  |<--access token---------------| the browser its access token
```

The `code` is single-use and worthless without the client secret, which never leaves the server. The `state` check stops someone from tricking your browser into finishing *their* sign-in. No token is ever placed in a URL.

## How a request flows

1. **Sign in:** `POST /auth/login` → access token (memory) + refresh cookie. Same error and similar timing for "no such email" and "wrong password", so the form cannot be used to find out who has an account.
2. **API call:** the axios request interceptor adds `Authorization: Bearer`.
3. **Token expired:** the server answers `401 token_expired`. The response interceptor refreshes **once** (parallel failing calls share a single refresh), then retries the original request. The user notices nothing.
4. **Refresh fails:** the failure handler signs the user out with the notice.
5. **Reload:** on startup `AuthProvider` calls `/auth/refresh`; the page shows "Checking your session…" until it answers, so a signed-in user is not flashed the login page.
6. **Logout:** the server revokes the session and clears the cookie; the client drops the token and timers.

## Where things are

| Concern | Files |
|---|---|
| Axios instance, interceptors, single-flight refresh, `ApiError` | `client/src/api/http.js` |
| Auth state, silent refresh timer, auto-logout, `useAuth` | `client/src/auth/AuthContext.jsx` |
| `ProtectedRoute` (alias `PrivateRoute`), `PublicOnlyRoute`, `RequireRole` | `client/src/auth/ProtectedRoute.jsx` |
| Login, register, forgot/reset password, verify email, OAuth callback | `client/src/pages/auth/` |
| Password strength meter | `client/src/lib/password.js`, `components/auth/PasswordStrength.jsx` |
| Session inspector, board, admin | `client/src/pages/app/` |
| Token signing and verification (pinned to HS256, `iss`/`aud` checked) | `server/src/tokens.js` |
| Sessions, rotation, reuse detection, cookie flags, reset/verify tokens | `server/src/sessions.js`, `server/src/routes/auth.js` |
| CSRF header and Origin check | `server/src/middleware/csrf.js` |
| GitHub provider and the fake one | `server/src/oauth/github.js`, `server/src/routes/oauth.js` |
| Passwords (bcrypt, policy, common-password list) | `server/src/passwords.js` |

## API

| Method and path | Auth | What |
|---|---|---|
| `POST /api/auth/register` | none | create account, sign in, send a verification email |
| `POST /api/auth/login` | none | sign in (`remember` optional); rate limited |
| `POST /api/auth/refresh` | cookie + `X-Requested-With` | rotate refresh token, new access token |
| `POST /api/auth/logout` | cookie + `X-Requested-With` | revoke the session |
| `POST /api/auth/forgot-password`, `reset-password` | none | reset by emailed single-use link (30 minutes); a reset signs out every device |
| `POST /api/auth/verify-email` | none | single-use link (24 hours) |
| `GET /api/auth/providers`, `/github`, `/github/callback` | none | OAuth |
| `GET /api/auth/me`, `/sessions`; `DELETE /api/auth/sessions/:id`; `POST /api/auth/resend-verification` | Bearer | account and sessions |
| `GET/POST/DELETE /api/projects...`, `GET/POST /api/projects/:id/tasks`, `PATCH/DELETE /api/tasks/:id` | Bearer, owner only | the board |
| `GET /api/admin/users` | Bearer, role `admin` | list users |

Errors are always `{ "error": { "code", "message", "fields"? } }` (for example `token_expired`, `refresh_invalid`, `csrf_blocked`).

## Security checklist

| Practice | Done how |
|---|---|
| Never log sensitive data | No passwords, tokens or cookies in logs (a test captures the console and checks); request logs have no query string; reset and verify tokens are stored hashed |
| HTTPS in production | The refresh cookie is `Secure` when `NODE_ENV=production`; `helmet` sets HSTS (which browsers apply over HTTPS). Terminate TLS in front of the server and set `TRUST_PROXY=true` |
| XSS prevention | React escapes output, the app never uses `dangerouslySetInnerHTML`, the access token is not in storage, the refresh cookie is HttpOnly, `helmet` sets a strict CSP on API responses |
| CSRF | Refresh cookie is `SameSite=Strict` and scoped to `/api/auth`; cookie endpoints also need `X-Requested-With: fetch` (a cross-site page cannot send it without a CORS preflight the server refuses) and a same-site `Origin`; the OAuth `state` is checked; other endpoints use a Bearer header, which browsers never attach on their own |
| Passwords | bcrypt (cost 12); minimum 8 with a letter and a digit; common passwords refused; strength meter on the client |
| Brute force | Failed logins are rate limited per client (10 per 15 minutes); forgot-password is limited too |
| Account enumeration | Same login error and timing for unknown email and wrong password; forgot-password answers identically for any email |
| Token tampering | HS256 pinned, `alg: none` and other algorithms rejected, `iss` and `aud` checked, a forged `role` claim fails the signature |
| Authorization | Role and ownership checked on the server; the client hiding a link is only a convenience |

## Tests

- **Server (120):** every endpoint, rotation and reuse detection, cookie flags, expiry (with an injected clock, no waiting), CSRF, rate limits, reset and verify tokens, authorization (another user's data is a 404), the OAuth flow with a fake provider and the real provider with a mocked `fetch`.
- **Client (282+):** the axios interceptors (token attached, one refresh and one retry, parallel 401s share a refresh, refresh failure logs out), `AuthContext` with fake timers (silent refresh, auto-logout, a network blip does not log out, exactly one startup refresh under StrictMode), route guards, every page and form.
- **Browser (48, Chrome, dev server and production build):** register, verify, sign in and out, protected redirects and returning to the page you wanted, reload keeps you signed in, no token in `localStorage`/`sessionStorage`/`document.cookie`, cookie flags (HttpOnly, SameSite=Strict, path), remember me, the interceptor refreshing an expired token mid-request, auto-logout (with a fake clock), silent refresh, password reset and the single-use link, GitHub sign-in, board CRUD, session listing and remote sign-out, authorization, token tampering, refresh reuse, CSRF, and axe WCAG 2.1 AA in light and dark. Every browser test fails on any unexpected console error or warning.

```bash
npm test             # server + client
npm run test:e2e     # browser (starts both servers itself)
npm run test:e2e:prod   # the same against the production client build
```

## Bugs the tests found

- The Security page showed no sessions: the server answers `{ sessions: [...] }` and one function returned the wrapper instead of the list. Unit tests with a mocked API passed; only the real client against the real server (browser test) showed it.
- A dropped network connection during the silent refresh signed the user out. It now retries until the token really expires.
- The 403 page was a second `<main>` inside the layout's `<main>`.
- The reset-password form triggered Chrome's "password form without a username field" hint (fixed with a hidden username field).

## Limits (read before using this for real)

- **Storage is a JSON file** written atomically, enough for one process and a demo. Use a real database for anything else.
- **Rate limiting is in memory**, so it resets on restart and is per process.
- **Emails are not sent**: they go to a dev outbox. Add a mail service for real use.
- **HS256 with one shared secret** is fine for one server; with several services, use asymmetric keys (RS256/ES256).
- No multi-factor authentication, no account lockout beyond rate limiting, no "sign out everywhere" button except per session.
- A signed-out visitor makes one `POST /auth/refresh` that returns 401 on every page load (the browser logs it). A non-secret "has a session" marker cookie could skip it.
- Only Chrome was tested, and an emulated phone width.
