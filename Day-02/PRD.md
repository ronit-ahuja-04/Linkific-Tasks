# Product Requirements Document (PRD): Day-02 Systems Suite

**Author:** Ronit Ahuja  
**Date:** Monday, 26 October 2026  
**Status:** Implemented & Verified  
**Runtime:** Modern Browsers (ES2020+ ES Modules) & Node.js 20+  
**Architecture Spec:** [ARCHITECTURE.md](ARCHITECTURE.md)  

---

## 1. Overview & Purpose

The Day-02 suite is a comprehensive, production-grade Vanilla JavaScript project ecosystem built entirely without third-party frameworks, bundlers, or component libraries. It delivers:

1. **Foundational Curriculum (`01`–`04`)**:
   - Deep algorithmic coverage of core JavaScript mechanics (scope, hoisting, closures, data types, control flow).
   - 21 discrete array method transformations and object manipulation exercises.
   - Low-level imperative DOM manipulation and event delegation patterns.
   - Comprehensive asynchronous programming patterns (callbacks, Promises, `Promise.all`, `async/await`, error handling).

2. **4 Production Web Applications (`projects/`)**:
   - Four standalone, fully interactive client-side web applications demonstrating unidirectional state flow, immutable updates, local storage persistence, responsive ergonomics, and hardware-accelerated 3D CSS rendering:
     - **JavaScript Flashcards** (`projects/flashcards/`)
     - **Daily Habit Tracker** (`projects/habit-tracker/`)
     - **Typing Speed Test** (`projects/typing-test/`)
     - **Pokédex Specimen Explorer** (`projects/pokedex/`)
   - A unified, interactive **Applications Directory Hub** (`projects/index.html`).

---

## 2. Goals & Non-Goals

### 2.1 Goals
- Implement every requirement with zero runtime dependencies (Pure Vanilla JS, HTML5, CSS3).
- Strict adherence to the **Zero Dynamic `innerHTML`** security policy to prevent XSS vulnerabilities.
- Unidirectional data flow: State is the single source of truth; the DOM is purely a projection.
- Viewport ergonomics: High-density layout calibrated so that all primary interfaces and action controls fit above the fold on 13"/14" laptop viewports (600px–800px height).
- 100% verifiable functionality through automated Node.js execution and local HTTP browser tests.

### 2.2 Non-Goals
- No third-party UI component libraries (Bootstrap, Tailwind, Material UI).
- No frontend frameworks (React, Vue, Angular).
- No server-side databases or backend runtimes (client-side `localStorage` and public REST APIs only).
- No private API keys or authenticated third-party services.

---

## 3. Core Curriculum Specifications (`01`–`04`)

### 3.1 `01-fundamentals/` (Core Language Mechanics)
- **`01-variables-and-types.js`**:
  - Variable declarations (`let`, `const`, `var`), function vs. block scope, Temporal Dead Zone (TDZ).
  - Primitive types (`string`, `number`, `boolean`, `null`, `undefined`, `symbol`, `bigint`) and reference types (`object`, `array`, `function`).
  - Strict equality (`===`) vs. abstract equality (`==`) with implicit type coercion edge cases.
- **`02-operators-conditionals-loops.js`**:
  - Arithmetic, assignment, logical (`&&`, `||`, `??`), and bitwise operators.
  - Branching control flow: `if/else`, ternary operator, `switch` statement with fallthrough control.
  - 5 looping constructs: classic `for`, `while`, `do...while`, `for...of` (iterables), `for...in` (object keys).
- **`03-functions.js`**:
  - Function declarations, function expressions, concise/block arrow functions, implicit returns.
  - Default parameters, rest parameters (`...args`), higher-order functions accepting callbacks.
- **`04-es6-features.js`**:
  - Template literals with multi-line expressions.
  - Array and object destructuring with default fallbacks and property renaming.
  - Spread operator (`...`) for shallow copies, object shorthand, and computed property keys.
- **`modules-demo/`**:
  - Native browser ES Modules runtime demonstration (`index.html` loading `main.js` with `type="module"` importing named functions from `math.js`).

