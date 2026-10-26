# PRD: Day 2 – JavaScript Fundamentals & ES6+

| Field | Value |
|---|---|
| Owner | Ronit Ahuja |
| Programme | Linkific internship, Month 1 (training phase) |
| Date | Monday, 26 October 2026 |
| Repo | `Linkific-Tasks` → `Day-02/` (public, same naming style as `Day-01`) |
| Presentation | Daily Tech Meet, normally 8:00 PM (confirm in the WhatsApp group). Max 4 minutes. Submit on the dashboard **before** presenting. |
| Status | Draft v1, ready for the IDE |
| Companion docs | `ARCHITECTURE.md`, `SUCCESS_MATRIX.md`, `GUIDELINES.md` |

---

## 1. Purpose

Day 2 of the training phase covers JavaScript fundamentals, ES6+ features, DOM manipulation and async programming basics. This PRD defines what will be built so the work can be planned, built, verified and presented in a 4-minute standup.

The task suggests four example projects (todo list, form validation, weather app, quiz). Four alternatives are built instead, covering the same objectives:

| Project | ID prefix | Main skills it proves |
|---|---|---|
| Habit Tracker with Streaks | `HT` | modules, dates, arrays, `localStorage`, array methods |
| Typing Speed Test | `TT` | callbacks and timers, live events, string comparison, `switch` |
| Pokédex Search (PokeAPI) | `PK` | promises, `async/await`, `fetch`, error handling |
| Flashcards (known / unknown filter) | `FC` | array methods, state, immutability, modules |

**Instructor approval:** message Rebecca or Jiya in the Tech Team group before starting ("I'd like to build these four projects instead of the example ones, they cover the same objectives"). Status: ☐ pending.

## 2. Goals and non-goals

**Goals**
1. Demonstrate every Day 2 learning objective in running code that I can explain line by line.
2. Deliver everything in the task's deliverables list, with evidence (screenshots, commits, live demos).
3. Keep every claim in the README and in the standup verifiable against the repo.

**Non-goals**
- No frameworks or libraries (React comes later), no backend, database or authentication
- No build tools, bundlers or TypeScript
- No API keys of any kind
- No deployment required (GitHub Pages is optional)

## 3. Requirements traceability

| ID | Source | Requirement | Satisfied by |
|---|---|---|---|
| T1 | Task: learn JS basics and ES6+ | Variables (`let`/`const`/`var`), data types, operators, conditionals, loops, functions; arrow functions, template literals, destructuring, spread, rest, default parameters, object shorthand, modules | `01-fundamentals/`, then used in every project |
| D1 | Deliverable | JavaScript practice repository | `Linkific-Tasks/Day-02/` |
| D2 | Deliverable | 4 interactive JavaScript projects | `projects/*` |
| D3 | Deliverable | At least 20 array method exercises, plus object manipulation | `02-array-methods/` |
| D4 | Deliverable | DOM manipulation examples | `03-dom-examples/` and the projects |
| D5 | Deliverable | Async/await examples with API calls | `04-async-examples/` and `projects/pokedex` |
| D6 | Deliverable | README documenting all concepts learned | `Day-02/README.md` |
| P1 | Onboarding doc | Tracker sheet row for Day 2 (Date, Day, Phase, Module/Project, Task Assigned, Assigned By, Status, Hours Spent) | Google Sheet |
| P2 | Onboarding doc | Drive task folder has a file named `Day 2` | Google Drive |
| P3 | Onboarding doc | Links submitted on dashboard (Daily Task → Submission Setup → Update Links); HR and Tech have access | Dashboard |
| P4 | Standup rules | Task submitted before presenting, same day | Dashboard |
| P5 | Standup rules | Update fits within 4 minutes, with evidence ready | Daily Tech Meet |

## 4. Practice deliverables

### T1: `01-fundamentals/` (every file runs with `node <file>`)

| File | Required content |
|---|---|
| `01-variables-and-types.js` | `let`, `const`, `var` (scope and hoisting demo); all data types with `typeof`; `null` vs `undefined`; `==` vs `===` gotchas |
| `02-operators-conditionals-loops.js` | Arithmetic, comparison and logical operators; `if/else`; `switch`; ternary; `for`, `while`, `forEach`, `for...of`, `for...in` with a comment on when to use each |
| `03-functions.js` | Declaration, expression, arrow, implicit return, default parameters, rest parameters (`sum(...nums)`), a function that takes a callback |
| `04-es6-features.js` | Template literals, array and object destructuring, spread (arrays and objects), object shorthand, computed property names |
| `modules-demo/` | `math.js` exports, `main.js` imports, loaded by `index.html` with `type="module"` |

