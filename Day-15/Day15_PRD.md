# PRD: FlowLane Auth, JWT and OAuth (Day 15)

| Field     | Value                                                               |
| --------- | ------------------------------------------------------------------- |
| Owner     | Ronit Ahuja                                                         |
| Programme | Linkific internship, Month 1 (training phase), Day 15               |
| Date      | Saturday, 14 November 2026                                          |
| Repo path | `Linkific-Tasks/Day-15/flowlane-auth` (`client/`, `server/`, `e2e/`) |
| Builds on | FlowLane's look and Day 12 to 14 UI patterns; new app and new API   |
| Status    | **Built.** Merged via PR #PR_NUMBER.                                |
| Companion | `flowlane-auth/README.md`, `AUTH_STORAGE_COMPARISON.md`             |

---

## 1. Summary

Day 15 is authentication: JWT tokens, refresh tokens, OAuth social login, protected routes and global auth state. Instead of calling a ready-made service, this project builds the whole flow: an Express API that signs and verifies tokens, and a React client that manages them. A small FlowLane-style board (projects and tasks) sits behind the login to prove the protection works. Days 16 and 17 (backend integration) can build on the same API and UI.

## 2. Goals

- Complete authentication system: login, register, forgot and reset password, logout.
- JWT access tokens with refresh tokens; handle expiry (a 401 interceptor) and auto-logout.
- Protected routes (`ProtectedRoute`/`PrivateRoute`), role-protected routes, and persistent login across reloads.
- OAuth social login (GitHub, through the server).
- `AuthContext` with a `useAuth` hook and a loading state during the first auth check.
- Advanced features: remember me, email verification flow, password strength indicator, auto-logout on expiry.
- Security practices applied and documented; README that explains the auth flow.

**Non-goals:** multi-factor authentication, a production database, sending real email, a Google provider, sign-up approval.

## 3. Scope

In: Express API (auth, OAuth, projects and tasks, admin), React client (auth pages, board, session inspector, admin page), tests at three levels, documentation. Out: deployment, real email delivery, rate limiting shared across processes.

## 4. Design

### 4.1 Mapping the task list

| Task list item | Where |
|---|---|
| Authentication vs authorization | roles (`member`, `admin`) and ownership checks; README |
| Token-based auth, JWT structure, refresh tokens | `server/src/tokens.js`, `sessions.js`; Session inspector page decodes the claims |
| OAuth 2.0 flow | `server/src/oauth/github.js`, `routes/oauth.js`; README sequence diagram |
| Login form with validation | `LoginPage`, `lib/validators.js` |
| Store the token; attach to requests | access token in memory, refresh token in an HttpOnly cookie; axios request interceptor |
| Handle token expiry and 401 | response interceptor: one shared refresh, then retry once |
| Logout | `AuthContext.logout`, server-side revocation |
| Protected routes, redirect to login, persistent state on refresh | `ProtectedRoute`, `PublicOnlyRoute`, `RequireRole`; refresh on startup |
| OAuth provider credentials, callback, code exchange, store user | GitHub OAuth app in `server/.env`; callback on the server; client finishes with a refresh |
| Login, register, forgot password, dashboard, logout button | `pages/auth/*`, `pages/app/*`, `AppLayout` |
| AuthContext, `useAuth`, loading states | `client/src/auth/AuthContext.jsx` |
| Remember me, email verification, password strength, auto-logout | persistent vs session cookie; verify-email page and banner; strength meter; silent refresh timer and expiry notice |
| Never log sensitive data, HTTPS, XSS, CSRF | README security checklist; tests |

### 4.2 Decisions

| Decision | Why |
|---|---|
| Own Express backend, not FlowLane's Firebase | Firebase Auth hides exactly what the task wants shown (tokens, refresh, OAuth exchange), and Firestore security depends on Firebase Auth |
| Access token in memory, refresh token in an HttpOnly cookie | A script cannot copy either into long-term storage; compared with `localStorage` in `AUTH_STORAGE_COMPARISON.md` |
| Refresh token rotation with reuse detection | A stolen refresh token is detected the first time both copies are used |
| Refresh tokens stored hashed, one row per session | A database leak does not leak usable tokens; individual devices can be signed out |
| CSRF defence in layers (SameSite=Strict, custom header, Origin check) | No single measure is enough for cookie endpoints |
| OAuth done by the server; the client finishes with a refresh | The client secret never reaches the browser; no token travels in a URL |
| Generic login errors and timing; identical forgot-password answers | Prevents learning which emails have accounts |
| A network error does not log the user out | A dropped connection is not an expired session |
| Fake GitHub provider and dev outbox, off in production | The whole flow can be tested and demonstrated without credentials or a mail server |
| Parallel build against a written contract (API, errors, client module shapes) | Server, auth core, auth pages and app pages built independently, joined by an end-to-end suite |

