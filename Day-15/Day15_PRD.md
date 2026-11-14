# PRD: FlowLane + authentication, JWT and GitHub (Day 15)

| Field     | Value                                                                  |
| --------- | ---------------------------------------------------------------------- |
| Owner     | Ronit Ahuja                                                            |
| Programme | Linkific internship, Month 1 (training phase), Day 15                  |
| Date      | Saturday, 14 November 2026                                             |
| Repo path | `Linkific-Tasks/Day-15/flowlane-auth` (the web app and `server/`)      |
| Builds on | Day 12 `flowlane-context` (copied unchanged, then extended)            |
| Status    | **Built.** Merged via PR #PR_NUMBER (follows PR #70, the first version) |
| Companion | `flowlane-auth/README.md`, `AUTH_STORAGE_COMPARISON.md`                |

---

## 1. Summary

Day 15 is authentication: JWT tokens, OAuth social login, protected routes and global auth state. This project takes the real FlowLane (board, chat, notifications, invitations, calendar sync, themes, three languages) and adds the Day 15 features on top of its existing Firebase backend, with the UI left as it was. GitHub is both a sign-in method and an integration: signed-in users can import a repository's issues as tasks into the open project. A small Express API verifies the Firebase ID token (a real JWT check) and proxies GitHub.

It replaces the first version of Day 15 (PR #70: a standalone app with its own Express login backend). That version is still in git history; the comparison document explains how the two designs differ.

## 2. Goals

- Keep FlowLane exactly as it is: same UI and features; all of its tests keep passing.
- GitHub sign-in (OAuth) and an issue import into the board.
- Login, register, logout, forgot and reset password, email verification, remember me, password strength meter.
- Protected routes, global auth state with a loading state, persistent login.
- A JWT story that can be shown: decode the ID token, count down to its expiry, verify it on a server.
- An axios instance with interceptors: attach the token, handle a 401 by refreshing once and retrying.
- Auto-logout (inactivity, and a session ended elsewhere).
- README with the auth flow explained.

**Non-goals:** replacing Firebase, hand-built passwords or tokens in this version, private-repository access, two-way GitHub sync, real email delivery or hosting the API.

## 3. Scope

In: the auth additions, the Security tab, the GitHub import, the Express API with a fake GitHub for tests, tests at four levels (unit, API, rules, browser), documentation. Out: deployment of the API, multi-factor authentication.

## 4. Design

### 4.1 Mapping the task list

| Task list item | Where |
|---|---|
| Authentication vs authorization; token-based auth; JWT structure; refresh tokens | Firebase ID token and refresh token; Security tab decodes the token; README and comparison explain them; Firestore rules are the authorization |
| OAuth 2.0 flow | GitHub sign-in through Firebase's GitHub provider; the GitHub access token is used for the import |
| Login form with validation; logout | `Auth` page, `signIn`, `signOut` |
| Store the token; attach to requests; handle expiry and 401 | Firebase SDK stores the session; axios request interceptor attaches the ID token; response interceptor refreshes once and retries |
| Protected routes, redirect, persistent state | `ProtectedRoute`, `PublicOnlyRoute`, Firebase persistence |
| OAuth provider credentials, callback, store user info | GitHub OAuth app configured in Firebase; the user is a Firebase user with the `github.com` provider |
| Login, register, forgot password, dashboard, logout button | `Auth`, `ForgotPassword`, `AuthAction`, Dashboard (existing), profile menu (existing) |
| AuthContext, `useAuth`, loading states | existing `AuthContext`, extended |
| Remember me, email verification, password strength, auto-logout | persistence choice; `VerifyEmailBanner`, `AuthAction`; `PasswordStrength`; idle timer and session notices |
| Never log sensitive data, HTTPS, XSS, CSRF | README security notes; the API logs no tokens or queries; the GitHub token lives in memory only |
| "GitHub integration" (your request) | sign in with GitHub, link or unlink it in Security, import issues as tasks |

### 4.2 Decisions

| Decision | Why |
|---|---|
| Keep Firebase Auth and Firestore | The board, chat and rules depend on Firebase users; replacing them means rebuilding every real-time feature |
| A separate Express API only to verify the token and proxy GitHub | Gives the Bearer-token and 401-retry flow a real server, and shows what verifying a JWT involves, without owning passwords |
| ID token verified with RS256 against Google's certificates, chosen by `kid`, claims checked | The same checks the Firebase Admin SDK performs, with no service account |
| The Auth emulator's unsigned tokens are accepted only when the emulator variable is set and not in production | Lets the whole stack run in tests without secrets, and can never loosen production |
| The GitHub access token is kept in memory only | It is a powerful credential; a reload costs one click, storage would expose it to any script |
| Import is one Firestore write and one notification | Importing 25 issues as 25 writes and 25 notifications would flood the board and the members |
| Issues are deduplicated by their URL | Importing twice must not duplicate tasks |
| Pull requests are dropped by the API | GitHub's issues endpoint returns them mixed in |
| "Remember me" uses IndexedDB persistence, not localStorage | The localStorage option signed the first tab out when a second tab opened (found by a browser test) |
| Nothing is remembered after the user's own sign-out | Otherwise the next person to sign in lands on the previous user's project |
| Parallel build against a written contract, joined by browser tests | Auth, Security tab, GitHub import and the API were built independently; the end-to-end suite found the integration bugs |

## 5. Requirements

| # | Requirement | Verified by |
|---|---|---|
| R1 | Every original FlowLane test still passes | the original 182 unit, 23 rules and 84 browser tests |
| R2 | Sign in with GitHub works, and the GitHub token is available for the import | browser tests with the Auth emulator's popup |
| R3 | The import lists repositories and issues, filters pull requests, never imports twice, writes once | API, thunk and browser tests |
| R4 | A rejected GitHub token offers Reconnect; an expired ID token is refreshed once and the request retried | interceptor unit tests; browser tests |
| R5 | The API accepts only valid Firebase ID tokens (signature, audience, issuer, expiry, algorithm) | server tests |
| R6 | Remember me controls whether a new tab stays signed in | browser test |
| R7 | Forgot password, reset password and email verification work through the emulator's emailed codes; links work once; no account enumeration | browser tests |
| R8 | Anonymous visitors are sent to sign in and returned to the page they wanted; after a voluntary sign-out nothing is remembered | unit and browser tests |
| R9 | Inactivity signs the user out with a notice; a disabled account is signed out with a notice | browser tests |
| R10 | The raw token is never shown; the GitHub token is never in browser storage | unit and browser tests |
| R11 | All new screens meet WCAG 2.1 AA in light and dark; strings exist in English, Spanish and Hindi | axe browser tests; the translation completeness test |
| R12 | No console errors or warnings | every browser test fails on them |

## 6. Milestones

| #  | Milestone | Branch | PR |
| -- | --------- | ------ | -- |
| M0 | First version: standalone app with its own Express login backend | `day15/flowlane-auth` | #70 |
| M1 | The real FlowLane extended with the Day 15 features and GitHub; replaces M0 in `Day-15/flowlane-auth` | `day15/flowlane-github` | #PR_NUMBER |

## 7. Verification

| Layer | Result |
| ----- | ------ |
| Build and lint | `npm run build` passes; lint reports no errors (the only warnings are in the original Calendar and Chat files) |
| Unit and component tests | 464 passing (the original 182 plus the Day 15 tests, translations complete in all three languages) |
| API tests | 110 passing |
| Firestore security-rules tests | 23 passing |
| Browser end to end | 116 passing in Chrome against the Firebase emulators, the Express API and a fake GitHub, in dev mode and against the production bundle |
| Accessibility | axe-core WCAG 2.1 AA: zero violations, on the original screens and on every new screen, light and dark |

Problems found by the tests and fixed: opening a second tab signed the first one out ("Remember me" used localStorage persistence); the next user to sign in was sent to the previous user's project page; four small contrast problems in the original styles exposed by new screens (dev tag, column count, dark divider) and the orange button under white text; reset-form hints from Chrome about a missing username field; Firestore stream teardown noise that the browser fixture now tolerates as it already did for the Write stream.

**Not covered:** a sign-in and an import against the real GitHub (needs your own GitHub OAuth app; the real client code is tested with a mocked `fetch`), the API hosted in production, private repositories, browsers other than Chrome, real phones.

## 8. Risks

| Risk | Mitigation |
| ---- | ---------- |
| GitHub token theft | Memory only; never stored or logged; cleared on sign-out and on a 401 from GitHub; read-only scopes |
| Forged or confused JWTs reaching the API | RS256 only, `kid` lookup, strict claim checks, tests for `none` and HS256 tricks |
| XSS reading Firebase's IndexedDB session | No raw HTML from user data; documented in the comparison |
| Flooding the board with an import | One write, one notification, dedupe by URL |
| Rate limits on GitHub | A distinct, friendly error with the reset time; per-user limit on our API |
| The emulator shortcut leaking to production | Disabled whenever `NODE_ENV` is `production` (tested) |

## 9. Deliverables

- Complete authentication system on the real FlowLane (`Day-15/flowlane-auth`)
- Login, register, forgot and reset password, email verification
- JWT handling: token inspector, an API that verifies it, axios interceptors
- Protected routes; persistent authentication; idle auto-logout
- OAuth social login (GitHub) and the GitHub issue import
- `AuthContext` and the `useAuth` hook (extended)
- README with the auth flow explained, and the token storage comparison
