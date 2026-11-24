# Debugging Intern Quest

How to find out **why** something fails, with the tool for each kind of problem. Every example is a real bug from this repository, from Days 21 to 23. Each section ends with a short **Try it** you can repeat in a couple of minutes.

| Symptom | Start with |
|---|---|
| A button, form or list behaves wrongly | **Network** tab, then **Console** |
| "blocked by CORS policy" | **Network** (the `OPTIONS` row), then `curl -i` (see [CORS.md](CORS.md#10-debugging-a-cors-error)) |
| A page shows "could not load" with a reference | the **server log**, searched for the reference |
| Wrong data or state on screen | **React DevTools** |
| A logic bug in server code | **breakpoints in the server** (`next dev --inspect`) |
| A stack trace from production | **source maps** |
| "Works on my machine", or only under load | the **tests**, the **fault proxy** and the **inventory** |

---

## 1. The Network tab

**What it answers:** was a request sent? What did it carry, and what came back, how fast? Most frontend bugs are visible here before they are visible anywhere else.

**The stuck "Saving…" button (Day 23, finding E-1).**
- *The symptom:* offline, "Publish quest" said "Saving…" forever.
- *Network tab, set to Offline:*
  - the `POST /api/quests` row is red, `(failed) net::ERR_INTERNET_DISCONNECTED`;
  - no response at all;
  - the Console shows `Uncaught (in promise) TypeError: Failed to fetch`.
- *The cause:* that "uncaught" was the clue. `fetch` **rejects** when there is no answer, and the code only handled answers (`if (!response.ok)`). So the line `setBusy(false)` after it never ran.
- *The fix:* every call goes through `apiFetch` (`src/lib/api-client.ts`), and `busy` resets in `finally`.

**What to read in a row:**

| Column or panel | Tells you |
|---|---|
| Status | `(failed)`: no answer at all. `(canceled)`: aborted (our 15 s deadline, or a navigation). A number: the server answered |
| Headers → Response | `x-request-id`: **the reference to search the server log for** |
| Headers → Request | `Origin` (CORS), cookies (sent or not), `Content-Type` (decides simple vs preflighted) |
| Timing | *Waiting for server response* = slow server or database; *Content download* = big body; *Stalled* = too many connections |
| Initiator | which code sent it (click through to the line) |

**Throttling.** "Slow 4G" in the throttle menu shows the skeletons (Day 23 M4). But throttling only slows **the browser's** connection. A slow **database** is invisible to it, because the server waits, not the network. That's why the inventory has its own fault proxy (section 8).

**Try it:**
1. Open `/journal/new` and fill in a title.
2. Set the Network tab to Offline, then press Publish.
3. Read the failed row, then the message on the form.
4. Set it back to "No throttling": the same button saves.

## 2. The Console

**What it answers:** what the code said while it ran. Errors are in red, with a clickable stack.

**Where a log appears in Next.js** (a common confusion):

| Code | Its `console.log` appears in |
|---|---|
| Client Components (`'use client'`), event handlers | the **browser** console |
| Server Components, route handlers, server actions, `proxy.ts` | the **terminal** running `npm run dev`, and on Vercel in the project's **Logs** |
| Both, in development | Next also forwards server errors to the browser's dev overlay |

**Our structured log lines.** On the server, logging is one JSON line per event, so it can be searched:
- `{"at":"proxy",…}` for every request, with its id and the proxy's decision;
- `{"at":"error",…}` for every server error, with the request id, the digest, the route, the error kind and a short stack (`src/lib/server/log.ts`, `src/instrumentation.ts`);
- `{"at":"client-error",…}` for errors browsers reported (`/api/client-errors`).

**Console techniques worth knowing:**
- **`console.table(rows)`** shows an array of objects as a table. For example, the quests and their XP in the browser console after copying the API's answer.
- **`console.group('save') / console.groupEnd()`** folds the lines of one operation together.
- **Levels** (`debug`, `info`, `warn`, `error`) work with the console's level filter. Use `error` only for real errors: a wrong password is a `warn` in `src/auth.ts`, so it doesn't look like an incident.
- **"Preserve log"** keeps the console (and the Network tab) across navigations. You need it to see what happened right before a redirect.
- **Filter out noise.** Until Day 23, every page logged two errors locally for `/_vercel/insights` scripts that exist only on Vercel (116 in one inventory run). Noise like that hides real errors. Now those scripts render only on Vercel (finding E-13).

**Try it:**
1. In the console of any page, run `setTimeout(() => { throw new Error('test') })`.
2. The console shows the error, the toast says it was reported, and the Network tab shows `POST /api/client-errors 204`.
3. The terminal shows the `client-error` line.

## 3. From a reference to the cause: the server log

**The problem it solves:** "it said something went wrong" is not a bug report. Since Day 23 every failure the user sees carries a reference.

| The user sees | It is | Search the log for |
|---|---|---|
| "(ref 80defe78)" after an API error | the first 8 characters of the request id (`x-request-id`) | `80defe78` |
| "Reference: 426751613" on an error page | Next's **digest** of a server error | `"digest":"426751613"` |

**Locally:** `npm run dev 2>&1 | tee dev.log`, then `grep 80defe78 dev.log`.

**On Vercel:** open the project's **Logs** and search for the id or digest, or `vercel logs <deployment-url>` from the CLI. One request gives one `proxy` line and, if it failed, one `error` line with the same `id`.

**Real example (Day 23 inventory, run against the M2 build):**
1. With the database unavailable, the error page showed **ERROR 426751613**.
2. The log had exactly one line with that digest: `{"at":"error","source":"render","id":"1e19fbd3-…","digest":"426751613","path":"/","route":"/","name":"DbError","kind":"unavailable","message":"Loading characters: the database did not answer (…)", "stack":[…]}`.
3. That line gives the route, the request, the kind and the first stack frames.

**Before Day 23:**
- page errors showed the digest, but the log printed it several lines below the error, not tied to any request id;
- API errors had **no reference at all**: an empty 500.

## 4. Breakpoints in the browser (Sources tab)

**What it answers:** what the values really are at one moment, without adding `console.log` and rebuilding.

| Kind | How | Use it when |
|---|---|---|
| Line breakpoint | click a line number in Sources (with source maps, the original `.tsx`) | you know where |
| Conditional | right-click a line, then "Add conditional breakpoint", e.g. `status === 'draft'` | the line runs often, but only one case is wrong |
| Logpoint | right-click, then "Add logpoint", e.g. `'busy', busy` | a `console.log` without editing the code |
| Fetch/XHR | Sources, then "XHR/fetch Breakpoints", then add `api/quests` | stop at whatever code sends a request; follow the call stack back to the button |
| Event listener | "Event Listener Breakpoints", then Mouse → click | you don't know which handler runs |
| DOM change | Elements, right-click a node, then "Break on" subtree modifications | something changes the page and you don't know what (e.g. the guild notes list) |
| `debugger;` | a statement in the code | stops there whenever DevTools is open (never commit it) |

**Real example: the optimistic note that vanished (Day 23, M4).**
- *The symptom:* in a browser test, a guild note disappeared after it was sent.
- *How it was found:* Playwright saves a snapshot of the page when a test fails (`test-results/…/error-context.md`). It showed the feed's **first item was a different quest**: other tests running in parallel had published newer quests, and `router.refresh()` had brought them in. The note was there, on its own quest further down.
- *The cause:* the app was right; the test's selector (`.first()`) was wrong. It now finds the note by its own text.
- *To watch it live in the browser:* a DOM-change breakpoint (subtree modifications) on the feed's list stops the moment the refresh replaces it.

**Try it:**
1. Open `/guild` as the mentor.
2. Add a fetch breakpoint for `notes`, then add a note.
3. The debugger stops in `apiFetch`: walk up the Call Stack to `send()` in `GuildFeed.tsx`.
4. Look at `body` in Scope.

## 5. Breakpoints in the server

**When:** the bug is in a route handler, a Server Component, a server action or the proxy.

1. Start the app with `npm run dev -- --inspect`. The terminal prints `Debugger listening on ws://127.0.0.1:9229/…`.
2. In Chrome, open `chrome://inspect` and click **inspect** under *Remote Target*. Use the Sources tab of that window.
3. Set a breakpoint, e.g. in `src/app/api/quests/route.ts` at `const quest = await createQuest(...)`, and publish a quest in the app. The request waits at the breakpoint while you look at `user`, `parsed.value` and `character`.

VS Code works too: a "Next.js: debug server-side" launch configuration runs the same `--inspect` (see the Next.js debugging guide).

**Real example: reading a dependency's code (Day 23, M2).**
- *The puzzle:* with the database down, a page took **about 10 seconds** to show its error, and the code had no 10 s anywhere.
- *How it was found:*
  1. By reading the library: a search for `retry` in `node_modules/@supabase/postgrest-js/dist/index.mjs` found `fetchWithRetry`. It retries every read up to 3 times, waiting 1, 2 and 4 s.
  2. With the server debugger, a breakpoint in `db.ts` and *Step into* on the query lands in that same function.
- *The fix:* that plus our own retries would have multiplied. Server-side retries are now off (`db: { retry: false }`), with a 5 s deadline per request; retrying happens in one layer only (the browser's `apiFetch`, for reads).
- *The lesson:* when timing makes no sense, **step into the library**. Its source is right there in `node_modules`.

## 6. React DevTools

The **Components** tab shows the tree with each component's props, state and hooks. Select `QuestEditor` and publish:
- `busy` goes `null` → `'published'` → `null`;
- `problem` holds the message, and its `kind` (e.g. `unauthorized` adds the "sign in in a new tab" link).

You can **edit state** there, for example to see the error message without breaking the network.

**Next.js keeps hidden pages alive** (React `<Activity>`). The Components tab shows them, which explains a Day 21 bug:
- *The symptom:* "Log day 2" opened day 1's filled-in form.
- *The cause:* the old editor was still mounted, only hidden.
- *The fix:* editors are keyed on their data, and clear transient state when hidden.

The **Profiler** records a session and shows which components rendered, and why.
- *Something to check with it (seen in the code, not yet measured):* typing a guild note should re-render the **whole feed** on every key, because the drafts for all items live in one state object in `GuildFeed`.
- *A fix if the feed grows:* a small component per item with its own draft state.

**Try it:**
1. Open the Profiler, record, and type a few letters into a note box on `/guild`.
2. Stop, and look at whether every feed item rendered on each keystroke, which would confirm the observation above.

## 7. Production: minified code and source maps

**The problem:** a production stack looks like `at sl (/_next/static/chunks/_02paft6omq3ya._.js:24:64)`, and React's own errors are only numbers ("Minified React error #441").

**The tools:**
- **Source maps.** `productionBrowserSourceMaps: true` in `next.config.ts` (Day 23) publishes a `.map` next to each chunk. DevTools then shows and steps through the **original** `.tsx` files even on the live site, and maps stack traces back to source.
  - *Trade-off:* it publishes the client source. Here the repository is public anyway. A private codebase would upload the maps to its error tracker instead.
  - Server code is never in them.
- **React error numbers.** Open `https://react.dev/errors/<number>` for the full message, or reproduce in `npm run dev`, where React prints the full message.
- **Production differences** need a production build. The browser tests always run `next build` + `next start`, because some bugs only exist there. Day 21 example: an "unstable value while prerendering" warning that appeared **only in the Vercel logs**, never in development.

**Try it:**
1. On the live site, open DevTools → Sources.
2. Find a page under `webpack://` / `src/`: the original files are there.
3. Set a breakpoint in `QuestEditor.tsx`, in production.

## 8. Bugs that only appear sometimes: tests, faults and the inventory

Some bugs need conditions you can't easily click: load, parallelism, a slow or dead database, a deploy in the middle of a session.

- **The inventory** (`npm run inventory`, [ERROR_INVENTORY.md](ERROR_INVENTORY.md)): 33 scenarios that each cause one failure and record what a person sees. It turned "error handling" from opinions into a table, before and after.
- **The fault proxy** (`inventory/fault-proxy.mjs`): sits between the app and Supabase, and makes the database slow, unavailable or unreachable with no change to the app. The browser tests use it too (`e2e/faults.spec.ts`).
- **Playwright's own fault tools:** `context.setOffline`, `page.route` (hang a request, answer with an HTML 500, block code chunks), and `page.clock` (move time 15 s ahead without waiting).

**Bugs found this way:**

| Bug | Found by | Root cause |
|---|---|---|
| Sign-out undid itself under load (Day 21) | parallel browser tests | NextAuth's proxy wrapper re-issued the cookie while another request was in flight |
| "Saving…" forever when offline (E-1) | inventory, `setOffline` | a rejected `fetch` skipped the reset |
| A saved quest looked like a crash (E-4) | inventory, chunks blocked with `page.route` | the reward screen's code chunk failed after a successful save |
| Pages answered 200 on errors (E-6) | inventory | streaming had already sent the status (a documented limit; see ERROR_INVENTORY.md) |
| "My sheet" missing after creating a character (Day 23, M3) | browser test | layouts persist across navigation, so a handle read in the layout went stale |
| A forged quest could be saved from another origin (E-14) | writing CORS lab case 7, then a test | a `text/plain` POST is "simple": no preflight, cookie included |
| Integration tests failed with "native WebSocket not found" (Day 23, M1) | reading the error, then `node -v` | the shell's default Node 20; supabase-js needs Node 22+ |
| "Cannot coerce the result to a single JSON object" (Day 22) | the user's screenshot plus the Network tab (406) | PostgREST `PGRST116`: the account had been deleted, by a local database reset |

**The habit:** reproduce the failure **on purpose**, keep the reproduction as a test, and only then fix it.

## 9. A checklist for any bug

1. **Reproduce it**, and write down the exact steps (or a failing test).
2. **Network tab:** was the request sent, and what came back?
3. **Console:** any red line? Click into its stack.
4. **Reference:** if the UI showed one, search the server log for it.
5. **State:** React DevTools for what the component believes.
6. **Narrow it down:** a breakpoint (conditional if it's busy), or step into the dependency.
7. **Fix, then keep the reproduction as a test.**
