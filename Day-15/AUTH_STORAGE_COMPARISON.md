# Where does the sign-in live in the browser?

A comparison written while building FlowLane's Day 15 authentication. The question every single-page app answers, often without noticing: after sign-in, where does the proof of identity live, and what can an attacker do to it?

This project went through two designs, and the contrast is the point:
- **First version (merged in PR #70, still in git history):** its own Express backend. Access token in JavaScript memory, rotating refresh token in an HttpOnly cookie.
- **This version (the extended, original FlowLane):** Firebase Auth. The Firebase SDK keeps the session, and a small Express API only *verifies* the ID token.

## The three attacks that matter

| Attack | What the attacker does | Needs |
|---|---|---|
| **XSS** (cross-site scripting) | Runs their JavaScript inside your page (an injected script, or a compromised npm package) | One output-escaping bug or one bad dependency |
| **CSRF** (cross-site request forgery) | Makes the victim's browser send a request to your site from the attacker's page; the browser attaches cookies by itself | The credential is a cookie |
| **Copying a stored token** | Replays the token from somewhere else | A copy of the token |

## The options

| Where the credential lives | Can XSS read it? | CSRF risk | Survives reload? | Notes |
|---|---|---|---|---|
| `localStorage` | **Yes, trivially** | None | Yes | Simplest, most common. One XSS bug exposes every user's token |
| `sessionStorage` | **Yes** | None | Per tab only | Same exposure, shorter life |
| **IndexedDB** (what Firebase uses by default) | **Yes** (any script on the page can read it) | None | Yes, shared by all tabs | Like localStorage for security purposes |
| JavaScript variable (**memory**) | Only while the script runs (it can still *use* it, but cannot copy it away for later) | None | **No** | Gone on reload; needs a way to get a new one |
| **HttpOnly cookie** | **No** (scripts cannot read it; injected script can still make requests as the user) | **Yes**, unless mitigated | Yes | `SameSite=Strict`, a custom header and an Origin check close most of the CSRF gap |

Nothing makes XSS harmless: injected script can still call your API while the page is open. What the better options remove is the **copyable, long-lived secret**.

## What each project version does

| | First version (own backend) | This version (Firebase) |
|---|---|---|
| Short-lived token | JWT, 15 minutes, **memory** | Firebase ID token (JWT, RS256, 1 hour), **IndexedDB** (or `sessionStorage` if "Remember me" is off) |
| Long-lived token | Random refresh token, **HttpOnly cookie**, rotated on every use, reuse detection | Firebase refresh token, **IndexedDB**, renewed by the SDK, never seen by the app |
| Who signs the JWT | Our server (HS256, one secret) | Google (RS256; anyone can verify, only Google can sign) |
| Theft detection | Yes: a replayed old refresh token kills the session | Handled by Google's service; the app cannot see or control it |
| CSRF defence needed | Yes (cookie): SameSite=Strict, a custom header, an Origin check | No (the token is sent in an `Authorization` header by code, never by the browser on its own) |
| Reload keeps you signed in | One refresh call on every page load | The SDK restores the user from IndexedDB |
| Code to maintain | A whole server: passwords, bcrypt, reset tokens, rate limits, sessions table | Almost none: Google runs it |
| What you can show and explain | Everything: every step is in the repo | The concepts, but the machinery is behind the SDK |

**The honest trade-off:** the first version is more secure against XSS (nothing copyable in the browser) and shows every step, but it is a login system you must secure and run yourself. Firebase hands the token to scripts on the page, but removes a whole class of server mistakes. For FlowLane, whose data already lives in Firestore behind Firebase rules, using Firebase Auth is the only design where the board keeps working: Firestore decides access from the Firebase user, and a hand-built JWT does not unlock it (a backend could mint Firebase custom tokens, but that needs a Firebase service account, which this project does not have).

## The GitHub token is a different token

Signing in with GitHub gives the browser a **GitHub access token**: permission to call GitHub *as the user*. It is not a FlowLane credential. FlowLane keeps it **only in memory**: not in storage, not in the database; a reload forgets it and the "Connect GitHub" button asks again. The Express API forwards it to GitHub in the request and never stores or logs it. The trade-off is one extra click after every reload, in exchange for no long-lived GitHub credential sitting in the browser.

## What the tests proved along the way

- "Remember me" must use `indexedDBLocalPersistence`, not `browserLocalPersistence`. The second one uses localStorage while a fresh tab starts with IndexedDB; the new tab then **moves the user across and signs the first tab out**. A browser test with two tabs found it.
- The API's JWT check rejects: a wrong audience or issuer, an expired token (a distinct "expired" answer so the client knows to refresh), `alg: none`, and the HS256-with-the-public-key trick.
- No JWT and no GitHub token appears anywhere in `localStorage` or `sessionStorage` (the Firebase session is the one thing in IndexedDB, as described above).

## When to pick what

| Situation | Choice |
|---|---|
| A prototype or an internal tool | `localStorage` or Firebase defaults are tolerable; know the XSS exposure |
| A public app with user-generated content, and you can run a backend | Memory + HttpOnly refresh cookie (the first version) |
| An app already built on Firebase or another auth service | Use the service; harden XSS (escaping, CSP, dependency hygiene) |
| Several services behind one login | Short JWTs signed with asymmetric keys so services verify without a shared secret (Firebase already does this) |
| Mobile app | The platform's secure storage (Keychain, Keystore) |

## Limits of this comparison

It reflects the choices made in one training project; it is not a security audit. XSS prevention matters whichever option you pick, and none of the options replaces HTTPS.
