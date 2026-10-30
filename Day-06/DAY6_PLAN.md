# Day 6 Master Implementation Plan: React Hooks (`useEffect` & Custom Hooks)

**Intern:** Ronit Ahuja · **Date:** Friday, 30 October 2026  
**Context:** Month 1 Training (Day 6) · **Target Application:** HackHQ Live (`hackhq-live`)  
**Mentor Pairing Model:** Plan-First · Human-Runs-Git & Installs · Truthful Teaching Mode

---

## 1. Understanding & Architectural Approach

### 1.1 Restatement (10-Line Summary)
1. Day 6 focuses on mastering React side effects using `useEffect` and building reusable custom hooks from scratch.
2. The core technical scope is strictly limited to `useState`, `useEffect`, and `useId`; external data-fetching or hooks libraries are strictly forbidden.
3. We will build an integrated dashboard featuring a debounced participant directory connected to the DummyJSON API with full abort cleanup.
4. An interactive user posts panel will demonstrate dynamic refetching driven by selection dependencies with race-condition safeguards.
5. A hackathon clock using `setInterval` with millisecond precision and lap logging will prove timer cleanup and StrictMode resilience.
6. A responsive viewport badge will showcase global DOM event subscription, cleanup, and derived breakpoint calculation.
7. Local storage persistence with safe JSON parsing and corruption fallback will persist tasks, themes, and laps.
8. A dedicated 9-pattern panel will visibly demonstrate all major `useEffect` execution lifecycles and cleanup behaviors.
9. Ronit runs all Git mutations, package installations, and manual verifications; the agent writes code and provides pre-step explanations.
10. The day concludes with rigorous verification, automated grep audits, an honest README, and a crisp 4-minute standup rehearsal.

### 1.2 Variant Recommendation
* **Recommended Variant:** **Variant A ("HackHQ Live")**
* **Rationale:**
  * **Curriculum Continuity:** Extends the HackHQ hackathon control room built on Day 5, telling a cohesive engineering story for instructors during the standup presentation.
  * **Pedagogical Impact:** Swapping Day 5's `useState` calls for `useLocalStorage` on tasks, theme, and laps demonstrates a clean drop-in replacement with identical tuple APIs (`[value, setValue]`), which is an outstanding talking point.
  * **Fallback Plan:** If Day 5 assets in `../Day-05` have unexpected broken state, we can pivot instantly to **Variant B ("Hooks Lab")** without altering any hook specifications or milestone architectures.

### 1.3 Assumptions
1. **Toolchain:** macOS Apple Silicon, zsh, Node v20.20.2, npm 10.8.2, Git 2.50.0, Vite with React (JavaScript), and React StrictMode enabled.
2. **API Access:** Public DummyJSON API (`https://dummyjson.com/users`) is accessible without authentication; JSONPlaceholder acts as an immediate fallback if DummyJSON experiences downtime.
3. **Execution Division:** Ronit executes all Git mutations (`commit`, `branch`, `push`, `pr`), package installs, and manual UI verifications; the agent creates/edits code files and performs read-only audits.
4. **Day 5 Source:** Day 5 code is located in `../Day-05` and can be copied into `Day-06/hackhq-live` during M0.
5. **Presentation Constraints:** The standup presentation is strictly 4 minutes, requiring live evidence (DevTools Network tab cancellations, StrictMode double effects, offline recovery), with tracker and Drive deliverables submitted prior to presenting.

### 1.4 Questions for Ronit
1. *Confirmation:* Are you ready to proceed with **Variant A ("HackHQ Live")** by copying Day 5's HackHQ into `Day-06/hackhq-live`, or do you prefer a clean-slate **Variant B ("Hooks Lab")**?
2. *Styling Setup:* Should we continue using Tailwind CSS (carried over from Day 5) for all new panels to maintain visual consistency?

---

## 2. Milestone Overview Table

| Milestone | Branch | Estimated Time | Primary Outputs | Done When |
|---|---|---|---|---|
| **R: Research & Notes** | *(none)* | 0:45 | Deep dive into React docs (`useEffect`, custom hooks) | Mental models for triggers, cleanup, dependency stability, and derived state documented. |
| **M0: Setup & Tooling** | `day6/setup` | 0:30 | Scaffold `hackhq-live`, install Prettier, configure scripts | `npm run lint`, `npm run build`, and `npm run format -- --check` pass cleanly with StrictMode on. |
| **M1: Data Fetching & Directory** | `day6/use-fetch` | 1:15 | `useFetch.js`, `api.js`, `Directory.jsx`, `UserRow.jsx`, `UserRowSkeleton.jsx`, `ErrorPanel.jsx`, `UserPosts.jsx` | Directory fetches on mount; skeletons show; slow network simulation works; offline error triggers with Retry; user posts refetch with abort cleanup. |
| **M2: Debounce & Search** | `day6/debounce-search` | 0:50 | `useDebounce.js`, `SearchBox.jsx` | Controlled search input debounces requests by 300ms; typing fast cancels prior requests via `AbortController`; derived "Searching..." hint displays. |
| **M3: Stopwatch & Viewport** | `day6/stopwatch-resize` | 1:00 | `useStopwatch.js`, `useWindowSize.js`, `format.js`, `HackClock.jsx`, `LapList.jsx`, `ViewportBadge.jsx` | Clock ticks accurately without double-speed under StrictMode; laps log properly; viewport badge displays dimensions and derived breakpoint; listeners clean up. |
| **M4: Persistence** | `day6/local-storage` | 0:50 | `useLocalStorage.js`, integrated persistence for tasks, theme, laps | Reloading persists tasks, theme, and stopwatch laps; corrupt storage strings fall back safely without crashing the application. |
| **M5: Effect Patterns Panel** | `day6/effect-patterns` | 0:45 | `EffectPatterns.jsx` (9 interactive pattern cards) | All 9 `useEffect` patterns demonstrate mount, update, render logging, and cleanup without illegal synchronous `setState` in render. |
| **M6: Documentation & Evidence** | `day6/readme` | 0:50 | `README.md`, `docs/FACTS.md`, screenshots, standup script | All grep audits pass 0 errors; README links are relative and truthful; manual test script verified; standup script rehearsed. |
| **P1: Production Extras (Optional)** | `day6/extras` | 0:40 | Pagination (`PD-6`), cross-tab storage sync (`LS-3`), visibility pause | Directory paginates cleanly; updating state in one tab syncs across tabs; stopwatch auto-pauses when browser tab is hidden. |

