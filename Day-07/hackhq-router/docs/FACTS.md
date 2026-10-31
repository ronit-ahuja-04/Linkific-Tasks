# Day 6 Verified Facts Sheet

**Project:** HackHQ Live (`hackhq-live`)  
**Audit Date:** Friday, 30 October 2026  
**Auditor:** Automated read-only audit suite & pair-programming mentor

---

## 1. Verified Codebase Metrics

| Metric                        | Measured Value                                                                          | Verification Command                                                                                 | Status             |
| ----------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------ |
| **Custom Hooks Created**      | 5 files (`useFetch`, `useDebounce`, `useStopwatch`, `useWindowSize`, `useLocalStorage`) | `ls src/hooks`                                                                                       | Verified           |
| **Allowed Hooks Used**        | `useState`, `useEffect`, `useId` only                                                   | `grep -rnE "useReducer\|useContext\|useRef\|useMemo\|useCallback\|useLayoutEffect" src` -> 0 matches | Verified (Pass)    |
| **Forbidden Libraries**       | 0 external data/state libraries (TanStack, SWR, Axios, Redux, Zustand, etc.)            | `grep -nE "tanstack\|swr\|axios\|redux\|zustand" package.json` -> 0 matches                          | Verified (Pass)    |
| **`eslint-disable` Comments** | 0 comments                                                                              | `grep -rn "eslint-disable" src` -> 0 matches                                                         | Verified (Pass)    |
| **Async Effect Callbacks**    | 0 forbidden `useEffect(async` calls                                                     | `grep -rnE "useEffect\(async" src` -> 0 matches                                                      | Verified (Pass)    |
| **Timer / Listener Teardown** | 5 setup calls matching 5 cleanup calls                                                  | `grep -rnE "setInterval\|setTimeout\|addEventListener\|new AbortController" src/hooks` vs cleanups   | 100% paired (Pass) |
| **ESLint Audit**              | 0 errors, 0 warnings                                                                    | `npm run lint`                                                                                       | Verified (Pass)    |
| **Production Build**          | Complete client bundle built in ~268ms                                                  | `npm run build`                                                                                      | Verified (Pass)    |
| **Prettier Formatting**       | All matched files use Prettier style                                                    | `npm run format -- --check`                                                                          | Verified (Pass)    |

---

## 2. Concept Tag Audit (`// CONCEPT:`)

Every hook and core pattern is marked with a searchable concept comment:

| Tag                        | File                                         | Verified Line                                                               |
| -------------------------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| `CONCEPT: useFetch`        | `src/hooks/useFetch.js`                      | Line 10: declarative data fetching with AbortController cleanup             |
| `CONCEPT: useDebounce`     | `src/hooks/useDebounce.js`                   | Line 12: timer-based rate limiting with clearTimeout cleanup                |
| `CONCEPT: useStopwatch`    | `src/hooks/useStopwatch.js`                  | Line 19: interval timer with functional update and clearInterval cleanup    |
| `CONCEPT: useWindowSize`   | `src/hooks/useWindowSize.js`                 | Line 10: global window resize subscription with removeEventListener cleanup |
| `CONCEPT: useLocalStorage` | `src/hooks/useLocalStorage.js`               | Line 15: Web Storage synchronization with lazy init and try/catch           |
| `CONCEPT: EP-1`            | `src/components/patterns/EffectPatterns.jsx` | Line 10: Run once effect (`[]`)                                             |
| `CONCEPT: EP-2`            | `src/components/patterns/EffectPatterns.jsx` | Line 40: Specific dependencies (`[ep2Count]`)                               |
| `CONCEPT: EP-3`            | `src/components/patterns/EffectPatterns.jsx` | Line 47: Every render effect (no dependency array)                          |

---

## 3. Architecture & StrictMode Facts

1. **React StrictMode:** Enabled in `src/main.jsx`. All timers (`useStopwatch`), listeners (`useWindowSize`), and fetch requests (`useFetch`) cleanly survive StrictMode's mount-unmount-mount development lifecycle without double-ticking, memory leaks, or stale state overrides.
2. **Why `useFetch` was written by hand:** In production, libraries like TanStack Query or SWR handle caching, request deduplication, and window-focus refetching. We implemented `useFetch` manually to understand the underlying mechanics of effect synchronization, cleanup triggers, `AbortController` cancellation, and race condition prevention.
3. **Data Integrity:** Sample tasks (`STARTER_TASKS`) and simulated attendees originate from DummyJSON (`https://dummyjson.com/users`). Stored state uses browser `localStorage`.