## 5. Requirements

| # | Requirement | Verified by |
|---|---|---|
| R1 | Register, login and logout work; wrong credentials give one generic error | server, client and browser tests |
| R2 | Access tokens expire; an expired token is refreshed once and the request retried | interceptor unit tests; browser test with an injected 401 |
| R3 | Refresh tokens rotate; reuse of an old one revokes the session | server tests; browser test against the real API |
| R4 | A reload keeps the user signed in; no token in browser storage; cookie is HttpOnly, SameSite=Strict, path-scoped | browser test |
| R5 | Remember me gives a persistent cookie (30 days), otherwise a session cookie | server and browser tests |
| R6 | Anonymous visitors are redirected to login and returned to the page they wanted; members cannot open admin | browser tests |
| R7 | Another user's data is a 404; non-admin gets 403 on admin routes | server and browser tests |
| R8 | GitHub sign-in completes; a wrong `state` is rejected | server tests (fake provider, mocked real provider); browser tests |
| R9 | Password reset is single use, expires, and signs out all devices; forgot-password never reveals whether an email exists | server and browser tests |
| R10 | Silent refresh before expiry; auto-logout with a notice when the session is gone | client unit tests with fake timers; browser tests with a fake clock |
| R11 | CSRF: cookie endpoints refuse requests without the custom header or with a foreign Origin | server and browser tests |
| R12 | Passwords never appear in logs or responses; tokens are stored hashed | server tests |
| R13 | WCAG 2.1 AA in light and dark on the auth pages, dashboard, security and admin pages | axe browser tests |
| R14 | No console errors or warnings | every browser test fails on them |

## 6. Milestones

| #  | Milestone | Branch | PR |
| -- | --------- | ------ | -- |
| M1 | API, client, tests, README, storage comparison | `day15/flowlane-auth` | #PR_NUMBER |

## 7. Verification

| Layer | Result |
| ----- | ------ |
| Build and lint | client build passes; `npm run lint` reports nothing in either package |
| Server tests | 120 passing |
| Client unit and component tests | 282 passing |
| Browser end to end | 48 passing in Chrome against the dev server and the production client build; the browser talks to the real server |
| Accessibility | axe-core WCAG 2.1 AA: zero violations on the auth pages, dashboard, security and admin pages, light and dark |

Problems found by the end-to-end tests, and fixed: the Security page showed no sessions (the server answers `{ sessions }` and one client function returned the wrapper; unit tests with a mocked API had passed); a dropped connection during a silent refresh logged the user out; a duplicate `<main>` landmark on the 403 page; a Chrome console hint on the reset form. Several of my own tests had timing races (navigating away before logout finished) and are fixed.

**Not covered:** a live round trip with a real GitHub OAuth app (needs credentials; the real provider is tested with a mocked `fetch`), browsers other than Chrome, real devices (an emulated 375 px width only), and load or penetration testing.

## 8. Risks

| Risk | Mitigation |
| ---- | ---------- |
| Token theft | Short access tokens, memory only; refresh rotation with reuse detection; per-session revocation |
| XSS | React escaping, no raw HTML, HttpOnly refresh cookie, CSP from `helmet` |
| CSRF on cookie endpoints | SameSite=Strict, custom header, Origin check |
| Account enumeration, brute force | Generic errors and timing, rate limits, identical forgot-password answers |
| JSON-file storage and in-memory rate limits | Documented limits; the data layer is one module (`store.js`) to swap |
| OAuth misconfiguration | `/login?error=oauth_failed` message; `state` checked; setup steps in the README |

## 9. Deliverables

- Complete authentication system (`Day-15/flowlane-auth`)
- Login and register pages (plus forgot, reset, verify email)
- JWT token management (access and rotating refresh tokens)
- Protected routes implementation
- OAuth social login (GitHub)
- `AuthContext` with the `useAuth` hook
- Persistent authentication
- README with the auth flow explained, and a token storage comparison