---

## 3. Milestone Execution Details

### Milestone R: Foundational Research & Mental Models
* **Objective:** Read the 4 core react.dev documentation pages: *Synchronizing with Effects*, *You Might Not Need an Effect*, *useEffect Reference*, and *Reusing Logic with Custom Hooks*.
* **Files Created by Agent:** None (interactive discussion and concept notes).
* **Commands Run by Ronit:** None.
* **Agent Verification:** Review understanding of effect triggers, race condition anatomy, and custom hook encapsulation.
* **Explain-Back Questions:**
  1. *What is the fundamental difference between rendering code and an effect?* (Rendering calculates UI based on props/state and must be pure; effects run after paint to synchronize with external systems).
  2. *Why does React StrictMode run effects twice on mount in development?* (To detect missing cleanup functions and unsafe side effects by simulating immediate unmount/remount).
  3. *When should you NOT use an effect?* (When calculating derived state from props/state, or handling user interaction events that belong in event handlers).

---

### Milestone M0: Setup, Tooling & Baseline Verification
* **Scope:** Branch `day6/setup`. Copy Day 5 HackHQ to `Day-06/hackhq-live` (or scaffold Vite React app), install Prettier as a dev dependency, add format script, verify strict baseline.
* **Files Created/Edited by Agent:**
  * `Day-06/hackhq-live/package.json` (add prettier devDependency & format script)
  * `Day-06/hackhq-live/.prettierrc` (standard configuration)
* **Commands Run by Ronit:**
  ```bash
  # Step 1: Switch to main, pull latest, and branch
  git switch main && git pull
  git switch -c day6/setup

  # Step 2: Copy Day 5 app into hackhq-live (if Variant A)
  cp -r ../Day-05/hackhq hackhq-live
  cd hackhq-live
  # (Expected: directory hackhq-live populated with package.json, src/, etc.)

  # Step 3: Install Prettier as devDependency
  npm install -D prettier
  # (Expected: added 1 package, package.json and package-lock.json updated)

  # Step 4: Verify baseline checks
  npm run lint
  npm run build
  npm run format -- --check
  # (Expected: lint passes with 0 errors, build completes, format check reports status)

  # Step 5: Commit changes
  git status
  git add package.json package-lock.json .prettierrc
  git diff --staged
  git commit -m "chore: add Day 6 app"
  git commit -m "chore: add prettier and format script"

  # Step 6: Push and open PR
  git push -u origin day6/setup
  # (Expected: Branch day6/setup pushed to origin)
  ```
* **Agent Read-Only Verification:**
  * Run `git status` and `git log --oneline -2` to confirm clean tree and commit hygiene.
  * Run `npm ls --depth=0` to ensure prettier is installed as a devDependency.
  * Run `npm run lint` and `npm run build` to confirm clean baseline.
* **Explain-Back Questions:**
  1. *Why must Prettier be a devDependency rather than a production dependency?* (Prettier is a build-time code styling tool not needed by the client bundle in production).
  2. *What does StrictMode in main.jsx do to our application lifecycle?* (Wraps root in `<React.StrictMode>`, intentionally double-invoking component renders and effects in development to catch side-effect bugs).
  3. *One thing Ronit explains alone:* The purpose of checking `npm run build` before pushing any branch.

---

### Milestone M1: Data Fetching, Cleanup & Directory Panels
* **Scope:** Branch `day6/use-fetch`. Implement `useFetch` with `AbortController`, API utility, directory list with skeletons, offline error panel with Retry, and user posts panel refetching on user selection.
* **Files Created/Edited by Agent:**
  * `src/lib/api.js` (`BASE_URL`, pure `buildUsersUrl`, `buildUserPostsUrl`)
  * `src/hooks/useFetch.js` (`useFetch` hook with `AbortController` and safe state setting)
  * `src/components/directory/UserRowSkeleton.jsx` (accessible skeleton rows with `aria-busy`)
  * `src/components/directory/UserRow.jsx` (avatar, name, email, age)
  * `src/components/directory/ErrorPanel.jsx` (`role="alert"` and Retry button)
  * `src/components/directory/UserPosts.jsx` (posts for selected user with loading/empty/error states)
  * `src/components/directory/Directory.jsx` (orchestrates list, slow-network simulation, selection)
  * `src/App.jsx` (mounts Directory and UserPosts)
* **Commands Run by Ronit:**
  ```bash
  # Step 1: Switch to main, pull, create branch
  git switch main && git pull
  git switch -c day6/use-fetch

  # Commit 1: useFetch hook
  git status
  git add src/hooks/useFetch.js src/lib/api.js
  git diff --staged
  git commit -m "feat: add useFetch hook with abort cleanup"

  # Commit 2: Participants directory
  git status
  git add src/components/directory/Directory.jsx src/components/directory/UserRow.jsx src/components/directory/UserRowSkeleton.jsx src/components/directory/ErrorPanel.jsx
  git diff --staged
  git commit -m "feat: add participants directory with loading and error states"

  # Commit 3: User posts panel
  git status
  git add src/components/directory/UserPosts.jsx src/App.jsx
  git diff --staged
  git commit -m "feat: add user posts panel that refetches on user change"

  # Step 2: Verification and Push
  npm run lint && npm run build
  git push -u origin day6/use-fetch
  ```
