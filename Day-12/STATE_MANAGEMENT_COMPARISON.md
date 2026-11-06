# State management: local state, Context and Redux

Written after building the same app (FlowLane) with Redux for everything on Day 11, and with Context and Redux together on Day 12. The numbers come from those two builds and their tests.

## Short answer

| | Local state (`useState`) | Context API | Redux Toolkit |
| --- | --- | --- | --- |
| Best for | State one component (or a parent and child) uses | Global values that **change rarely** and are read widely: user, theme, language | Frequently changing shared state, async data, state read outside React |
| Re-render behaviour | Only that component and its children | **Every** consumer re-renders on any change of the value | Only components whose selected slice changed (`useSelector`) |
| Async logic | Effects in the component | Effects in the provider | Thunks, middleware, listeners |
| DevTools, time travel | React DevTools | React DevTools only | Redux DevTools: actions, diffs, replay |
| Used outside React (thunks, tests) | No | Needs a bridge | Yes, the store is a plain object |
| Boilerplate | None | Low: provider, memo, hook | Medium: store, slices, selectors |
| Bundle cost | 0 | 0 (built in) | Roughly 15 to 20 kB gzip (Redux Toolkit and react-redux) |
| Testing | Render the component | Render with the provider (Testing Library) | Plain functions, no DOM needed |

## How to choose

1. **Start with local state.** If one component needs it, keep it there (form fields, which task is being edited).
2. **Lift it, then pass props**, until the drilling hurts (more than two or three levels).
3. **Context** when many distant components read the same value and it changes rarely: the signed-in user, theme, language, feature flags.
4. **Redux** when the state changes often, many places write to it, it must be updated by code outside React (listeners, thunks), or you want middleware, optimistic updates with rollback, and time travel.
5. **Mix them.** A real app uses all three.

## Where FlowLane uses each, and why

| State | Tool | Reason |
| --- | --- | --- |
| Form fields, edit drafts | `useState` | One component |
| Signed-in user | Context | Read by almost everything, changes at sign-in and sign-out only |
| Theme | Context | One value, changes on a click |
| Language | Context | Read by every component that shows text, changes rarely |
| Open tab, modals, task panel | Redux | Code outside React reads the open tab (the chat listener decides whether to show a new-activity dot) |
| Board, projects, users, invitations, notifications | Redux | Live Firestore data from five listeners, optimistic drag and drop with rollback, many writers |

## Can they work together?

Yes, and here they do. The one thing to design is the direction of the dependency.

- **Context to Redux:** thunks cannot call `useContext`, so the AuthContext publishes the plain user to a tiny module (`lib/session.js`) and the store passes `getUser` to every thunk as its extra argument. Context is the single owner of the user; Redux only reads it.
- **Redux to Context: avoided.** Nothing in a context depends on the store. That keeps the arrow one-way and each side testable alone (the thunks are tested with a fake `getUser`, the contexts without a store).
- **Provider order** is the dependency order: the Theme provider calls `useAuth()`, so it sits inside the Auth provider.

## What Context costs, measured

**Re-renders.** Context re-renders every consumer when its value changes. In this app a test renders two components under the Theme provider and toggles the theme three times:

| Consumer | Re-renders over 3 toggles |
| --- | --- |
| Reads the theme (`useThemeState`) | 3 (it needs to) |
| Only needs the toggle function (`useThemeActions`) | **0**, because the theme context was split into state and actions |

Without the split, both would re-render every time. The fix is cheap: put values that change in one context and the stable functions in another, and memoize both values with `useMemo` and `useCallback`.

**Memoization.** Without `useMemo`, a provider that re-renders creates a new `value` object each time and re-renders all its consumers even though nothing changed. Tests assert that three renders of a provider give consumers the same object.

**When Context becomes a performance problem.** A value that changes many times a second (a drag position, a typing indicator, a chat feed), read by many components, with no way to pick a part of it. Context has no selector: a consumer gets the whole value. That is why the board and notifications are in Redux.

## Numbers from the two builds

| | Day 11 (Redux for everything) | Day 12 (Context + Redux) |
| --- | --- | --- |
| JS bundle, gzipped | 300.5 kB | 308.5 kB |
| State code for auth and theme | 2 Redux slices, 167 lines | 2 contexts, 248 lines |
| Redux slices | 8 | 6 |
| Other work in the Day 12 build | | Language switching (3 languages, 123 keys each), a reusable `Tabs` component |

The bundle grew 8 kB, which is the new language dictionaries and the Tabs component, not Context itself (Context is built into React). The Context versions of auth and theme are longer than the slices they replaced because they now also contain the Firebase sign-in logic and the profile syncing that used to live in separate listeners and thunks, so the lines moved rather than multiplied.

## Mistakes and lessons from this build

- **A context object created with `undefined` hides a missing provider.** Creating it with `null` and throwing in the custom hook turns a confusing crash into a one-line instruction.
- **Provider order is a real dependency.** Putting the Theme provider above the Auth provider fails at once with the hook's error, which a test locks in.
- **Effects that sync Context with a server need care.** The saved theme was read with a one-shot query right after sign-in, while the app was also writing the profile, so a new browser sometimes got the half-written local copy without the theme. A browser test caught it; the fix listens to the profile and applies only the server-confirmed version. The Day 11 Redux version had the same read.
- **A context that only the action needs should not re-render on state.** Splitting state and actions is the single most effective Context optimization.
- **Do not put everything in Context because it feels lighter.** The board would re-render the whole page on every card move.

## Verdict

Use Context for the small, slow-changing, widely read values, and keep the busy shared data in Redux. For a tiny app, local state plus one or two contexts is enough and Redux would be extra weight. For an app like FlowLane, with live data and optimistic writes, Redux earns its place, and Context removes the need to put the user, theme and language in it.
