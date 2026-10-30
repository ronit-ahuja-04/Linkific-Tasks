# Day 6 Standup Speech (4-Minute Playbook)

**Intern:** Ronit Ahuja  
**Topic:** React Hooks (`useEffect` & Custom Hooks)  
**Time Limit:** Strictly 4 Minutes

---

### [0:00 - 0:45] 1. Assigned Scope

"Good evening everyone. Today for Day 6 of my Linkific internship, my assignment was to master React side effects with `useEffect` and build reusable custom hooks completely by hand. The guardrails were strict: only `useState`, `useEffect`, and `useId` were permitted—no TanStack Query, no Axios, no external hook libraries, and zero `eslint-disable` comments. Every effect had to demonstrate an intentional trigger, an explicit action, and a bulletproof cleanup function to prevent memory leaks and race conditions."

---

### [0:45 - 1:45] 2. Completed Deliverables

"I extended our HackHQ hackathon platform into **HackHQ Live**, delivering:

1. **`useFetch` hook & Participant Directory:** Connected to DummyJSON API with accessible skeleton loading rows (`aria-busy`), authentic attendee fields, and an offline error recovery panel with a Retry button.
2. **`useDebounce` hook & Live Search:** 300ms input buffering with a derived 'Searching...' indicator that cancels superseded network queries on fast typing.
3. **User Posts Panel:** Live refetching driven by participant selection dependencies, resolving race conditions via `AbortController`.
4. **`useStopwatch` & Hack Clock:** Real-time 100ms interval timer using functional updates to prevent stale closures, complete with persistent lap recording.
5. **`useWindowSize` & Viewport Badge:** Global resize listener with cleanup that derives mobile/tablet/desktop breakpoints on the fly.
6. **`useLocalStorage` & Persistence:** Lazy state initialization with `try/catch` fallbacks, serving as a drop-in tuple swap (`[value, setValue]`) for theme, laps, and tasks.
7. **9-Pattern Showcase Panel:** Live demonstrations of mount-only, specific dependency, every-render logging, and 5 distinct cleanup patterns."

---

### [1:45 - 2:45] 3. Measurable Progress & Live Demo

_(Switch to browser demo)_
"Here in the browser:

- When I enable the **'Simulate slow network'** checkbox, you can see the skeleton loading states immediately.
- If I rapidly type into the search box, opening DevTools Network tab proves that earlier in-flight requests are marked as `cancelled` via `AbortController.abort()`.
- If I toggle DevTools to Offline, the accessible error panel surfaces with `role='alert'`. Toggling back online and clicking 'Retry' smoothly recovers the data.
- When clicking participants, their project posts load instantly without race conditions.
- The Hack Clock ticks in real-time—even under React StrictMode, it doesn't tick at double-speed because our `clearInterval` cleanup tears down the duplicate dev interval.
- When I reload the page (`Cmd+Shift+R`), my recorded laps, active theme, and tasks persist perfectly from `localStorage`."

---

### [2:45 - 3:30] 4. Biggest Challenge & Key Learning

"My biggest technical learning today was handling **asynchronous race conditions**. In data-fetching effects, network responses don't always arrive in the order they were requested. If a user clicks User 1 and quickly switches to User 2, User 1's response might arrive _after_ User 2's, overwriting the UI with stale data.

By combining `useDebounce` with `useFetch`'s `AbortController` cleanup:

1. The cleanup callback aborts the previous request signal before the new effect runs.
2. The `fetch` promise rejects with an `AbortError`, which we catch and silently ignore without setting state.
3. We derive `loading` and `data` synchronously from the target URL, guaranteeing stale data is never shown."

---

### [3:30 - 4:00] 5. Engineering Reflection & Question for Instructors

"Regarding workflow, I pair-programmed with my AI mentor following a strict plan-first protocol: I personally ran every Git mutation, PR merge, and package installation, while the agent authored code under strict scope rules. All grep checks confirm 0 forbidden hooks, 0 lint warnings, and 100% paired cleanups.

In production apps, we would typically use TanStack Query or SWR for background deduplication and window revalidation.

**My question for the instructors:** When architecting large-scale applications with TanStack Query, what is Linkific's standard practice for coordinating complex local web storage cache policies alongside server state cache invalidations?

Thank you! I am happy to take any questions."