* **Agent Read-Only Verification:**
  * Check that `useFetch.js` has `new AbortController()` and `.abort()` in cleanup.
  * Check that `useEffect(async` does NOT appear anywhere.
  * Check that `response.ok` check is present and `AbortError` is silently caught.
  * Verify `npm run lint` has 0 errors.
* **Explain-Back Questions:**
  1. *Why does fetch not reject on HTTP 404 or 500 responses?* (`fetch` only rejects on network failure; HTTP status codes must be checked via `response.ok`).
  2. *What exactly happens when controller.abort() runs during cleanup?* (The browser cancels the in-flight network request, throwing an `AbortError`, preventing state updates on unmounted or stale components).
  3. *One thing Ronit explains alone:* How `selectedUserId` being passed into `useFetch` triggers an automatic refetch without manual event listeners.

---

### Milestone M2: Debounced Search & Fast Typing Safeguards
* **Scope:** Branch `day6/debounce-search`. Implement `useDebounce`, controlled search input, derived "Searching..." hint, and verified cancellation of in-flight requests.
* **Files Created/Edited by Agent:**
  * `src/hooks/useDebounce.js` (debounce hook with `setTimeout` & `clearTimeout`)
  * `src/components/directory/SearchBox.jsx` (controlled input, debounced query, `aria-live` hint)
  * `src/components/directory/Directory.jsx` (integrates debounced search with `buildUsersUrl`)
* **Commands Run by Ronit:**
  ```bash
  # Step 1: Switch to main, pull, create branch
  git switch main && git pull
  git switch -c day6/debounce-search

  # Commit 1: useDebounce hook
  git status
  git add src/hooks/useDebounce.js
  git diff --staged
  git commit -m "feat: add useDebounce hook"

  # Commit 2: Debounced participant search
  git status
  git add src/components/directory/SearchBox.jsx src/components/directory/Directory.jsx
  git diff --staged
  git commit -m "feat: add debounced participant search"

  # Step 2: Verification and Push
  npm run lint && npm run build
  git push -u origin day6/debounce-search
  ```
* **Agent Read-Only Verification:**
  * Verify `useDebounce.js` clears timeout in its cleanup function.
  * Verify that "Searching..." indicator is derived via `query !== debouncedQuery` and NOT stored in redundant state.
  * Verify Network tab cancellations in DevTools when typing rapidly.
* **Explain-Back Questions:**
  1. *How does useDebounce prevent overwhelming the backend API?* (Resets the timer on every keystroke cleanup; only when the user stops typing for 300ms does `setTimeout` fire and update the debounced value).
  2. *Why is the 'Searching...' indicator derived rather than saved in useState?* (Because `query !== debouncedQuery` is synchronous and directly computable from existing state, avoiding unnecessary re-renders and out-of-sync bugs).
  3. *One thing Ronit explains alone:* The synergy between `useDebounce` and `AbortController` in preventing race conditions.

---

### Milestone M3: Stopwatch, Viewport Badge & Event Listeners
* **Scope:** Branch `day6/stopwatch-resize`. Implement `useStopwatch` with functional state updates, `useWindowSize` with listener cleanup, `formatElapsed` helper, `HackClock`, `LapList`, and `ViewportBadge`.
* **Files Created/Edited by Agent:**
  * `src/lib/format.js` (`formatElapsed` formatting milliseconds as `mm:ss.t`)
  * `src/hooks/useStopwatch.js` (`useStopwatch` hook with `setInterval`, `clearInterval`)
  * `src/hooks/useWindowSize.js` (`useWindowSize` with `resize` listener and stable reference cleanup)
  * `src/components/clock/LapList.jsx` (renders lap items)
  * `src/components/clock/HackClock.jsx` (display, Start, Pause, Reset, Lap)
  * `src/components/layout/ViewportBadge.jsx` (screen dimensions and derived breakpoint)
  * `src/App.jsx` (integrates Clock and ViewportBadge)
* **Commands Run by Ronit:**
  ```bash
  # Step 1: Switch to main, pull, create branch
  git switch main && git pull
  git switch -c day6/stopwatch-resize

  # Commit 1: useStopwatch hook
  git status
  git add src/hooks/useStopwatch.js src/lib/format.js
  git diff --staged
  git commit -m "feat: add useStopwatch hook"

  # Commit 2: Hack clock with laps
  git status
  git add src/components/clock/HackClock.jsx src/components/clock/LapList.jsx src/App.jsx
  git diff --staged
  git commit -m "feat: add hack clock with laps"

  # Commit 3: useWindowSize and ViewportBadge
  git status
  git add src/hooks/useWindowSize.js src/components/layout/ViewportBadge.jsx src/App.jsx
  git diff --staged
  git commit -m "feat: add useWindowSize hook and viewport badge"

  # Step 2: Verification and Push
  npm run lint && npm run build
  git push -u origin day6/stopwatch-resize
  ```
* **Agent Read-Only Verification:**
  * Check that `useStopwatch` uses `setElapsed(prev => prev + 100)` to eliminate stale closure bugs.
  * Check that `useWindowSize` cleanup removes the exact same handler reference.
  * Verify that StrictMode does not cause double-speed ticking.
* **Explain-Back Questions:**
  1. *What is a stale closure in a setInterval effect and how does a functional state update fix it?* (An effect closing over `elapsed` captures its initial value forever; `setElapsed(prev => prev + 100)` receives the fresh state directly from React at execution time).
  2. *Why must removeEventListener receive the exact same function instance as addEventListener?* (Anonymous arrow functions create unique references; removing an inline arrow function fails silently, leaking memory).
  3. *One thing Ronit explains alone:* Why the stopwatch breakpoint (mobile/tablet/desktop) is derived during render rather than placed in state.

---