### D3: `02-array-methods/exercises.js` (21 exercises, header format `// Exercise N: title`)

| # | Method | Task |
|---|---|---|
| 1 | `map` | Square every number |
| 2 | `map` | Extract names from an array of user objects |
| 3 | `map` | Format prices with template literals, e.g. `₹499.00` |
| 4 | `map` | Add an `isAdult` flag with spread, without mutating the original |
| 5 | `filter` | Keep even numbers |
| 6 | `filter` | Products under ₹500 |
| 7 | `filter` | Remove falsy values with `filter(Boolean)` |
| 8 | `filter` | Case-insensitive search by name |
| 9 | `reduce` | Sum |
| 10 | `reduce` | Maximum value |
| 11 | `reduce` | Group products by category into an object |
| 12 | `reduce` | Word frequency count |
| 13 | `find` | Find a user by id |
| 14 | `findIndex` | Find the index, then remove the item without mutating |
| 15 | `some` | Is anything out of stock? |
| 16 | `every` | Did every student pass (marks ≥ 40)? |
| 17 | `sort` | Numbers ascending and descending (show why the default sort is wrong for numbers) |
| 18 | `sort` | Strings with `localeCompare` |
| 19 | `sort` | Objects by price, copying the array first |
| 20 | `sort` | By category, then by price |
| 21 | chain (bonus) | `filter` → `map` → `reduce` in one expression |

`02-array-methods/object-manipulation.js`:
- **O1:** `Object.keys`, `Object.values`, `Object.entries` on a product object
- **O2:** merge and override objects with spread, without mutation
- **O3:** computed property names to build a lookup object from an array

### D4: `03-dom-examples/` (one page, six labelled sections)

1. Selecting: `querySelector`, `querySelectorAll`, `getElementById`
2. Content: `textContent` vs `innerHTML`, with a demo of why user input must use `textContent`
3. Styles: `classList.add`, `remove`, `toggle`, `contains`
4. Creating and removing: `createElement`, `append`, `prepend`, `remove`
5. Events: `click`, `input`, `submit` (with `preventDefault`), `keydown`
6. Event delegation on a list whose items are added dynamically

### D5: `04-async-examples/` (Node 20 has global `fetch`, so these run with `node <file>`)

| File | Required content |
|---|---|
| `01-callbacks.js` | `setTimeout` callbacks, nested callbacks, then a refactor |
| `02-promises.js` | `new Promise`, `.then/.catch/.finally`, chaining, `Promise.all` |
| `03-async-await.js` | The same flows rewritten with `async/await`; sequential vs parallel |
| `04-fetch-api.js` | GET requests to JSONPlaceholder (`/posts`) and PokeAPI; parse JSON; log results |
| `05-error-handling.js` | `response.ok` check on a 404; simulated network failure; `try/catch/finally` |

All APIs are public and need no key.

## 5. Project specifications

Priority: **M** = Must, **S** = Should, **C** = Could.

### 5.1 Habit Tracker with Streaks (`projects/habit-tracker`)

*As a user I can track daily habits and see how many days in a row I have kept them up.*

| ID | Pri | Requirement |
|---|---|---|
| HT-1 | M | Add a habit: name trimmed, 1–40 characters, case-insensitive duplicates rejected with a visible message |
| HT-2 | M | Toggle "done today" for each habit (check and uncheck) |
| HT-3 | M | Show current streak and longest streak for each habit |
| HT-4 | M | Delete a habit |
| HT-5 | M | Persist to `localStorage`; reload restores; missing or corrupted data falls back to an empty list without crashing |
| HT-6 | M | Dates stored as local `YYYY-MM-DD` strings (never UTC `toISOString`) |
| HT-7 | S | Stats panel: total check-ins, habits ranked by current streak, check-ins per date |
| HT-8 | S | Last-7-days indicator for each habit |
| HT-9 | C | Rename a habit |
| HT-10 | C | "Reset all data" button with confirmation |

