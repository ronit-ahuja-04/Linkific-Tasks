# Where to keep the token: localStorage, memory or a cookie

A comparison written while building `flowlane-auth/`. The question every single-page app answers, often without noticing: after sign-in, where does the proof of identity live in the browser, and what can go wrong?

## The three attacks that matter

| Attack | What the attacker does | Needs |
|---|---|---|
| **XSS** (cross-site scripting) | Runs their JavaScript inside your page (an injected script, or a compromised npm package) | One output-escaping bug or one bad dependency |
| **CSRF** (cross-site request forgery) | Makes the victim's browser send a request to your site from the attacker's page, and the browser attaches the victim's cookies by itself | The victim is signed in and the credential is a cookie |
| **Theft of a stored token** (a leaked log, a stolen laptop, a copied cookie value) | Replays the token from somewhere else | A copy of the token |

## The options

| Where the credential lives | XSS can read it? | CSRF risk | Survives reload? | Notes |
|---|---|---|---|---|
| `localStorage` | **Yes, trivially** (`localStorage.getItem`) | None (never sent automatically) | Yes | Simplest and the most common. One XSS bug exposes every user's token, and it stays valid until it expires |
| `sessionStorage` | **Yes** | None | Per tab only | Same exposure as `localStorage`, shorter life |
| JavaScript variable (**memory**) | Only while the script runs (it can still *use* the token, but cannot copy it away for later) | None | **No** | Gone on reload and in other tabs, so you need a way to get a fresh one |
| **HttpOnly cookie** | **No** (scripts cannot read it, though injected script can still make requests *as* the user) | **Yes**, unless mitigated | Yes | `SameSite=Strict`, a custom request header and an Origin check close most of the CSRF gap |
| Non-HttpOnly cookie | Yes | Yes | Yes | The worst of both: no benefit over `localStorage` |

Nothing makes XSS harmless: injected script can still call your API while the page is open. What the better options remove is the **copyable, long-lived** secret: with `localStorage` the attacker takes the token home and uses it for days; with memory plus an HttpOnly cookie they can only act while the victim's tab is open.

## What FlowLane Auth does: a split

| Token | Where | Why |
|---|---|---|
| **Access token** (JWT, 15 minutes) | JavaScript **memory** | Even if read, it dies in minutes; nothing is persisted to steal |
| **Refresh token** (random, 30 days or session) | **HttpOnly, SameSite=Strict, `Secure`** cookie scoped to `/api/auth` | Scripts cannot read it; the browser only sends it to the two endpoints that need it |

On reload the memory is empty, so the app calls `/auth/refresh`; the cookie goes along and a new access token comes back. That one call is also how "stay signed in" works.

CSRF on the cookie endpoints is handled in layers, because no single one is enough: `SameSite=Strict` (the browser does not send the cookie on cross-site requests), a required `X-Requested-With: fetch` header (a cross-site page cannot add a custom header without a CORS preflight, which the server does not approve), and a same-site `Origin` check. All other endpoints use `Authorization: Bearer`, which a browser never adds by itself, so they are not CSRF targets at all.

## Stateless JWT sessions vs server-side sessions

| | Stateless JWT only | Server-side session (cookie holds an id) | **This project: short JWT + stored refresh sessions** |
|---|---|---|---|
| Server stores per user | Nothing | A session row | One row per refresh session (hash only) |
| Revoke one user *now* | Hard (wait for expiry, or keep a denylist) | Delete the row | Revoke the session row; the server also checks it on each request, so access dies immediately |
| Detect a stolen token | No | Possible | **Yes**: rotation plus reuse detection |
| Scales across servers | Easily | Needs a shared store | Needs a shared store for the refresh table |
| Cost per request | Verify a signature | Look up a row | Verify a signature (plus a revoked-session check) |

The honest trade-off: the moment you want "log this device out" or "a reset must end all sessions", pure statelessness stops being possible. The access token stays stateless and short; the refresh side keeps the state that makes revocation real.

## What this project verifies (browser tests against the real API)

- No JWT (`eyJ...`) in `localStorage`, `sessionStorage` or `document.cookie`; the refresh cookie is `HttpOnly`, `SameSite=Strict`, path `/api/auth`.
- Replaying an old refresh token returns `401 refresh_invalid` and also kills the newer one.
- A refresh without the CSRF header, or with a foreign `Origin`, returns `403 csrf_blocked`.
- A tampered token (`role` changed to `admin`) is rejected.
- "Remember me" gives a persistent cookie of about 30 days; without it, a session cookie.

## When to pick what

| Situation | Choice |
|---|---|
| A prototype or an internal tool with no untrusted content | `localStorage` is tolerable, but accept the XSS exposure knowingly |
| A public app with user-generated content | Memory + HttpOnly refresh cookie (this project) |
| Same-site server-rendered pages | A plain session cookie (`HttpOnly`, `SameSite=Lax`/`Strict`) and CSRF tokens on forms |
| Several services behind one login | Short JWTs signed with asymmetric keys (RS256/ES256) so services verify without the secret, plus a central refresh endpoint |
| Mobile app | Tokens in the platform's secure storage (Keychain, Keystore), not the web options |

## Limits of this comparison

It reflects the choices made in one training project; it is not a security audit. XSS prevention (escaping, CSP, dependency hygiene) matters whichever option you pick, and none of the options replaces HTTPS.