### Milestone M4: Local Storage Persistence & Drop-in Replacement
* **Scope:** Branch `day6/local-storage`. Implement `useLocalStorage` with lazy initialization, error-safe `try/catch`, and replace `useState` for tasks, theme, and laps.
* **Files Created/Edited by Agent:**
  * `src/hooks/useLocalStorage.js` (`useLocalStorage` hook with tuple API)
  * `src/App.jsx` (swap `useState` for `useLocalStorage` on tasks, theme, and laps)
  * `src/components/clock/HackClock.jsx` (persisted laps)
* **Commands Run by Ronit:**
  ```bash
  # Step 1: Switch to main, pull, create branch
  git switch main && git pull
  git switch -c day6/local-storage

  # Commit 1: useLocalStorage hook
  git status
  git add src/hooks/useLocalStorage.js
  git diff --staged
  git commit -m "feat: add useLocalStorage hook with safe parsing"

  # Commit 2: State persistence integration
  git status
  git add src/App.jsx src/components/clock/HackClock.jsx
  git diff --staged
  git commit -m "feat: persist app state with useLocalStorage"

  # Step 2: Verification and Push
  npm run lint && npm run build
  git push -u origin day6/local-storage
  ```
* **Agent Read-Only Verification:**
  * Confirm lazy initializer `useState(() => ...)` is used so `localStorage.getItem` is only called on initial mount.
  * Verify `try/catch` surrounds both read and write operations.
  * Confirm that setting corrupted JSON in DevTools does not crash the app on reload.
* **Explain-Back Questions:**
  1. *Why should localStorage reading be done in a lazy state initializer instead of directly in the component body?* (Component bodies re-execute on every render; reading localStorage synchronously every render causes severe I/O performance degradation).
  2. *What happens if localStorage is full or disabled by private browsing?* (Our `try/catch` block catches `QuotaExceededError` or security exceptions, logs a warning, and allows the in-memory state to work normally without crashing).
  3. *One thing Ronit explains alone:* How `useLocalStorage` provides the exact same `[value, setValue]` tuple as `useState`, enabling a 1-line refactor.

---

### Milestone M5: Comprehensive 9-Pattern Effect Showcase
* **Scope:** Branch `day6/effect-patterns`. Implement `EffectPatterns.jsx` presenting all 9 core effect patterns (EP-1 through EP-9) in an interactive card grid.
* **Files Created/Edited by Agent:**
  * `src/components/patterns/EffectPatterns.jsx` (9 pattern demonstrations with clear explanations)
  * `src/App.jsx` (mounts EffectPatterns panel)
* **Commands Run by Ronit:**
  ```bash
  # Step 1: Switch to main, pull, create branch
  git switch main && git pull
  git switch -c day6/effect-patterns

  # Commit 1: Effect patterns panel
  git status
  git add src/components/patterns/EffectPatterns.jsx src/App.jsx
  git diff --staged
  git commit -m "feat: add effect patterns panel"

  # Step 2: Verification and Push
  npm run lint && npm run build
  git push -u origin day6/effect-patterns
  ```
* **Agent Read-Only Verification:**
  * Verify that no demo calls `setState` synchronously in an effect body.
  * Verify the "every render" demo only logs to console or sets `document.title`.
  * Verify that all 5 cleanup patterns link directly to the custom hooks implemented.
* **Explain-Back Questions:**
  1. *What happens if you call setState unconditionally in an effect with no dependency array?* (It triggers an immediate re-render, which runs the effect again, triggering another re-render, creating an infinite freeze/crash loop).
  2. *Why should multiple independent concerns use separate useEffect calls rather than one giant effect?* (Separation of concerns: each effect synchronizes one specific resource with its own distinct dependencies and cleanup cycle).
  3. *One thing Ronit explains alone:* The exact lifecycle sequence during a component re-render when dependencies change (render -> previous cleanup runs -> new effect runs).

---

### Milestone M6: Documentation, Audits, Evidence & Standup
* **Scope:** Branch `day6/readme`. Create `docs/FACTS.md`, complete `README.md`, run verification suite, capture evidence, and draft the 4-minute standup speech.
* **Files Created/Edited by Agent:**
  * `docs/FACTS.md` (verified technical metrics, lines of code, test passes)
  * `README.md` (concept guide, hook table, architecture diagrams, running instructions)
  * `docs/STANDUP.md` (word-for-word 4-minute presentation script based strictly on repo facts)
* **Commands Run by Ronit:**
  ```bash
  # Step 1: Switch to main, pull, create branch
  git switch main && git pull
  git switch -c day6/readme

  # Commit 1: Documentation and facts sheet
  git status
  git add README.md docs/FACTS.md docs/STANDUP.md
  git diff --staged
  git commit -m "docs: add README with hooks concepts and file map"

  # Commit 2: Screenshots and visual evidence (after capturing)
  git status
  git add docs/screenshots/
  git diff --staged
  git commit -m "docs: add screenshots"

  # Step 2: Verification and Push
  npm run lint && npm run build && npm run format -- --check
  git push -u origin day6/readme
  ```
* **Agent Read-Only Verification:**
  * Run all forbidden hook grep checks: `useReducer`, `useContext`, `useRef`, `useMemo`, `useCallback`, `useLayoutEffect`.
  * Run forbidden library grep checks: `tanstack`, `swr`, `axios`, `redux`, `zustand`, etc.
  * Run search for unfulfilled `TODO` or `PASTE` placeholders.
* **Explain-Back Questions:**
  1. *Why did we build useFetch by hand instead of using TanStack Query in production?* (To master the lower-level mechanics of request lifecycles, race conditions, AbortControllers, and cleanup before adopting abstractions).
  2. *How do relative paths protect documentation integrity on GitHub?* (Absolute paths like `file:///` break on any other machine or inside web browsers; relative paths navigate cleanly within the repository).
  3. *One thing Ronit explains alone:* The full verification evidence demonstrating how each of the 5 custom hooks cleans up resources.

---

