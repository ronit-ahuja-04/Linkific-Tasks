# Day-02: Modern JavaScript Fundamentals & Systems Suite

**Author:** Ronit Ahuja  
**Date:** Monday, 26 October 2026  
**Documentation:** [Product Requirements Document (PRD)](PRD.md) · [System Architecture](ARCHITECTURE.md)  

---

## 1. Overview & How to Run

This repository contains learning exercises, interactive labs, and four complete client-side applications covering JavaScript fundamentals, ES6+ enhancements, DOM manipulation, and asynchronous programming.

### Running Practice Scripts
All practice scripts execute directly in Node.js (v20+):
```bash
# 1. Fundamentals
node 01-fundamentals/01-variables-and-types.js
node 01-fundamentals/02-operators-conditionals-loops.js
node 01-fundamentals/03-functions.js
node 01-fundamentals/04-es6-features.js
node 01-fundamentals/modules-demo/main.js

# 2. Array & Object exercises
node 02-array-methods/exercises.js
node 02-array-methods/object-manipulation.js

# 3. Async examples
node 04-async-examples/01-callbacks.js
node 04-async-examples/02-promises.js
node 04-async-examples/03-async-await.js
node 04-async-examples/04-fetch-api.js
node 04-async-examples/05-error-handling.js
```

### Running Interactive Web Applications
Because modern standard ES modules (`type="module"`) are used, browser projects are served over a local HTTP server:
- Open the `Day-02` folder in VS Code and launch **Live Server** (default port `5500`), or
- Run `npx serve .` inside `Day-02/`.