**Rules**
- *Current streak:* consecutive days with a check-in ending today. If today is not checked yet, count back from yesterday (the streak is still alive until the day ends).
- *Longest streak:* the longest run of consecutive days in the habit's history.
- *Data model:* `{ id, name, createdAt, checkIns: ['2026-10-24', ...] }` with unique, sorted date strings.

**Concepts demonstrated:** ES modules, `localStorage` with `JSON`, `find`, `some`, `filter`, `map`, `reduce`, `sort`, `Object.entries`, `for...in`, `while`, spread, destructuring, computed property names, default parameters, `classList`.

### 5.2 Typing Speed Test (`projects/typing-test`)

*As a user I can type a passage against a timer and see my speed and accuracy.*

| ID | Pri | Requirement |
|---|---|---|
| TT-1 | M | Random passage from at least 10 texts that I wrote myself, with at least 3 per level (easy, medium, hard) |
| TT-2 | M | Timer starts on the **first keystroke**, not on page load; 30 s or 60 s selectable; interval cleared on finish and restart |
| TT-3 | M | Live per-character feedback (correct, incorrect, pending) using `classList`; the current character is highlighted |
| TT-4 | M | Results when time ends or the passage is completed: WPM, accuracy %, error count |
| TT-5 | M | Restart resets state, input and timer, and picks a new passage |
| TT-6 | M | Difficulty selection implemented with a `switch` statement |
| TT-7 | S | Best WPM saved per difficulty in `localStorage` |
| TT-8 | S | Results announced in an `aria-live` region; pasting into the input is blocked |
| TT-9 | C | Live WPM while typing |

**Formulas**
- WPM = (correct characters ÷ 5) ÷ minutes elapsed
- Accuracy % = correct characters ÷ total characters typed × 100 (0 when nothing has been typed)

**Concepts demonstrated:** callbacks (`setInterval`), `input` and `keydown` events, string indexing, `switch`, `for...of`, `map`, `reduce`, `classList`.

### 5.3 Pokédex Search (`projects/pokedex`)

*As a user I can search for a Pokémon, or browse a list, and see its details.*

| ID | Pri | Requirement |
|---|---|---|
| PK-1 | M | Search by name or ID (trim and lowercase the input); the card shows name, id, sprite, types, height (m), weight (kg) and base stats |
| PK-2 | M | Visible states: idle, loading, success, not found (404), error (network or other). `response.ok` is checked before parsing |
| PK-3 | M | Browse grid of the first 20 with a "Load more" button (offset paging), built with a **promise chain** (`.then/.catch/.finally`) and `Promise.all` for the details |
| PK-4 | M | The search path uses `async/await` with `try/catch/finally` |
| PK-5 | M | In-memory `Map` cache, so repeated lookups make no new request |
| PK-6 | M | Clicking a grid card shows its detail (event delegation) |
| PK-7 | S | Filter the loaded cards by type |
| PK-8 | S | Debounced search input (a timer callback), or an explicit Search button plus the Enter key |
| PK-9 | S | Stat bars on the detail view |
| PK-10 | S | Sort loaded cards by id or name |
| PK-11 | C | Favourites saved in `localStorage` |