### Milestone P1: Production Extras (Optional / Stretch)
* **Scope:** Branch `day6/extras`. Implement directory pagination (`PD-6`), cross-tab storage synchronization (`LS-3`), and document visibility tab pausing.
* **Files Created/Edited by Agent:**
  * `src/components/directory/Directory.jsx` (pagination controls: Previous, Next, Page Indicator)
  * `src/lib/api.js` (support for `skip` and `limit`)
  * `src/hooks/useLocalStorage.js` (`window.addEventListener('storage', ...)` sync)
  * `src/hooks/useStopwatch.js` (`document.addEventListener('visibilitychange', ...)` auto-pause)
* **Commands Run by Ronit:**
  ```bash
  git switch main && git pull
  git switch -c day6/extras
  git status
  git add src/components/directory/Directory.jsx src/lib/api.js
  git commit -m "feat: add participants directory pagination"
  git add src/hooks/useLocalStorage.js
  git commit -m "feat: add cross-tab synchronization to useLocalStorage"
  npm run lint && npm run build
  git push -u origin day6/extras
  ```
* **Agent Read-Only Verification:**
  * Verify storage listener is removed in `useLocalStorage` cleanup.
  * Verify pagination buttons are disabled at boundaries (`skip === 0` and `skip + limit >= total`).

---

## 4. Complete Commit Plan

| # | Milestone | Branch | Commit Message (Conventional Commits) | Target Files | Key Concept Taught |
|---|---|---|---|---|---|
| 1 | M0 | `day6/setup` | `chore: add Day 6 app` | Scaffold / Day 5 copy | Clean project setup with StrictMode enabled |
| 2 | M0 | `day6/setup` | `chore: add prettier and format script` | `package.json`, `.prettierrc` | DevDependency management and code style enforcement |
| 3 | M1 | `day6/use-fetch` | `feat: add useFetch hook with abort cleanup` | `src/hooks/useFetch.js`, `src/lib/api.js` | Declarative data fetching, AbortController, cleanup function, race condition prevention |
| 4 | M1 | `day6/use-fetch` | `feat: add participants directory with loading and error states` | `src/components/directory/*` | Asynchronous UI states (skeletons, error panels, retry triggers) |
| 5 | M1 | `day6/use-fetch` | `feat: add user posts panel that refetches on user change` | `src/components/directory/UserPosts.jsx` | Dependency-driven refetching `[url]`, dependent queries, fast-switching race safety |
| 6 | M2 | `day6/debounce-search` | `feat: add useDebounce hook` | `src/hooks/useDebounce.js` | Timer-based side effects, timer cleanup via `clearTimeout`, debounce logic |
| 7 | M2 | `day6/debounce-search` | `feat: add debounced participant search` | `src/components/directory/SearchBox.jsx` | Controlled inputs, derived UI state ("Searching..."), search synchronization |
| 8 | M3 | `day6/stopwatch-resize` | `feat: add useStopwatch hook` | `src/hooks/useStopwatch.js`, `src/lib/format.js` | Interval timers, functional state updates `prev => prev + 100`, `clearInterval` cleanup |
| 9 | M3 | `day6/stopwatch-resize` | `feat: add hack clock with laps` | `src/components/clock/*` | Complex timer UI, lap state management, millisecond precision formatting |
| 10 | M3 | `day6/stopwatch-resize` | `feat: add useWindowSize hook and viewport badge` | `src/hooks/useWindowSize.js`, `src/components/layout/ViewportBadge.jsx` | Global DOM event listeners, `removeEventListener` reference stability, derived breakpoints |
| 11 | M4 | `day6/local-storage` | `feat: add useLocalStorage hook with safe parsing` | `src/hooks/useLocalStorage.js` | Lazy state initialization, `try/catch` JSON serialization, Web Storage sync |
| 12 | M4 | `day6/local-storage` | `feat: persist app state with useLocalStorage` | `src/App.jsx`, `src/components/clock/HackClock.jsx` | Drop-in tuple swap of `useState` with `useLocalStorage` for tasks, theme, laps |
| 13 | M5 | `day6/effect-patterns` | `feat: add effect patterns panel` | `src/components/patterns/EffectPatterns.jsx` | 9 `useEffect` lifecycle patterns, dependency array semantics, avoiding infinite loops |
| 14 | M6 | `day6/readme` | `docs: add README with hooks concepts and file map` | `README.md`, `docs/FACTS.md`, `docs/STANDUP.md` | Accurate technical documentation, hook concept map, truthfulness verification |
| 15 | M6 | `day6/readme` | `docs: add screenshots` | `docs/screenshots/*` | Visual verification evidence and presentation materials |
| 16 | P1 | `day6/extras` | `feat: add participants directory pagination` | `src/components/directory/Directory.jsx`, `src/lib/api.js` | Paginated API queries via skip/limit parameters |
| 17 | P1 | `day6/extras` | `feat: add cross-tab synchronization to useLocalStorage` | `src/hooks/useLocalStorage.js` | `StorageEvent` listener and cross-tab multi-window state synchronization |

---

## 5. Pull Request (PR) Plan

