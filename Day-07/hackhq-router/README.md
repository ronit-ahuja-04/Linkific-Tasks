# HackHQ Live — React Hooks Mastery (`useEffect` & Custom Hooks)

**Day 6 Project:** Linkific Month 1 Training  
**Author:** Ronit Ahuja  
**Baseline Stack:** React 19, Vite, Tailwind CSS, Prettier, ESLint  
**Scope Guardrails:** `useState`, `useEffect`, and `useId` only. No external hook or data libraries. Zero `eslint-disable` comments.

---

## 1. Overview & Architecture

HackHQ Live is an interactive hackathon mission-control dashboard demonstrating how React components synchronize with external browser and network systems using `useEffect` and handcrafted custom hooks.

```
hackhq-live/
├── docs/
│   ├── FACTS.md                # Verified metrics, grep audits, and StrictMode facts
│   └── STANDUP.md              # Rehearsed 4-minute standup speech for instructors
├── src/
│   ├── App.jsx                 # Dashboard shell integrating live stations and persistent state
│   ├── main.jsx                # Application root with React StrictMode enabled
│   ├── hooks/                  # Five handcrafted custom hooks
│   │   ├── useFetch.js         # Declarative API fetching with AbortController cleanup
│   │   ├── useDebounce.js      # Input buffering with clearTimeout cleanup
│   │   ├── useStopwatch.js     # 100ms interval timer with clearInterval cleanup
│   │   ├── useWindowSize.js    # Resize event subscription with removeEventListener cleanup
│   │   └── useLocalStorage.js  # Web Storage persistence with lazy init and cross-tab sync
│   ├── lib/
│   │   ├── api.js              # Pure URL builder functions for DummyJSON API
│   │   └── format.js           # Millisecond elapsed time formatter (mm:ss.t)
│   └── components/
│       ├── directory/          # Directory, SearchBox, UserRow, Skeleton, ErrorPanel, UserPosts
│       ├── clock/              # HackClock, LapList
│       ├── layout/             # ViewportBadge
│       └── patterns/           # 9-Pattern Effect Showcase
```

> **Note on TanStack Query vs. Handcrafted Hooks:**  
> In production React applications, data fetching is commonly handled by enterprise libraries such as TanStack Query or SWR, which offer automatic cache management, deduplication, and window-focus refetching. In this project, `useFetch` was built from scratch to master the lower-level mechanics of request lifecycles, race conditions, cleanup teardown, and `AbortController` cancellation.

---

## 2. Core Concepts: `useEffect` Mental Models

### What is a Side Effect?

In React, rendering must remain a pure calculation: given the same props and state, JSX output should be identical with zero observable side effects during render. A **side effect** is any operation that reaches outside the pure rendering phase to interact with an external system—such as HTTP network calls, browser DOM manipulation, timers, subscriptions, or `localStorage`.

### When NOT to Use `useEffect`

Following the _You Might Not Need an Effect_ guidelines:

1. **Transforming data for render:** Calculated directly during rendering (e.g. filtering a list from search input).
2. **Handling user interaction events:** Executed inside event handlers (`onClick`, `onSubmit`), not in effects.
3. **Derived state:** Synchronous values computed from existing props or state should never be copied into redundant state variables via effects.

### The Dependency Array Matrix

The dependency array tells React when to skip running the effect by checking dependencies with `Object.is`:

| Signature                    | When it Runs                              | Cleanup Timing                                     | Primary Use Case                                         |
| ---------------------------- | ----------------------------------------- | -------------------------------------------------- | -------------------------------------------------------- |
| `useEffect(fn, [])`          | Once after initial mount                  | Runs on unmount                                    | Subscribing to global events, mounting singletons        |
| `useEffect(fn, [a, b])`      | On mount, and whenever `a` or `b` changes | Runs before re-executing effect, and on unmount    | Syncing with props/state, fetching parameterized queries |
| `useEffect(fn)` _(no array)_ | After **every** render pass               | Runs before each subsequent render, and on unmount | Logging, profiling, imperative DOM sync                  |

### Why Cleanup Functions Prevent Memory Leaks & Bugs

When a component unmounts or its dependencies update, outstanding operations must be safely dismantled:

- **Timers:** Active `setInterval` or `setTimeout` calls continue ticking in the browser background if not cleared via `clearInterval` / `clearTimeout`.
- **Event Listeners:** Global listeners attached to `window` or `document` leak memory and hold references to stale component scopes if not removed via `removeEventListener`.
- **Network Requests:** In-flight HTTP requests can resolve after a component has unmounted or switched parameters. Aborting them via `AbortController.abort()` prevents updating state with stale or discarded data (eliminating race conditions).

---

## 3. Handcrafted Custom Hook Inventory

All 5 custom hooks live in `src/hooks/` and are annotated with searchable `// CONCEPT:` tags:

| Hook              | File                                               | Concept Tag                | Parameters          | Returns                                     | Cleanup Mechanism                                          |
| ----------------- | -------------------------------------------------- | -------------------------- | ------------------- | ------------------------------------------- | ---------------------------------------------------------- |
| `useFetch`        | [useFetch.js](src/hooks/useFetch.js)               | `CONCEPT: useFetch`        | `url: string`       | `{ data, loading, error, refetch }`         | `controller.abort()` cancels in-flight fetch               |
| `useDebounce`     | [useDebounce.js](src/hooks/useDebounce.js)         | `CONCEPT: useDebounce`     | `value, delay=300`  | `debouncedValue`                            | `clearTimeout(timerId)` resets countdown                   |
| `useStopwatch`    | [useStopwatch.js](src/hooks/useStopwatch.js)       | `CONCEPT: useStopwatch`    | _none_              | `{ elapsed, running, start, pause, reset }` | `clearInterval(intervalId)` prevents duplicate intervals   |
| `useWindowSize`   | [useWindowSize.js](src/hooks/useWindowSize.js)     | `CONCEPT: useWindowSize`   | _none_              | `{ width, height }`                         | `removeEventListener('resize', fn)` using stable reference |
| `useLocalStorage` | [useLocalStorage.js](src/hooks/useLocalStorage.js) | `CONCEPT: useLocalStorage` | `key, initialValue` | `[storedValue, setStoredValue]`             | `removeEventListener('storage', fn)` for cross-tab sync    |

---

## 4. Feature Highlights

### 1. Participant Directory & Posts Panel

- Fetches attendee data declaratively from DummyJSON API (`https://dummyjson.com/users`).
- Accessible loading skeletons with `aria-busy="true"`.
- Error panel with accessible alert semantics (`role="alert"`) and a working **Retry** trigger.
- **Simulate slow network** toggle (`delay=1000`) for easy standup demonstration.
- Selecting any attendee fetches their posts from `/users/{id}/posts` using dependency-driven refetching. Rapid selection switches cancel earlier requests safely via `AbortController`.

### 2. 300ms Debounced Search Box

- Rate-limits typing keystrokes via `useDebounce`.
- Derives a live "Searching..." indicator with `aria-live="polite"` directly from `query !== debouncedQuery`.
- Empty queries reset the directory list without network overhead.

### 3. Hackathon Clock & Viewport Diagnostics

- Millisecond-precision stopwatch formatted as `mm:ss.t` with functional state updates (`prev => prev + 100`) preventing stale closures.
- Verified StrictMode resilience: does not run at double-speed in development.
- Lap logging with persistent storage.
- Floating `ViewportBadge` displaying live window dimensions and render-derived responsive breakpoints (`mobile < 768px`, `tablet 768-1023px`, `desktop ≥ 1024px`).

### 4. LocalStorage State Persistence

- Drop-in tuple replacement (`[value, setValue]`) for theme, stopwatch laps, and checklist tasks.
- Lazy state initialization ensures disk I/O only runs once on initial mount.
- Protected by `try/catch` wrappers: corrupt JSON strings in DevTools fall back gracefully to default values without crashing (`LS-2`).
- Synchronizes across browser tabs via the window `storage` event (`LS-3`).

### 5. 9-Pattern Effect Reference Panel

Interactive catalog demonstrating:

- **EP-1:** Run once on mount (`[]`) with StrictMode double-run logging.
- **EP-2:** Specific dependencies (`[count]`) synchronizing `document.title`.
- **EP-3:** Every-render diagnostic logging (explaining why `setState` here causes infinite loops).
- **EP-4:** Multiple effects separating independent concerns.
- **EP-5 to EP-9:** Five distinct cleanup teardown mechanisms.

---

## 5. Verification & Testing

Every metric has been audited against real repository files (see [docs/FACTS.md](docs/FACTS.md)):

```bash
# 1. Verify zero forbidden hooks (expect empty output)
grep -rnE "useReducer|useContext|useRef|useMemo|useCallback|useLayoutEffect" src

# 2. Verify zero forbidden libraries in package.json (expect empty output)
grep -nE "tanstack|swr|axios|redux|zustand" package.json

# 3. Verify zero eslint-disable comments (expect empty output)
grep -rn "eslint-disable" src

# 4. Verify no async effect callbacks (expect empty output)
grep -rnE "useEffect\(async" src

# 5. Verify timer and listener cleanup pairs in hooks
grep -rnE "setInterval|setTimeout|addEventListener|new AbortController" src/hooks
grep -rnE "clearInterval|clearTimeout|removeEventListener|\.abort\(\)" src/hooks

# 6. Run format check, lint, and build
npm run format -- --check
npm run lint
npm run build
```

---

## 6. Running the Application Locally

```bash
# Clone the repository
git clone https://github.com/ronit-ahuja-04/Linkific-Tasks.git
cd Linkific-Tasks/Day-06/hackhq-live

# Install dependencies
npm install --legacy-peer-deps

# Run the development server
npm run dev

# Run linting and formatting audits
npm run lint
npm run format -- --check

# Build for production
npm run build
```
