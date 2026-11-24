# CORS in Intern Quest

**The short version.**
- **The public API is readable from listed sites.** `GET /api/public/characters/:handle` (a public "quest card") can be read by pages from the origins in `CORS_ALLOWED_ORIGINS`, and nothing else can.
- **The signed-in API stays same-origin only.**
- **Forged writes are refused.** Any API write sent from another origin's page is refused, because CORS alone would not stop it.

Everything here can be tried live in the [CORS lab](../../quest-card-embed/README.md), and is checked by `e2e/cors.spec.ts`.

| Where | What |
|---|---|
| [`src/lib/cors.ts`](../src/lib/cors.ts) | the rules, as pure functions: allowlist parsing, the CORS decision, the cross-site write check (unit tested) |
| [`src/proxy.ts`](../src/proxy.ts) | applies them to every request, before any route code: preflights are answered there |
| [`src/app/api/public/characters/[handle]/route.ts`](../src/app/api/public/characters/%5Bhandle%5D/route.ts) | the one cross-origin endpoint |
| [`src/lib/env.ts`](../src/lib/env.ts) | refuses to start with `*` or a malformed origin in `CORS_ALLOWED_ORIGINS` |
| [`../quest-card-embed`](../../quest-card-embed) | a second website (port 4000) that embeds a card, plus the CORS lab |

## 1. The same-origin policy

An **origin** is scheme + host + port. A page may **send** requests anywhere, but its scripts may **read** answers only from their own origin, unless the other origin allows it. That allowance is CORS: Cross-Origin Resource Sharing.

| Page | Request to | Same origin? | Same site? |
|---|---|---|---|
| `http://localhost:3000` | `http://localhost:3000/api/quests` | yes | yes |
| `http://localhost:4000` | `http://localhost:3000/...` | **no** (port) | yes |
| `http://127.0.0.1:4000` | `http://localhost:3000/...` | **no** (host) | **no** |
| `https://intern-quest-smoky.vercel.app` | `http://intern-quest-smoky.vercel.app` | **no** (scheme) | no |

- **Origin** decides who may **read**, and that is what CORS is about.
- **Site** (scheme + registrable domain, ports ignored) decides when **cookies** travel: `SameSite=Lax` cookies go along with requests within the same site.
- So `localhost:4000` can make the browser send our session cookie to `localhost:3000`, but it cannot read the answer. Section 5 explains why that still matters.

## 2. What CORS is, and what it isn't

- **It's a relaxation**, done by the browser: our server says, per answer, which other origin may read it (`Access-Control-Allow-Origin`).
- **It isn't access control.** `curl`, a server or any non-browser client ignores it. Anything under `/api/public` must therefore be truly public: the card shows only what `/c/:handle` already shows to anyone.
- **It isn't CSRF protection.** A "simple" request is sent without asking first, with cookies where they apply. CORS only hides the answer from the page; the server may already have acted. See section 5.

## 3. Simple vs preflighted requests

A request is **simple** if it is `GET`, `HEAD` or `POST`, with only safelisted headers, and a `Content-Type` that is one of `text/plain`, `multipart/form-data` or `application/x-www-form-urlencoded`. The browser sends it straight away, with an `Origin` header, then decides from the answer whether the script may read it.

Anything else is **preflighted**:
- a custom header (`X-Client-Name`);
- `Content-Type: application/json`;
- `PUT` or `DELETE`;
- and so on.

The browser first sends an `OPTIONS` request carrying `Access-Control-Request-Method` and `Access-Control-Request-Headers`. It sends the real request only if that answer allows the origin, the method **and** every header. `Access-Control-Max-Age` lets it reuse the answer.

## 4. Our configuration

**The allowlist** is `CORS_ALLOWED_ORIGINS`, comma-separated exact origins, set per environment:

| Environment | Value | Set by |
|---|---|---|
| local development | `http://localhost:4000` (the embed site) | `npm run env:local` → `.env.local` |
| browser tests | `http://localhost:4100` (the embed site on its test port) | `playwright.config.ts` |
| production (Vercel) | `http://localhost:4000`: the lab, run locally, against the live API (M6) | `vercel env add CORS_ALLOWED_ORIGINS production` |

**On `/api/public/*` only:**