| PR # | Branch | Title | Description Outline | Merge Method |
|---|---|---|---|---|
| **PR 1** | `day6/setup` | `Setup: Vite React scaffold, StrictMode, and Prettier formatting` | Sets up the Day 6 project structure, verifies StrictMode baseline, and configures Prettier with lint/format scripts. | Create a merge commit |
| **PR 2** | `day6/use-fetch` | `Feature: useFetch hook, participants directory, and posts panel` | Implements hand-crafted `useFetch` with `AbortController` cleanup, skeleton states, error recovery panel, and dynamic post refetching. | Create a merge commit |
| **PR 3** | `day6/debounce-search` | `Feature: useDebounce hook and debounced participant search` | Adds `useDebounce` with `clearTimeout` cleanup, integrates 300ms delayed search, and adds derived "Searching..." indicator. | Create a merge commit |
| **PR 4** | `day6/stopwatch-resize` | `Feature: useStopwatch, useWindowSize, hack clock, and viewport badge` | Implements interval stopwatch with functional updates, resize listener with cleanup, lap logging, and responsive viewport badge. | Create a merge commit |
| **PR 5** | `day6/local-storage` | `Feature: useLocalStorage hook and persistent state` | Implements error-safe `useLocalStorage` and performs drop-in replacement for tasks, theme, and laps. | Create a merge commit |
| **PR 6** | `day6/effect-patterns` | `Feature: 9-pattern useEffect reference panel` | Adds interactive panel demonstrating all 9 lifecycle patterns and cleanup variations without synchronous setState anti-patterns. | Create a merge commit |
| **PR 7** | `day6/readme` | `Docs: Comprehensive hooks README, facts sheet, and evidence` | Completes technical documentation, hooks concept map, audit tables, screenshots, and 4-minute standup speech. | Create a merge commit |
| **PR 8** *(Opt)* | `day6/extras` | `Feature: Pagination and cross-tab storage sync` | Adds directory pagination controls and window storage event synchronization for multi-tab state. | Create a merge commit |

---

## 6. Deep Hook Specifications

### Hook 1: `useFetch(url)`
* **File:** `src/hooks/useFetch.js`
* **Signature:** `useFetch(url)` returning `{ data, loading, error, refetch }`
* **Concept Tag:** `// CONCEPT: useFetch - declarative data fetching with AbortController cleanup`
* **Dependencies:** `[url, reloadKey]`
* **Effect Action:**
  1. If `url` is falsy, set state to `{ data: null, loading: false, error: null }` and return.
  2. Create `const controller = new AbortController()`.
  3. Initiate async fetch with `{ signal: controller.signal }`.
  4. Check `response.ok`; if false, throw `new Error(\`HTTP error \${response.status}\`)`.
  5. Parse JSON and set `{ data: json, loading: false, error: null }`.
  6. In `catch (err)`: if `err.name === 'AbortError'`, ignore silently; otherwise set `{ data: null, loading: false, error: err.message }`.
* **Cleanup:** `controller.abort()`
* **Edge Cases & Guardrails:**
  * **ESLint `set-state-in-effect` rule:** We avoid calling `setLoading(true)` synchronously inside the effect body. Instead, we structure state as `{ fetchKey, data, error, isFetching }` or derive loading state via `currentUrl !== loadedUrl` to strictly adhere to React Hooks ESLint rules without disable comments.
  * Never show stale data from previous URL while new URL is loading.
  * No `async` effect callback: wrap inside an internal `fetchData()` function.

### Hook 2: `useDebounce(value, delay = 300)`
* **File:** `src/hooks/useDebounce.js`
* **Signature:** `useDebounce(value, delay = 300)` returning `debouncedValue`
* **Concept Tag:** `// CONCEPT: useDebounce - timer-based rate limiting with clearTimeout cleanup`
* **Dependencies:** `[value, delay]`
* **Effect Action:**
  * Create `const timerId = setTimeout(() => setDebouncedValue(value), delay)`.
* **Cleanup:** `clearTimeout(timerId)`
* **Edge Cases & Guardrails:**
  * Rapid typing cancels each pending timer before it fires; only the final settled value is propagated.
  * Immediate teardown if component unmounts before delay expires.

### Hook 3: `useStopwatch()`
* **File:** `src/hooks/useStopwatch.js`
* **Signature:** `useStopwatch()` returning `{ elapsed, running, start, pause, reset }`
* **Concept Tag:** `// CONCEPT: useStopwatch - interval timer with functional update and clearInterval cleanup`
* **Dependencies:** `[running]`
* **Effect Action:**
  * If `running` is false, do nothing.
  * If `running` is true, create `const intervalId = setInterval(() => setElapsed(prev => prev + 100), 100)`.
* **Cleanup:** `clearInterval(intervalId)`
* **Edge Cases & Guardrails:**
  * **Stale Closure Avoidance:** Uses functional update `prev => prev + 100` so `setInterval` never depends on a stale closure of `elapsed`.
  * **StrictMode Safety:** Mounting twice in dev runs cleanup immediately, ensuring exactly one active interval exists and preventing double-speed clock ticking.
  * **Documented Limitation:** Documents honesty in README regarding drift over long durations versus timestamp differences (`Date.now()`).

### Hook 4: `useWindowSize()`
* **File:** `src/hooks/useWindowSize.js`
* **Signature:** `useWindowSize()` returning `{ width, height }`
* **Concept Tag:** `// CONCEPT: useWindowSize - global window resize subscription with removeEventListener cleanup`
* **Dependencies:** `[]` (mount once)
* **Effect Action:**
  * Initialize state lazily via `() => ({ width: window.innerWidth, height: window.innerHeight })`.
  * Define named handler `const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight })`.
  * Attach: `window.addEventListener('resize', handleResize)`.
* **Cleanup:** `window.removeEventListener('resize', handleResize)`
* **Edge Cases & Guardrails:**
  * Stable function reference ensures listener is cleanly unregistered on unmount.
  * Breakpoints (`mobile < 768`, `tablet 768-1023`, `desktop >= 1024`) are derived during render, avoiding duplicate state synchronization.

### Hook 5: `useLocalStorage(key, initialValue)`
* **File:** `src/hooks/useLocalStorage.js`
* **Signature:** `useLocalStorage(key, initialValue)` returning `[storedValue, setValue]`
* **Concept Tag:** `// CONCEPT: useLocalStorage - Web Storage synchronization with lazy init and try/catch`
* **Dependencies:** `[key, storedValue]`
* **Effect Action:**
  * **Initial Read:** Lazy state initializer `useState(() => { try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : initialValue; } catch { return initialValue; } })`.
  * **Write Effect:** Inside `useEffect([key, storedValue])`:
    * If `storedValue === undefined`, do not store.
    * `try { localStorage.setItem(key, JSON.stringify(storedValue)); } catch (e) { console.error(e); }`.
