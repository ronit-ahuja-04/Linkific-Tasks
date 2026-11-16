# FlowLane + authentication, JWT and GitHub

**Day 15 project:** Linkific Month 1 Training
**Author:** Ronit Ahuja
**Stack:** React 19, Vite, Firebase Auth and Firestore, Redux Toolkit (server data), React Context (user, theme, language, toast), axios, a small Express API, Vitest, Testing Library, Playwright
**PRD:** [Day15_PRD.md](../Day15_PRD.md)
**Comparison:** [AUTH_STORAGE_COMPARISON.md](../AUTH_STORAGE_COMPARISON.md)
**Starting point:** the Day 12 app (`Day-12/flowlane-context`), copied unchanged and extended. Same board, chat, notifications, invitations, calendar sync, themes and three languages; the Day 11 and 12 folders are untouched.

## What Day 15 adds

| Feature | Where it lives |
|---|---|
| **Sign in with GitHub** (OAuth through Firebase's GitHub provider) | `Auth` page, `signInWithGithub` in `AuthContext` |
| **Import GitHub issues as tasks** into the open project | "Import from GitHub" button in the project header, `ImportFromGitHub`, `importTasks` thunk |
| **Remember me** (session lasts across restarts, or only until the tab closes) | `AuthContext`, Firebase persistence |
| **Forgot and reset password**, **email verification** (with a banner and "Resend") | `ForgotPassword`, `AuthAction` (`/auth/action`), `VerifyEmailBanner` |
| **Password strength meter** | `PasswordStrength`, `lib/password.js` |
| **Protected routes** that return you to the page you wanted | `RouteGuards` (`ProtectedRoute`, `PublicOnlyRoute`) |
| **Auto-logout** after 30 minutes of inactivity, and a notice when a session is ended elsewhere | `AuthProvider` idle timer and `notice` |
| **Security page** (Settings, Security tab): your decoded ID token, a live expiry countdown, linked sign-in methods, email status | `SecurityPanel` |
| **A small Express API** that verifies the Firebase ID token (a real JWT check) and proxies GitHub | `server/` |
| **axios instance with interceptors** (adds the token, on a 401 refreshes once and retries) | `src/api/client.js` |

## Run

```bash
cd Day-15/flowlane-auth
npm install
npm --prefix server install
cp .env.example .env            # your Firebase web app keys, as before
npm run dev:all                 # web on :5173 and the API on :4000
npm test                        # unit and component tests (Firebase mocked)
npm run test:server             # the Express API's tests
npm run test:rules              # Firestore security-rules tests (emulator, needs Java)
npm run test:e2e                # browser tests against the Firebase emulators
npm run test:e2e:prod           # the same against the production bundle
```

Only the web app is needed for everything except the Security tab's "Ask the API" and the GitHub import. `npm run dev` starts just the web app.

### Turn on GitHub sign-in (once)
1. GitHub → Settings → Developer settings → OAuth Apps → **New OAuth App**. Homepage `http://localhost:5173`. The **Authorization callback URL** is the one Firebase shows you: Firebase console → Authentication → Sign-in method → GitHub (it looks like `https://<project>.firebaseapp.com/__/auth/handler`).
2. In Firebase, enable the GitHub provider and paste the app's Client ID and Client secret. The secret lives only in Firebase, never in this repo.
3. Nothing else: the app already requests `read:user` and `user:email`. Reading issues of public repositories needs no more; private repositories need the broader `repo` scope, which this app does not request.

Tests and demos need none of this: the browser tests use the Auth emulator's fake GitHub popup and a fake GitHub API (`npm run dev:fake-github`).

**Not verified here: a sign-in and an import against the real GitHub** (it needs your own GitHub OAuth app). Everything else around it is covered by tests with the emulator and the fake GitHub, and the real GitHub calls by tests with a mocked `fetch`.

## How the pieces fit

```
Browser (React)                                  Express API (server/)              GitHub
  Firebase Auth SDK  ──ID token (JWT, 1 hour)──►  verify signature + claims
  axios client       ──Authorization: Bearer──►   GET /api/me                        
                     ──+ X-GitHub-Token────────►  GET /api/github/repos, /issues ──► api.github.com
  Firestore (board, chat, ...)  ◄─ secured by Firebase rules, as before
```

Firebase Auth already is a JWT system. After sign-in the browser holds an **ID token** (a JWT signed RS256 by Google, valid 1 hour). The SDK also keeps a long-lived **refresh token** and renews the ID token by itself. The Express API checks that same ID token: it downloads Google's public certificates, picks the one named in the token's `kid` header, verifies the RS256 signature, then checks `aud`, `iss`, `sub`, `auth_time` and the expiry. A forged or expired token is a 401.

### The GitHub token
Signing in (or connecting) with GitHub gives the browser a **GitHub access token**. It is a different thing from the Firebase token: it lets the app call GitHub as you. It is kept **in memory only** (`lib/githubToken.js`): not in `localStorage`, not in `sessionStorage`. A reload forgets it, and "Connect GitHub" runs the popup again. It travels in an `X-GitHub-Token` header to the API, which forwards it to GitHub and never stores or logs it.

### What the axios client does (`src/api/client.js`)
1. **Request:** adds `Authorization: Bearer <ID token>` (the SDK hands over the cached token and renews it when it is close to expiry), plus `X-GitHub-Token` when the call needs it.
2. **401 `token_expired` or `unauthorized`:** force-refreshes the ID token once (parallel failures share one refresh) and retries the request once. If it fails again the user is signed out with the notice "Your session expired".
3. **401 `github_token_invalid`:** forgets the GitHub token; the import dialog offers **Reconnect GitHub**. This is a different failure from an expired FlowLane token, so it is handled differently.
4. **Network failure:** becomes a friendly error; nothing is retried twice.

### Sessions and sign-out
- **Remember me** picks Firebase's persistence: ticked uses IndexedDB (survives closing the browser, shared by all tabs); unticked uses `sessionStorage` (a new tab starts signed out).
- **Idle auto-logout:** 30 minutes without a click, key or scroll signs you out with the notice "You were signed out after a period of inactivity" (`VITE_IDLE_MINUTES` changes it).
- **A session that ends elsewhere:** when Firebase signs the user out because the account was disabled or the refresh token is no longer valid, the sign-in page says "Your session expired".
- **After you press Sign out** nothing is remembered, so the next person to sign in on this browser starts at the dashboard, not on your last page.

### Import GitHub issues
Open a project → **Import from GitHub** → connect (skipped if you signed in with GitHub) → pick a repository → tick issues → **Import**. Imported issues become tasks in To Do, with a `#123` badge that links back to the issue. Pull requests (GitHub's issues endpoint includes them) are filtered out by the API; issues already imported are shown as such and cannot be picked again (matched by their URL); the whole import is **one** Firestore write and **one** notification to the members. Labels become tags.

## Where things are

| Concern | Files |
|---|---|
| Auth state, persistence, idle logout, notices | `src/context/AuthContext.jsx`, `src/lib/session.js`, `src/lib/authErrors.js` |
| Route guards | `src/components/RouteGuards.jsx`, `src/App.jsx` |
| Sign-in, forgot password, email links | `src/pages/Auth.jsx`, `ForgotPassword.jsx`, `AuthAction.jsx`, `src/components/PasswordStrength.jsx`, `PasswordField.jsx`, `VerifyEmailBanner.jsx` |
| Security tab | `src/components/SecurityPanel.jsx`, `src/pages/SettingsView.jsx` |
| API client and GitHub calls | `src/api/client.js`, `src/api/github.js`, `src/context/GitHubContext.jsx`, `src/lib/githubAuth.js`, `src/lib/githubToken.js` |
| Import dialog, badge, bulk thunk | `src/components/ImportFromGitHub.jsx`, `src/components/github/`, `GitHubBadge.jsx`, `importTasks` in `src/store/slices/boardSlice.js` |
| Express API | `server/src/` (`firebaseToken.js`, `routes/`, `middleware/`, `dev/fake-github.js`); see `server/README.md` |
| Translations (English, Spanish, Hindi) | `src/i18n/*/account.js`, `security.js`, `github.js` |

## Security notes

| Practice | How |
|---|---|
| Tokens never logged | The API logs only `METHOD /path STATUS`; no query strings, headers or tokens (tested) |
| JWT checked properly | RS256 only, certificate chosen by `kid`, `aud` / `iss` / `sub` / `auth_time` / expiry checked; `alg: none` and HS256-with-the-public-key tricks are rejected (tested) |
| GitHub token | memory only, never stored or logged by the API, cleared on sign-out and on a 401 from GitHub |
| Enumeration | "Forgot password" gives the same answer for any email |
| Weak passwords | strength meter on sign-up and reset; Firebase enforces its own minimum |
| Rate limiting | per signed-in user on the API |
| XSS | React escapes output; no `dangerouslySetInnerHTML` is used for user data; imported issue text is rendered as text and links only open when the URL is `http(s)` |
| The emulator shortcut | The API accepts the Auth emulator's **unsigned** tokens only when `FIREBASE_AUTH_EMULATOR_HOST` is set and `NODE_ENV` is not `production` |

**What Firebase stores in the browser:** by default the ID and refresh tokens are kept by the Firebase SDK in IndexedDB, which scripts on the page can read. That is Firebase's design; it is why the app avoids raw HTML, and the comparison document shows the alternative (memory plus an HttpOnly cookie, which needs your own backend) that the previous version of this project built.

## Tests

| Layer | What |
|---|---|
| Unit and component | the original 182, plus Day 15: auth context and persistence, route guards, the pages, password strength, API client and interceptors, GitHub context, import dialog, bulk-import thunk, Security panel |
| Server | token verification (valid, expired, wrong audience or issuer, wrong algorithm, key rotation, emulator mode), every endpoint with a fake GitHub, rate limiting, validation, no secrets in logs |
| Security rules | the original 23 (tasks gained an optional `source` field the rules allow) |
| Browser (Chrome, emulators) | the original 84, plus Day 15: remember me across tabs, forgot and reset password, email verification, idle logout, a disabled account, GitHub sign-in through the emulator's popup, linking and unlinking, importing issues (pull requests filtered, never twice), a rejected GitHub token and an expired ID token handled by the interceptor, the Security tab, and axe WCAG 2.1 AA on every new screen in light and dark. Every test fails on an unexpected console error or warning |

The GitHub popup tests need the internet for one thing: Firebase's popup loads Google's script loader (`apis.google.com`), so those tests let that one host through instead of stubbing it.

## Bugs the tests found

- **Opening a second tab signed the first tab out.** "Remember me" used `browserLocalPersistence` (localStorage), but a fresh tab starts with Firebase's default (IndexedDB), moves the user over, and removes it from localStorage. It now uses `indexedDBLocalPersistence`.
- **The next person to sign in landed on the previous user's project URL.** The guard remembered the page after a voluntary sign-out. It now remembers nothing in that case.
- A few contrast problems the new screens exposed in the original styles: the dev tag text (orange on pale yellow, used by imported labels), the column count, and the dark-theme divider text. The Security button used the brand orange under white text (about 3:1) and now uses the darker `--primary-strong`.
- The Express API's test config picked up the web app's Vitest config from the parent folder.

## Limits

- The API must be hosted for the Security "Ask the API" button and the GitHub import in production (`VITE_API_URL`). `vercel.json` covers the web app only.
- Real GitHub sign-in and import are unverified (see above); only the fake and the mocked paths ran.
- The GitHub token is gone after a reload, by design.
- Private repositories are not covered (no `repo` scope is requested).
- Two-way sync (a GitHub issue closing a task) is not built; the import is one-way and one-time.
- Only Chrome was tested, and no real phone.
- The ID and refresh tokens live in IndexedDB (Firebase's choice).

## Original FlowLane notes

The Day 12 sections (who owns which state, Context patterns, compound components, toasts, language and theme) still describe this app: see `Day-12/flowlane-context/README.md`. The original product requirements are in `prd.md` in this folder.