| Header | Value | Why |
|---|---|---|
| `Access-Control-Allow-Origin` | the request's own `Origin`, **only if it is on the list** | the exact origin, never `*`: we always know who may read; another origin gets no header and its page can't read |
| `Vary` | `Origin` (on every answer, allowed or not) | the answer differs by `Origin`; without it, a browser or CDN cache could hand one origin's answer, with its Allow-Origin, to another |
| `Access-Control-Expose-Headers` | `X-Request-Id` | scripts may read only a few safelisted response headers; this lets an embedding site quote our reference when something fails |
| `Access-Control-Allow-Methods` (preflight) | `GET, OPTIONS` | the card is read-only |
| `Access-Control-Allow-Headers` (preflight) | `Content-Type, X-Client-Name` | the headers a client may add; anything else fails the preflight |
| `Access-Control-Max-Age` (preflight) | `600` | the browser reuses the preflight answer for 10 minutes instead of asking before every request |
| `Access-Control-Allow-Credentials` | **never sent** | the card needs no cookie, so none is invited |

- **Preflights are answered in the proxy:** 204 for a listed origin, **403** for any other. The route code never runs for an `OPTIONS`.
- **Every other route** (`/api/quests`, `/api/character`, …) sends **no CORS headers at all**. Those routes use the session cookie and are for this site only.

## 5. Forged writes (why CORS isn't enough)

**The attack.** A page on another origin can do this:

```js
fetch('http://localhost:3000/api/quests', { method: 'POST', credentials: 'include',
  headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ day: 365, title: 'Forged', skills: ['react'] }) })
```

`text/plain` makes it a simple request, so there's no preflight. The browser sends it, with our session cookie (same site), and `request.json()` in the handler parses it anyway. The page can't read the answer, but the quest would be saved.

**The fix.** `isCrossSiteWrite` in the proxy refuses every API write (`POST`, `PUT`, `PATCH`, `DELETE`) whose `Origin` is not our own, with a 403 "accepted from this site only". Next.js makes the same check for server actions.
- A request with no `Origin` at all (curl, a server) is let through: it's not a victim's browser, so no one's cookie is borrowed.
- `/api/auth/*` is exempt: NextAuth protects its own POSTs with a CSRF token.

**Checked by:**
- lab case 7 and `e2e/cors.spec.ts`: a valid forged quest is not saved, the same request answers 403, and from our own origin it's accepted;
- `test/unit/cors.test.ts`.

## 6. What actually happens: captured exchanges

Captured with `curl` against a production build, `CORS_ALLOWED_ORIGINS=http://localhost:4000`, on 24 Nov. Next.js merges our `Vary: Origin` into its own list.

**A simple GET from the allowed origin:**

```http
GET /api/public/characters/ronit    Origin: http://localhost:4000

HTTP/1.1 200 OK
access-control-allow-origin: http://localhost:4000
access-control-expose-headers: X-Request-Id
Vary: Origin, rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch, Accept-Encoding
cache-control: public, max-age=60
content-type: application/json
```

**The same request from another origin.** It's answered (the data is public), but the page can't read the answer:

```http
GET /api/public/characters/ronit    Origin: http://127.0.0.1:4000

HTTP/1.1 200 OK
Vary: Origin, rsc, …
```

**A preflight from the allowed origin, then from another:**

```http
OPTIONS /api/public/characters/ronit    Origin: http://localhost:4000
Access-Control-Request-Method: GET      Access-Control-Request-Headers: x-client-name

HTTP/1.1 204 No Content
access-control-allow-origin: http://localhost:4000
access-control-allow-methods: GET, OPTIONS
access-control-allow-headers: Content-Type, X-Client-Name
access-control-max-age: 600
vary: Origin
```

```http
OPTIONS /api/public/characters/ronit    Origin: http://127.0.0.1:4000

HTTP/1.1 403 Forbidden
vary: Origin
```

**The signed-in API, even from the allowed origin.** No CORS headers at all:

```http
GET /api/quests    Origin: http://localhost:4000

HTTP/1.1 401 Unauthorized
content-type: application/json
```

**In the browser** (the M1 inventory, rows X1 and X2, and the lab):
- **A refused simple request did reach the server**, and the server answered. The browser then gave the script only `TypeError: Failed to fetch`, the **same error as being offline**. The console said `… has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present`. **A script can't tell a CORS refusal from a network failure; only the console and the Network tab can.** That's deliberate: a script must learn nothing about an answer it may not read.
- **A refused preflight means the real request is never sent.** The Network tab shows only the `OPTIONS`.

