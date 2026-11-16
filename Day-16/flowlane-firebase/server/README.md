# FlowLane API

A small Express 5 API for the Day 15 auth lesson. It does two jobs:

1. **Verifies the Firebase ID token** the browser sends (`Authorization: Bearer <token>`), a real JWT check.
2. **Proxies GitHub** (list repos, list issues) so the browser can import issues as tasks.

## Run

```bash
cd server
cp .env.example .env        # FIREBASE_PROJECT_ID falls back to VITE_FIREBASE_PROJECT_ID of ../.env
npm run dev                 # http://localhost:4000 (the Vite dev server proxies /api to it)
npm test                    # 110 tests, no network
npx oxlint
```

Demo without a GitHub account (fake GitHub on port 4200, deterministic data):

```bash
node src/dev/fake-github.js                         # FAKE_GITHUB_PORT to change the port
GITHUB_API_URL=http://127.0.0.1:4200 npm run dev
```

With the fake, any token works except `bad-token` (401) and `limited-token` (rate limited).
`octocat/hello-flowlane` has 35 open items over 2 pages (every 7th is a pull request) plus 5 closed;
every other repo is 404.

## Endpoints

| Route | Needs | Returns |
| --- | --- | --- |
| `GET /api/health` | nothing | `{ ok: true }` |
| `GET /api/me` | ID token | what the server verified: uid, email, provider, dates (ms), `verifiedBy` |
| `GET /api/github/repos?q=&page=` | ID token + `X-GitHub-Token` | `{ repos, hasMore }` |
| `GET /api/github/issues?repo=owner/name&state=open\|closed\|all&page=` | ID token + `X-GitHub-Token` | `{ issues, hasMore }` (pull requests removed) |

Errors always look like `{ "error": { "code", "message" } }`: `unauthorized`, `token_expired`,
`github_token_missing`, `github_token_invalid`, `rate_limited` (429, ours), `github_rate_limited`
(429, GitHub, with `resetAt`), `repo_not_found`, `validation_failed`, `github_unavailable` (502),
`not_found`. Two extras: `github_forbidden` (403) and `auth_unavailable` (503, Google's certificates
could not be downloaded).

## How the token is verified (`src/firebaseToken.js`)

A Firebase ID token is a JWT signed by Google with a private key (RS256). The server holds no secret:

1. Decode the header and read `kid` (which Google key signed it).
2. Take the matching **public certificate** from Google's `securetoken` endpoint (cached for the
   `max-age` Google sends; one refetch on an unknown `kid`, rate limited so random kids cannot hammer Google).
3. `jwt.verify` with `algorithms: ['RS256']` only. This blocks `alg: none` and the HS256-with-public-key trick.
4. Check `aud` = project id, `iss` = `https://securetoken.google.com/<project>`, `sub` (non-empty, at most
   128 chars), `auth_time` and `iat` not in the future, `exp` in the future.

An expired but genuine token gives `401 token_expired` (the browser refreshes it and retries once). The
signature is checked first, so a forged expired token is `401 unauthorized`.

**Emulator mode:** if `FIREBASE_AUTH_EMULATOR_HOST` is set and `NODE_ENV` is not `production`, the
emulator's unsigned tokens (`alg: none`) are accepted after the same claim checks, and a warning is logged
at startup. In production the variable is ignored.

## Safety notes

- helmet, JSON body limit 10kb, per-user (uid) rate limit (`RATE_LIMIT_MAX` per minute).
- The GitHub token is only forwarded to GitHub: never stored, logged or echoed.
- Logs are `METHOD /path STATUS ms`: no query strings, no headers.
- `repo` is validated before it goes into a URL path (`..` segments are rejected).