### 3.2 `02-array-methods/` (Algorithmic Transformations)
- **`exercises.js` (21 Exercises)**:
  - `map`: Element squaring, property extraction from object arrays, currency formatting, non-mutating object tagging.
  - `filter`: Even number filtering, numeric price thresholding, truthy compacting (`filter(Boolean)`), case-insensitive substring search.
  - `reduce`: Sum accumulation, maximum value discovery, grouping by category into a hash map, token frequency counting.
  - `find` / `findIndex`: Specimen retrieval by ID, immutable element removal via index slicing.
  - `some` / `every`: Inventory stock assertions, collective threshold validation (e.g. passing marks).
  - `sort`: Numeric comparison gotchas (`(a, b) => a - b`), string collation with `localeCompare`, multi-tier sorting (category then price).
  - Chaining: Fluent composition (`filter` $\rightarrow$ `map` $\rightarrow$ `reduce`) in a single declarative expression.
- **`object-manipulation.js`**:
  - `Object.keys()`, `Object.values()`, `Object.entries()` transformation and key iteration.
  - Immutable object merging and property overriding via spread syntax.

### 3.3 `03-dom-examples/` (DOM Manipulation & Events)
- Dynamic element creation (`document.createElement()`) and hierarchical node mounting (`appendChild()`).
- Safe text population strictly via `.textContent`.
- Interactive class toggling (`classList.add()`, `.remove()`, `.toggle()`).
- Event handling with `addEventListener()`, event propagation inspection, and dynamic DOM cleanup.

### 3.4 `04-async-examples/` (Asynchronous Runtime Control)
- **`01-callbacks.js`**: Asynchronous execution queues, callback nesting, and inversion of control.
- **`02-promises.js`**: Promise states (`pending`, `fulfilled`, `rejected`), `.then()`, `.catch()`, `.finally()`.
- **`03-async-await.js`**: Sequential and concurrent `async/await` syntax, error handling with `try/catch`.
- **`04-fetch-api.js`**: HTTP GET requests to public REST endpoints (JSONPlaceholder), status validation (`response.ok`), and JSON parsing.
- **`05-error-handling.js`**: Network failure defense, HTTP 404/500 handling, and graceful UI degradation.

---

## 4. Flagship Web Applications Specifications

### 4.1 Application 1: JavaScript Flashcards (`projects/flashcards/`)

| ID | Requirement | Implementation Detail |
|---|---|---|
| **FC-1** | Pre-loaded Starter Deck | 12 architectural cards covering JS principles (scope, event loop, arrays, async). |
| **FC-2** | 3D Spatial Flip Transform | Hardware-accelerated CSS 3D flip (`perspective: 1200px`, `transform-style: preserve-3d`, `rotateY(180deg)`). |
| **FC-3** | Card Mastery Tracking | Independent `known: boolean` state per card; updates memory and `localStorage` immutably. |
| **FC-4** | Study Filter System | Filter tabs: `All Cards`, `To Learn`, `Mastered` with live counter badges. |
| **FC-5** | Fisher–Yates Shuffle | Uniform unbiased $O(n)$ array permutation on a cloned deck; "Reset Order" restores initial state. |
| **FC-6** | Custom Card Authoring | Validated input form enabling users to append custom flashcards into the active deck. |
| **FC-7** | Keyboard Accessibility | <kbd>Space</kbd> flips the card; <kbd>&larr;</kbd> and <kbd>&rarr;</kbd> navigate between cards. |
| **FC-8** | Viewport Ergonomics | Compact vertical hierarchy (card scene 210px) keeping all navigation buttons above the fold. |

### 4.2 Application 2: Daily Habit Tracker (`projects/habit-tracker/`)

| ID | Requirement | Implementation Detail |
|---|---|---|
| **HT-1** | Creation & Validation | Habit text validation (1–40 characters), whitespace trimming, case-insensitive deduplication. |
| **HT-2** | Daily Toggle Action | One-click check-in toggle for the current calendar date (`YYYY-MM-DD`). |
| **HT-3** | Backward Streak Engine | Algorithmic backward date traversal (`while` loop + `Set`) calculating Current and Longest streaks. |
| **HT-4** | Local Date Arithmetic | Strict local date formatting (`getFullYear()`, `getMonth() + 1`, `getDate()`) avoiding `toISOString()` UTC rollover bugs. |
| **HT-5** | 7-Day Visual Matrix | Interactive dot grid showing completion status over the last 7 calendar days. |
| **HT-6** | Productivity Statistics | Aggregated metrics displaying total completions across all habits and streak leaderboard rankings. |
| **HT-7** | Immutable Deletion | Habit removal via non-mutating `filter()`, updating state and persistence immediately. |