* **Cleanup:** Clean unmount handling; in P1, removes `storage` event listener.
* **Edge Cases & Guardrails:**
  * Missing or corrupt data in localStorage falls back to `initialValue` without throwing.
  * Supports functional updates `setValue(prev => ...)` identically to React's standard `useState`.

---

## 7. Traceability Matrix

| Requirement ID | Requirement Description | Implementation Location | Proven By |
|---|---|---|---|
| **V-1** | Watch useEffect and custom hooks tutorials | `README.md` (Learning Log), Tracker row | Verified tracker time & resource titles |
| **V-2** | Read 4 react.dev documentation pages | Milestone R, `docs/FACTS.md` | Milestone R completion & explain-back |
| **SE-1** | Understand side effects and when to use `useEffect` | `README.md` Concepts Section | Detailed documentation on external synchronization |
| **EF-1** | Basic syntax and lifecycle equivalent | `EffectPatterns.jsx` (EP-1), `README.md` | Card EP-1 mounting/unmounting demonstration |
| **EF-2** | Dependency array variations (empty, none, specific) | `EffectPatterns.jsx` (EP-1, EP-2, EP-3, EP-4) | Interactive counter and title synchronization |
| **CU-1** | Rationale for cleanup & preventing memory leaks | `README.md`, `EffectPatterns.jsx` | Documented teardown cycles and DevTools verification |
| **CU-2** | Clear timers, unsubscribe events, cancel requests | `useDebounce`, `useStopwatch`, `useWindowSize`, `useFetch` | Explicit grep matching setup/cleanup pairs |
| **DF-1** | Fetch on mount, loading, error, display, refetch | `useFetch.js`, `Directory.jsx`, `UserPosts.jsx` | Live UI walkthrough with slow-network simulation |
| **API-1** | Fetch GET requests, display data, loading/error | `src/lib/api.js`, `Directory.jsx` | DummyJSON API integration and error handling |
| **CH-1** | When to extract custom hooks, `use` prefix, returns | `src/hooks/*.js`, `README.md` | 5 distinct custom hook modules in `src/hooks/` |
| **CH-2** | Create `useFetch` and `useLocalStorage` hooks | `useFetch.js`, `useLocalStorage.js` | Dedicated hooks created and integrated |
| **PR-1** | User list from an API | `Directory.jsx`, `UserRow.jsx` | 10 participants rendered with avatars and info |
| **PR-2** | Search with debouncing | `SearchBox.jsx`, `useDebounce.js` | 300ms pause before query triggers |
| **PR-3** | Timer/stopwatch with `setInterval` | `HackClock.jsx`, `useStopwatch.js` | Real-time stopwatch with lap list |
| **PR-4** | LocalStorage persistence with `useEffect` | `useLocalStorage.js`, `App.jsx` | Tasks, theme, and laps survive reload |
| **PR-5** | Window resize listener | `ViewportBadge.jsx`, `useWindowSize.js` | Window width/height badge and breakpoint update |
| **D1** | React application using `useEffect` | `hackhq-live` / `hooks-lab` | grep confirms active `useEffect` usage |
| **D2** | Data fetching from public API | DummyJSON (`https://dummyjson.com/users`) | Network tab requests to DummyJSON |
| **D3** | Loading and error state handling | `UserRowSkeleton.jsx`, `ErrorPanel.jsx` | Skeleton rows and offline error recovery |
| **D4** | `useEffect` cleanup examples | All 5 hooks & `EffectPatterns.jsx` | Grep verification of all cleanup APIs |
| **D5** | At least 2 custom hooks created | `src/hooks/` directory | 5 custom hooks implemented (exceeds 2) |
| **D6** | Reusable `useFetch` hook | `Directory.jsx`, `UserPosts.jsx` | Both components reuse the single `useFetch` hook |
| **D7** | Demonstrating all `useEffect` patterns | `EffectPatterns.jsx` (EP-1 to EP-9) | Interactive 9-pattern panel in UI |
| **D8** | README explaining hooks concepts | `README.md` | Comprehensive documentation matching code facts |
| **PD-1** | Skeletons & `aria-busy` during load | `Directory.jsx`, `UserRowSkeleton.jsx` | Accessibility inspection on loading container |
| **PD-2** | Render avatar (`alt`), name, email, age | `UserRow.jsx` | Verified fields from DummyJSON API |
| **PD-3** | Error panel with specific message & Retry | `ErrorPanel.jsx` | `role="alert"` and functioning `refetch` button |
| **PD-4** | Empty state when search returns nothing | `Directory.jsx` | Contextual empty search UI |
| **PD-5** | "Simulate slow network" checkbox (`delay=1000`) | `Directory.jsx`, `api.js` | Query parameter appended, skeletons visible |
| **PD-6** | Pagination with `skip` and `total` (P1) | `Directory.jsx`, `api.js` | Next/Prev pagination functional |
| **SR-1** | 300ms debounced search input | `SearchBox.jsx`, `useDebounce.js` | Request fires only 300ms after user pauses |
| **SR-2** | "Searching..." derived hint | `SearchBox.jsx` | Visible while `query !== debouncedQuery` |
| **SR-3** | Whitespace-only or empty query handling | `src/lib/api.js` | Resets to standard 10-user list |
| **SR-4** | Out-of-order race safety on fast typing | `useFetch.js`, `useDebounce.js` | In-flight network requests visibly cancelled |
| **UP-1** | Clicking user fetches `/users/{id}/posts` | `UserPosts.jsx` | Dependency change triggers fetch |
| **UP-2** | Posts loading, error, empty, title, tags | `UserPosts.jsx` | All post states reachable and formatted |
| **UP-3** | Fast clicking never shows wrong user posts | `useFetch.js`, `UserPosts.jsx` | Verified with rapid clicking under slow network |
| **CK-1** | Elapsed `mm:ss.t`, Start, Pause, Reset | `HackClock.jsx`, `format.js` | Tested against real clock (10 seconds) |
| **CK-2** | Lap button appends `{ id, ms }` & persists | `HackClock.jsx`, `useLocalStorage.js` | Laps persist across page refreshes |
| **CK-3** | Interval cleared on pause/reset/unmount | `useStopwatch.js` | Zero active timers after pause/unmount |
| **VP-1** | Viewport width x height & derived breakpoint | `ViewportBadge.jsx`, `useWindowSize.js` | Live badge updates during browser window resize |
| **LS-1** | Persist tasks, theme, laps | `App.jsx`, `HackClock.jsx` | Data persists across page reloads |
| **LS-2** | Fallback gracefully on corrupt storage data | `useLocalStorage.js` | Invalid JSON in DevTools doesn't crash app |
| **LS-3** | Sync across browser tabs via storage event (P1) | `useLocalStorage.js` | Multi-tab changes synchronize automatically |
| **EP-1..9** | Nine core effect patterns | `EffectPatterns.jsx` | All 9 cards interactive and documented |
| **NFR-1** | Responsive at 375, 768, 1280px without scroll | Full UI Layout | Tested via DevTools Device Toolbar |
| **NFR-2** | Keyboard operable, ARIA live hints, alerts | Full UI Accessibility | Accessible tab traversal and screen-reader tags |
| **NFR-3** | Zero console errors/warnings in StrictMode | Console inspection | Clean dev console logs |
| **NFR-4** | `npm run lint` 0 errors, no disable comments | ESLint configuration | Passes automated lint audit |
| **NFR-5** | `npm run build` succeeds; Prettier formats | Vite & Prettier scripts | Clean build and format check |
| **NFR-6** | Only allowed hooks and no forbidden libraries | Grep verification checks | Grep checks return 0 matches |
| **NFR-7** | Truthful README with relative paths | `README.md` | Clean relative links and verified code claims |