## 7. The lab

Run it locally:
1. Start the app with `npm run dev`.
2. Start the embed site: `node server.mjs` in `Day-23/quest-card-embed`.
3. Open http://localhost:4000/lab.html.

| Case | Request | From `localhost:4000` | From `127.0.0.1:4000` |
|---|---|---|---|
| 1 | simple `GET` of a card | works; `x-request-id` readable, `access-control-allow-origin` not | blocked |
| 2 | `GET` with `X-Client-Name` (preflighted) | works; `OPTIONS` then `GET`, no new `OPTIONS` for 10 min | blocked at the preflight (403) |
| 3 | `GET` with `X-Debug` (not allowed) | blocked at the preflight: an allowed origin isn't enough | blocked |
| 4 | `DELETE` | blocked at the preflight (methods: `GET, OPTIONS`) | blocked |
| 5 | `credentials: 'include'` | blocked: no `Allow-Credentials` | blocked |
| 6 | `GET /api/quests` with cookies | blocked: no CORS headers on the signed-in API | blocked |
| 7 | forged `text/plain` `POST` with cookies | blocked for the script; **the server answers 403 and saves nothing** | the same |

**Cases 1 and 2 may show the same request id.** The card answer may be cached for 60 s (`Cache-Control: public, max-age=60`), so the browser can answer the GET from its cache. The lab says when that happens. Tick "Disable cache" in the Network tab to see every request reach the server.

Add `?api=https://intern-quest-smoky.vercel.app` to run the same cases against the live site.

## 8. Development workarounds, and why they stay in development

- **A dev proxy makes the call same-origin**, so CORS never applies. Examples: Next's `rewrites()`, or Vite's `server.proxy` (`'/api' → 'http://localhost:3000'`).
  - It's fine for local work on a frontend that will be served from the same origin as its API in production anyway.
  - It's no fix for a real cross-origin client: it moves the problem rather than solving it, and in production there's no dev server to proxy through.
  - We don't use one: the embed site is meant to be another origin.
- **Never "fix" CORS in the client.** These either don't work or work only on your machine:
  - `mode: 'no-cors'` gives an opaque response the script can't read;
  - a "disable CORS" browser extension or flag;
  - `--disable-web-security`.
- **CORS is the server's decision.**

## 9. Common mistakes, and what we do instead

| Mistake | What goes wrong | Here |
|---|---|---|
| `Access-Control-Allow-Origin: *` with cookies | browsers reject `*` with credentials, so people start **reflecting any Origin**, which lets every site read signed-in answers | an exact allowlist; no credentials on the public API; no CORS at all on the private one |
| Reflecting the `Origin` header without a list | the same as allowing everyone | `corsFor` echoes only listed origins |
| No `Vary: Origin` | a shared cache serves origin A's answer (and Allow-Origin) to origin B | `Vary: Origin` on every `/api/public` answer, refused ones too |
| Trusting CORS to protect writes | simple requests are processed before the browser hides the answer | `isCrossSiteWrite` refuses foreign-origin writes |
| Preflight hits auth or a redirect | an `OPTIONS` without cookies gets a 401 or a redirect, and the browser reports a CORS error | the proxy answers preflights before any auth check |
| `https://a.example/` or `*.example.com` in the list | an origin has no path, and there are no wildcards: the entry never matches | `parseAllowlist` rejects them, and the app refuses to start (`checkEnv`) |
| Forgetting `Access-Control-Allow-Headers` | `Content-Type: application/json` or a custom header fails the preflight | the allowed headers are listed |
| Reading a header the server didn't expose | `response.headers.get()` returns `null` | `X-Request-Id` is exposed |

## 10. Debugging a CORS error

1. **Console:** the message names the missing or wrong header ("No 'Access-Control-Allow-Origin' header", "Response to preflight request doesn't pass", "not allowed by Access-Control-Allow-Headers").
2. **Network tab:**
   - Was there an `OPTIONS` row? Look at its status and its `access-control-*` response headers.
   - Was the real request sent at all?
3. **Reproduce without the browser:** `curl -i -H 'Origin: http://localhost:4000' <url>`, and for a preflight add `-X OPTIONS -H 'Access-Control-Request-Method: GET'`. curl shows the headers the browser judged.
4. **Server log:** the proxy logs one line per request, with `decision: "cors preflight 204"` or `"cors preflight 403"`, and the request id the browser also has.