### 4.3 Application 3: Typing Speed Test (`projects/typing-test/`)

| ID | Requirement | Implementation Detail |
|---|---|---|
| **TT-1** | Engineering Passages | 12 technical software passages across 3 difficulty tiers (`Easy`, `Medium`, `Hard`). |
| **TT-2** | First-Keystroke Timer | Timer remains armed on load and begins countdown exclusively upon the user's first keystroke. |
| **TT-3** | Character Tokenizer | Real-time DOM span analysis tagging characters: `.char-correct`, `.char-incorrect`, `.char-current`, `.char-pending`. |
| **TT-4** | Net WPM Metric | Calculated as $\max(0, [(\text{Total Chars} / 5) - \text{Errors}] / \text{Time in Minutes})$. |
| **TT-5** | Anti-Cheat Guard | Clipboard paste events on the input area are intercepted and prevented via `e.preventDefault()`. |
| **TT-6** | Best Score Persistence | Personal best Net WPM score stored in `localStorage` (`day2.typing.best.v1`) and displayed in the HUD. |

### 4.4 Application 4: Pokédex Specimen Explorer (`projects/pokedex/`)

| ID | Requirement | Implementation Detail |
|---|---|---|
| **PK-1** | Dual Async Strategy | `Promise.all` + promise chains for catalog browsing; `async/await` + `try/catch` for specimen search. |
| **PK-2** | In-Memory `Map` Cache | Network responses cached in a memory `Map` (`cache.set(name, data)`), eliminating duplicate requests. |
| **PK-3** | 5 Distinct UI States | Explicit rendering for `idle`, `loading`, `success`, `notFound`, and `error` states. |
| **PK-4** | Event Delegation Grid | Grid item click handling via single parent listener using `event.target.closest('[data-id]')`. |
| **PK-5** | Visual Base Stats Bars | Horizontal progress bars displaying HP, Attack, Defense, Sp. Atk, Sp. Def, and Speed. |

---

## 5. Non-Functional & Quality Standards

1. **Security**:
   - Zero dynamic `innerHTML` on any user or API-sourced data.
   - All text content rendered through `.textContent`.
   - No inline `onclick` handlers or `eval()` execution.
2. **Accessibility (a11y)**:
   - Full keyboard navigation (focus rings, <kbd>Tab</kbd>, <kbd>Enter</kbd>, <kbd>Space</kbd>, arrow keys).
   - Dynamic status updates communicated through `role="status"` and `aria-live="polite"`.
   - Explicit `<label>` elements for every input; `alt` attributes on all rendered images.
   - WCAG AA contrast ratio (> 4.5:1) across all text elements.
3. **Responsive Design**:
   - Mobile-first architecture with `min-width` media queries (375px, 640px, 768px, 1024px).
   - Zero horizontal scrollbars across all screen widths.
4. **Resilient Storage**:
   - `try/catch` wrapping around all `localStorage` reads and writes, providing graceful in-memory fallbacks when storage is unavailable or corrupted.

---

## 6. Verification Commands

All core exercises and modules execute cleanly with Node.js 20+:

```bash
# 1. Fundamentals
node 01-fundamentals/01-variables-and-types.js
node 01-fundamentals/02-operators-conditionals-loops.js
node 01-fundamentals/03-functions.js
node 01-fundamentals/04-es6-features.js

# 2. Array & Object Exercises (21 exercises)
node 02-array-methods/exercises.js
node 02-array-methods/object-manipulation.js

# 3. Asynchronous Examples
node 04-async-examples/01-callbacks.js
node 04-async-examples/02-promises.js
node 04-async-examples/03-async-await.js
node 04-async-examples/04-fetch-api.js
node 04-async-examples/05-error-handling.js
```

All 5 web endpoints resolve with HTTP 200 over a local HTTP server:
- Applications Hub: `http://localhost:5500/projects/index.html`
- Flashcards: `http://localhost:5500/projects/flashcards/index.html`
- Habit Tracker: `http://localhost:5500/projects/habit-tracker/index.html`
- Typing Test: `http://localhost:5500/projects/typing-test/index.html`
- Pokédex: `http://localhost:5500/projects/pokedex/index.html`