**API (verify against https://pokeapi.co/docs/v2 before building):**
- Detail: `https://pokeapi.co/api/v2/pokemon/{name-or-id}`. Unknown names return HTTP 404.
- List: `https://pokeapi.co/api/v2/pokemon?limit=20&offset=0` returns `{ count, next, previous, results: [{ name, url }] }`.

The two async styles are used on purpose, for learning. The README says so.

**Concepts demonstrated:** promises, `async/await`, `fetch`, `Promise.all`, `try/catch/finally`, nested destructuring, `map`, `filter`, `sort`, modules, event delegation.

### 5.4 Flashcards (`projects/flashcards`)

*As a user I can study a deck of cards and filter by what I already know.*

| ID | Pri | Requirement |
|---|---|---|
| FC-1 | M | Starter deck of at least 10 cards about JavaScript concepts, each `{ id, front, back, known }` |
| FC-2 | M | One card at a time; flip with a button (keyboard accessible); Previous and Next |
| FC-3 | M | Mark a card known or unknown using an immutable update |
| FC-4 | M | Filter: all, known, unknown; counts shown; a message when the filter has no cards |
| FC-5 | M | Shuffle on a copy of the deck using Fisher–Yates; a "reset order" action restores the original order |
| FC-6 | M | Add a card (validated) and delete a card |
| FC-7 | M | Persist to `localStorage`; "Reset deck" restores the starter cards |
| FC-8 | S | Progress "X of Y known"; a message when all cards are known (`every`) |
| FC-9 | S | Keyboard shortcuts: Space flips, arrow keys move |
| FC-10 | C | Edit a card |

**Concepts demonstrated:** ES modules, `find`, `filter`, `map`, `every`, `reduce`, spread for immutable updates, shuffle algorithm, `classList.toggle`, `localStorage`, events.

## 6. Non-functional requirements

- **Responsive:** mobile-first with `min-width` media queries; checked at 375, 768 and 1280 px; no horizontal scroll
- **Accessibility:** semantic HTML, one `h1` per page, no skipped heading levels, a `<label>` for every input, real `<button>` elements, visible `:focus-visible`, `aria-live` for status messages, `alt` on images, contrast of at least 4.5:1, `prefers-reduced-motion` respected for animations
- **Security:** no API keys; user-provided text goes through `textContent`; no inline `onclick`; no `eval`
- **Compatibility:** latest Chrome, served by VS Code Live Server (ES modules do not work from `file://`)
- **Code quality:** Prettier formatted, no console errors, `// CONCEPT:` markers where a task concept is demonstrated (see `GUIDELINES.md`)

## 7. Milestones and time boxes

These assume AI-assisted scaffolding with me reading and understanding each step. Watching tutorials (about 3–4 hours in the task) runs alongside M1, M2 and M7.

| # | Milestone | Time | Done when |
|---|---|---|---|
| M0 | Scaffold folders, `.gitignore`, `.prettierrc`, README skeleton | 0:15 | Tree matches `ARCHITECTURE.md` |
| M1 | `01-fundamentals/` | 1:00 | Every file runs with `node`, output matches comments |
| M2 | `02-array-methods/` | 0:45 | 21 exercises and 3 object exercises, all run |
| M3 | `03-dom-examples/` | 0:30 | Six sections work in the browser |
| M4 | Flashcards | 0:45 | All FC Must items pass |
| M5 | Habit Tracker | 1:00 | All HT Must items pass |
| M6 | Typing Test | 0:40 | All TT Must items pass |
| M7 | `04-async-examples/` | 0:40 | Five files run, 404 and offline cases handled |
| M8 | Pokédex | 1:00 | All PK Must items pass |
| M9 | README, screenshots, `docs/FACTS.md`, verification, push | 0:45 | `SUCCESS_MATRIX.md` complete |
| M10 | Tracker, Drive, dashboard, standup rehearsal | 0:20 | Submitted, run-through under 3:45 |

**Cut line (if time is short).** Drop from the bottom of this list first:
1. Could items, then Should items
2. Typing Test Should items, then Habit Tracker Should items
3. A whole project, only as a last resort. Present what is finished and say honestly what is not.

Never drop: D3 (the 20 exercises), the Pokédex Must items (D5), README truthfulness (D6), and P1–P5.

## 8. Risks

| Risk | Mitigation |
|---|---|
| Code I cannot explain in the standup | Teaching Mode and the explain-back checkpoint in `GUIDELINES.md` |
| README claims something the code does not do | Truthfulness rule, `// CONCEPT:` markers, verification commands in `SUCCESS_MATRIX.md` |
| Date and timezone bugs in streaks | Local date keys only, pure functions, optional `node --test` on `streaks.js` |
| API downtime or rate limits | Cache responses in a `Map`; fallback message; test the error state on purpose |
| Corrupted `localStorage` data | `try/catch` around `JSON.parse`, fall back to defaults |
| ES modules fail on `file://` | Always use Live Server |
| Running out of time | Cut line above |

## 9. Open questions

1. Folder name: `Day-02` (matches `Day-01`) or `Day 2` (matches the onboarding doc)? Default: `Day-02`.
2. The task says "JavaScript practice repository". Default: `Day-02` inside `Linkific-Tasks`, per the onboarding doc. Ask the instructors if they want a separate repo.
3. Instructor approval of the alternative projects (see section 1).