---

## 8. Risks, Gotchas & The Cut Line

### 8.1 Technical Risks & Playbook
1. **API Rate Limiting / Downtime:**
   * *Risk:* DummyJSON is temporarily unreachable or blocked.
   * *Mitigation:* `src/lib/api.js` has a pre-built fallback switch to JSONPlaceholder (`https://jsonplaceholder.typicode.com/users`).
2. **StrictMode Double Invocations:**
   * *Risk:* Double fetching or initial logs in console cause confusion.
   * *Mitigation:* StrictMode mount-unmount-mount cycle is intentional; robust cleanup (`controller.abort()`, `clearInterval`) ensures zero adverse side effects.
3. **ESLint `set-state-in-effect` Warnings:**
   * *Risk:* Newer ESLint rules flag setting loading state synchronously inside `useEffect`.
   * *Mitigation:* We never use `eslint-disable`. We derive loading states or structure state objects `{ fetchKey, data, error }` so state is updated solely inside async callbacks.
4. **Git Branching / Commit Discrepancies:**
   * *Risk:* Accidental batch commits or untracked file leaks.
   * *Mitigation:* Ronit runs `git status` and `git diff --staged` before every single commit; agent verifies with read-only commands.

### 8.2 Prioritized Cut Line (Scope Management)
If project time is constrained, scope will be pared down in strict adherence to Section 8:
* **Drop First (P1 Extras):**
  1. Tab visibility auto-pausing for HackClock.
  2. Cross-tab `storage` event synchronization (`LS-3`).
  3. Directory pagination (`PD-6`).
* **Drop Second (M5 Secondary Demos):**
  * Simplify `EffectPatterns.jsx` to focus strictly on EP-1 through EP-4, pointing cards EP-5 through EP-9 directly to the live custom hook implementations.
* **NON-NEGOTIABLE CORE (Never Dropped):**
  * `useFetch` with `AbortController` cancellation.
  * Directory loading skeletons and offline error panel with Retry.
  * At least two additional custom hooks (`useDebounce`, `useLocalStorage`).
  * Strict adherence to allowed hooks (`useState`, `useEffect`, `useId`).
  * Automated grep audits, truthful README, and Process deliverables (Tracker, Drive, Dashboard).

---

## 9. Manual Test Script (Verification Checklist)

Ronit will execute these 10 manual verification steps before final submission:
1. **Initial Mount:** Directory loads 10 users from DummyJSON; skeleton rows display first (enhanced with the "Simulate slow network" toggle).
2. **Debounced Search:** Typing "emily" in the search box pauses 300ms before requesting; clearing the input immediately restores the initial directory.
3. **Request Cancellation:** Rapidly typing characters visibly aborts prior requests in DevTools Network tab (`cancelled` status), and final results match the exact final input.
4. **Error Recovery:** Setting DevTools to "Offline" triggers the accessible error panel (`role="alert"`); toggling back online and clicking "Retry" successfully fetches the data.
5. **Selection Refetching:** Clicking a participant loads their posts in the User Posts panel; rapidly clicking multiple users aborts pending fetches without race conditions.
6. **Clock & Interval Accuracy:** HackClock starts, pauses, resets, and logs laps in real-time speed (verified against a phone timer for 10 seconds; no double-speed under StrictMode).
7. **Resize & Breakpoints:** Resizing browser window dynamically updates width/height badge and breakpoint label (mobile / tablet / desktop).
8. **Storage Persistence:** Modifying tasks, toggling theme, and recording laps persists across hard browser refreshes (`Cmd+Shift+R`).
9. **Corruption Resilience:** Manually modifying localStorage in DevTools Application tab with corrupted JSON strings (`"{bad:json"`) falls back to default state on reload without crashing.
10. **Clean Teardown:** Navigating between panels leaves zero lingering intervals or listeners, and console contains zero warnings or errors.