**Interactive Projects Hub:** [http://localhost:5500/projects/index.html](http://localhost:5500/projects/index.html)

---

## 2. Concept → Where I Used It

Every requirement concept connects directly to its real implementation in the codebase:

| Task Concept | File & Line | Description / Context |
|---|---|---|
| `let` vs `const` vs `var` | `01-fundamentals/01-variables-and-types.js:10` | Function vs block scope, Temporal Dead Zone, and `var` hoisting gotchas |
| Data types & `typeof` | `01-fundamentals/01-variables-and-types.js:49` | 7 primitives, object reference types, and `typeof null === 'object'` quirk |
| Equality (`==` vs `===`) | `01-fundamentals/01-variables-and-types.js:103` | Implicit type coercion traps (`0 == '0'`, `[] == false`) and `NaN !== NaN` |
| Operators | `01-fundamentals/02-operators-conditionals-loops.js:11` | Arithmetic, comparisons, logical operators, and nullish coalescing (`??`) |
| `switch` | `projects/typing-test/script.js:95` | Difficulty passage selection (`easy`, `medium`, `hard`) |
| 5 Loop Constructs | `01-fundamentals/02-operators-conditionals-loops.js:105-155` | `for`, `while`, `forEach`, `for...of`, `for...in` with guidelines on when to use each |
| Functions & Implicit Returns | `01-fundamentals/03-functions.js:8-55` | Declarations, expressions, single-expression arrow functions with implicit returns |
| Default & Rest Parameters | `01-fundamentals/03-functions.js:63-85` | `greet(name = 'Guest')` and rest parameter aggregator `sumNumbers(...nums)` |
| Destructuring | `04-es6-features.js:36`, `projects/pokedex/js/api.js:44` | Extracting nested fields (`sprites`, `types`, `stats`) from API payloads |
| Object Spread | `projects/habit-tracker/js/state.js:62` | Immutable state updates (`{ ...habit, checkIns: [...] }`) without in-place mutation |
| Computed Properties | `02-array-methods/object-manipulation.js:84` | Building fast $O(1)$ ID lookup dictionaries `{ [\`user_\${id}\`]: user }` |
| `map` | `02-array-methods/exercises.js:18`, `projects/typing-test/script.js:116` | Transforming arrays and wrapping characters in styled `<span>` tags |
| `filter` | `02-array-methods/exercises.js:69`, `projects/flashcards/js/deck.js:134` | Filtering arrays by category, stock status, and card study mode |
| `reduce` | `02-array-methods/exercises.js:121`, `projects/habit-tracker/js/stats.js:15` | Accumulating sums, grouping products, and computing total check-ins |
| `find` & `findIndex` | `02-array-methods/exercises.js:182`, `projects/habit-tracker/js/state.js:104` | Finding records by ID and immutable item deletion via array slicing |
| `some` & `every` | `02-array-methods/exercises.js:212`, `projects/flashcards/js/deck.js:167` | Checking stock availability and determining if all deck cards are mastered |
| Numeric `sort` | `02-array-methods/exercises.js:236` | Demonstrating UTF-16 lexical sort gotcha and providing `(a, b) => a - b` comparator |
| `Object.keys/values/entries` | `02-array-methods/object-manipulation.js:18` | Inspecting properties and rendering daily activity tables |
| Event Delegation | `03-dom-examples/dom-examples.js:174`, `projects/habit-tracker/js/main.js:98` | Handling dynamic list clicks via parent listener and `event.target.closest()` |
| `textContent` vs `innerHTML` | `03-dom-examples/dom-examples.js:46` | Preventing Cross-Site Scripting (XSS) by setting user data via `textContent` |
| `classList` API | `projects/typing-test/script.js:228` | Live character styling (`pending`, `current`, `correct`, `incorrect`) |
| Fisher–Yates Shuffle | `projects/flashcards/js/deck.js:151` | $O(n)$ unbiased random array permutation on a copy |
| Local Date Keys | `projects/habit-tracker/js/dates.js:14` | Zero UTC shifts: local `YYYY-MM-DD` formatting without `toISOString()` |
| Promise Chains & `Promise.all` | `projects/pokedex/js/main.js:58` | Browse grid pagination chained with `.then/.catch/.finally` |
| `async` / `await` | `projects/pokedex/js/main.js:94` | Structured asynchronous search handling with `try/catch/finally` |
| `response.ok` Verification | `projects/pokedex/js/api.js:25`, `04-async-examples/05-error-handling.js:25` | Explicit HTTP 404 error intercept before calling `response.json()` |

---

## 3. Interactive Applications

### 3.1 Habit Tracker with Streaks (`projects/habit-tracker`)
- **Status:** Fully Implemented (HT-1 through HT-8)
- **Features:** Add habit (1–40 chars, case-insensitive duplicate rejection), toggle check-in for today, current streak calculation (backward day cursor using `while` and `Set`), longest streak run detection, 7-day visual history dots, stats analytics (total check-ins, streak ranking, daily activity), and resilient `localStorage` storage under `day2.habits.v1`.
- **Known Limitations:** Streaks are based on single daily check-ins; multi-time daily logging is not enabled.

### 3.2 Typing Speed Test (`projects/typing-test`)
- **Status:** Fully Implemented (TT-1 through TT-8)
- **Features:** 12 original technical JavaScript passages across 3 difficulty tiers (`switch`), countdown timer triggered strictly on first input keystroke, live per-character feedback (`classList`), Net WPM and Accuracy metrics, anti-cheat clipboard paste blocking, accessible `aria-live` result announcement, and best WPM persistence under `day2.typing.best.v1`.
- **Known Limitations:** Tests run for fixed 30s or 60s countdowns; open-ended free typing mode is not enabled.

### 3.3 Pokédex Search (`projects/pokedex`)
- **Status:** Fully Implemented (PK-1 through PK-10)
- **Features:** Dual asynchronous architecture (promise chains with `Promise.all` for browse pagination; `async/await` with `try/catch/finally` for searches), in-memory `Map` cache eliminating duplicate network calls, 5 visible states (idle, loading, success, notFound, error), base stat animated progress bars, elemental type filtering, and sorting.
- **Known Limitations:** Browse grid initially queries first 20 Pokémon summaries from PokeAPI and loads details concurrently in batches.

### 3.4 Flashcards (`projects/flashcards`)
- **Status:** Fully Implemented (FC-1 through FC-9)
- **Features:** 12 starter JavaScript cards, single card viewer with accessible 3D card flip transform, immutable mastery toggle (`toggleKnown`), filter tabs (All, To Learn, Mastered) with badge counts, unbiased Fisher–Yates shuffle with Reset Order, custom card creation with validation, keyboard shortcuts (<kbd>Space</kbd> to flip, <kbd>&larr;</kbd>/<kbd>&rarr;</kbd> to navigate), and `localStorage` persistence.
- **Known Limitations:** Card editing in-place is not enabled; cards can be added and deleted.

---

## 4. What I Learned
- **Scope & Hoisting:** `var` is hoisted and initialized to `undefined`, while `let` and `const` remain in the Temporal Dead Zone (TDZ). `const` guarantees reference immutability, but object contents can still be mutated unless cloned.
- **Type Coercion:** Loose equality (`==`) can cause subtle bugs (e.g. `0 == '0'` is true, `[] == false` is true). Strict equality (`===`) should always be used.
- **Array Mechanics:** `sort()` without a comparator converts elements to strings and compares UTF-16 code points (meaning `130` comes before `44`). Always provide numeric comparators `(a, b) => a - b`.
- **Immutability:** Avoid mutating function arguments. Use object spread (`...`), `map()`, and `filter()` to produce clean new state snapshots.
- **Event Delegation:** Attaching a single listener to a parent container (`ul`) and using `event.target.closest('[data-id]')` drastically improves performance and automatically handles elements injected after page load.
- **XSS Prevention:** Never pass user-supplied data into `innerHTML`. Setting values via `textContent` ensures that HTML entities are escaped safely.
- **Local Dates vs UTC:** Using `Date.prototype.toISOString()` introduces UTC timezone offsets that shift calendar dates. Building local date strings (`getFullYear()`, `getMonth() + 1`, `getDate()`) ensures local day accuracy.
- **Dual Asynchronous Patterns:** Promise chains (`.then()`, `Promise.all()`) excel at fan-out parallel transformations, while `async/await` with `try/catch` provides linear, readable code for sequential operations.

---

## 5. Tools & Methodology
- **Architecture & Specifications:** BMAD planning workflow (`PRD.md`, `ARCHITECTURE.md`, `SUCCESS_MATRIX.md`, `GUIDELINES.md`, `FACTS.md`).
- **Coding Style:** Vanilla JavaScript (ES2020+), CSS Custom Properties, semantic HTML5 landmarks, zero build tools or dependencies.
- **Pair Programming Mentor:** AI assistant in strict Teaching Mode with milestone checkpoints and factual verification.
