# PRD: HackHQ, a hackathon control room (Day 5: React State & Event Handling)

| Field          | Value                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Owner          | Ronit Ahuja                                                                                                                          |
| Programme      | Linkific internship, Month 1 (training phase), Day 5                                                                                 |
| Date           | Thursday, 29 October 2026                                                                                                            |
| Repo path      | `Linkific-Tasks/Day-05/hackhq`                                                                                                       |
| Presentation   | Daily Tech Meet, normally 8:00 PM (confirm in the WhatsApp group). Maximum 4 minutes. Submit on the dashboard **before** presenting. |
| Companion docs | `Day5_DESIGN_SPEC.md`, `Day5_TECH_STACK_AND_ARCHITECTURE.md`, `Day5_MILESTONES.md`, `Day5_AI_ASSISTANT_GUIDE.md`                     |

---

## 1. Summary

HackHQ is a single-page control room for the day of a hackathon. An organizer counts people in, works through a setup checklist, registers teams, and sells swag at a pop-up counter. Each of those jobs is one of the five projects the Day 5 task asks for, so the whole app is the deliverable, not a pile of separate demos:

| Day 5 project                                | HackHQ station                         |
| -------------------------------------------- | -------------------------------------- |
| Counter with increment and decrement         | **Check-in**: people inside the venue  |
| Todo list (add, delete, toggle)              | **Checklist**: setup tasks for the day |
| Form with multiple inputs and validation     | **Teams**: team registration           |
| Shopping cart (add, remove, update quantity) | **Swag shop**: stickers, hoodies, mugs |
| Dark and light theme toggle                  | **Dark mode** switch in the header     |

On top of those sits a learning layer that makes the invisible part of React visible: a **State X-ray** that shows each station's live state as JSON, and a **State lab** that proves what happens when you mutate state and what happens when you batch updates. That layer is what makes this more than a todo list: anyone watching can see state, immutability and re-rendering happen.

**The one memorable thing** is the split-flap check-in board: the people count flips like an airport departure board each time it changes. Everything else stays quiet and disciplined (see `Day5_DESIGN_SPEC.md`).

## 2. Users and jobs

| User                                                     | Job                                                                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Organizer (the persona)                                  | Know how many people are in the venue, finish setup, register teams, sell swag, without losing track                |
| Instructors and reviewers (the audience for the standup) | See, in under four minutes, that I understand state, events, forms and immutable updates, with evidence in the code |

## 3. Goals and non-goals

**Goals**

1. Cover every Day 5 task item and deliverable with working, explainable code (section 5).
2. Be visually distinctive and polished enough that people remember it, without leaving the Day 5 scope.
3. Keep every README and standup claim verifiable against the repo.

**Non-goals**

- No backend, database, authentication, payments or real hackathon data
- No routing (stations switch with a `useState` value)
- No persistence across page reloads (that needs `useEffect`, which is a later topic)
- No state libraries and no form libraries (see the scope guardrail below)

### Scope guardrail (non-negotiable)

Day 5 is about `useState` and events. The point is to write the state logic by hand.

| Allowed                                                                 | Not allowed                                                                                    |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `useState` (all data types, lazy initial state, functional updates)     | `useReducer`, `useContext`, `useEffect`, `useRef`, `useMemo`, `useCallback`, `useLayoutEffect` |
| `useId` (only for linking labels and inputs)                            | Redux, Zustand, Jotai, Recoil, MobX                                                            |
| Props, children, lifting a value up                                     | React Router, TanStack Query or Router                                                         |
| Plain CSS and Tailwind; small helpers for icons, animation and confetti | react-hook-form, Formik, Zod, Yup, Immer                                                       |
|                                                                         | UI kits that hide the code: MUI, Chakra, shadcn/ui, Radix                                      |

The only deliberate exception is the **intentionally wrong** mutation example inside the State lab, clearly marked in the code.

## 4. Scope

**In:** five stations, header with the theme switch, station navigation, toasts, State X-ray, State lab, sample data, README, deployment.
**Out:** everything under non-goals, plus real prices, real attendees and any data entered by someone other than me.

## 5. Task coverage matrix (every bullet in the Day 5 task)

| Task item                                                                 | Where it is covered                                                                                                                               |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| What state is                                                             | Every station; README concept section; State lab copy                                                                                             |
| State vs props                                                            | `theme`, `xrayOn` and `activeStation` live in `App` and are passed down as props; each station's own data is local state; README comparison table |
| When to use state                                                         | README decision list; derived values (progress, totals, capacity bar) are deliberately **not** state                                              |
| State is immutable                                                        | State lab mutation demo; every list update uses `map`, `filter` or spread                                                                         |
| Re-render on state change                                                 | State X-ray updates live; the mutation demo shows a missed re-render                                                                              |
| Import and use `useState`, declare, update                                | All stations                                                                                                                                      |
| Different data types                                                      | number (count), string (filter, theme), boolean (`xrayOn`), object (team form, coupon), array (tasks, cart, toasts)                               |
| Multiple state variables vs a single object                               | Check-in uses separate `count` and `capacity`; Teams uses one `form` object. The README compares the two                                          |
| Functional updates and previous state                                     | `setX(prev => ...)` everywhere; the batching demo (+3 the wrong way vs the right way)                                                             |
| `onClick`, `onChange`, `onSubmit`                                         | Buttons, inputs, forms                                                                                                                            |
| Event object: `preventDefault`, `target.value`                            | Teams form, task form, coupon form                                                                                                                |
| Passing arguments to handlers                                             | `onClick={() => removeTask(task.id)}` and similar                                                                                                 |
| Inline vs separate handlers                                               | Inline for one-liners, named handlers for logic. The rule is stated in the README                                                                 |
| Controlled components, input changes, submit, multiple inputs, validation | Teams form (also the task input, coupon and capacity inputs)                                                                                      |
| Arrays: add (spread), remove (`filter`), update (`map`), never mutate     | Checklist, Teams members and interests, Cart, Toasts                                                                                              |
| Objects: update a property, nested update, spread                         | Teams form (`contact.phone`), coupon object, cart lines                                                                                           |
| Counter, todo, form, cart, theme toggle                                   | The five stations                                                                                                                                 |

| Deliverable                                 | Satisfied by                                       |
| ------------------------------------------- | -------------------------------------------------- |
| React application with state management     | HackHQ as a whole                                  |
| 5 interactive components using `useState`   | CheckIn, Checklist, Teams, SwagShop, ThemeSwitch   |
| Form handling examples                      | Teams form, task form, coupon form, capacity input |
| Array state manipulation examples           | Checklist, Teams members, Cart, Toaster            |
| Object state manipulation examples          | Teams form (nested), coupon, cart lines            |
| Todo list fully functional                  | Checklist (CL-1 to CL-7)                           |
| README explaining state management concepts | `README.md`, written last from the real files      |

## 6. Functional requirements

Priority: **P0** must (a deliverable depends on it), **P1** should (the wow layer), **P2** could.

### 6.1 App shell (SH)

| ID   | Pri | Requirement                                                                                                                                                   | Acceptance                                                         |
| ---- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| SH-1 | P0  | Navigation between stations driven by `activeStation` state. All stations stay mounted and inactive ones are `hidden`, so their state survives switching      | Add a task, switch away and back: the task is still there          |
| SH-2 | P0  | Responsive navigation: sidebar from 1024 px, bottom bar below                                                                                                 | No horizontal scroll at 375, 768 and 1280 px                       |
| SH-3 | P0  | Toasts: array state in `App`, `onNotify(message, action?)` passed to stations as a prop, auto-dismiss with `setTimeout` inside the handler, at most 3 visible | Three quick actions show three toasts; a fourth removes the oldest |
| SH-4 | P0  | Every station receives only the props it needs (`xrayOn`, `onNotify`)                                                                                         | No station reads another station's state                           |

### 6.2 Check-in: counter (CI)

| ID   | Pri | Requirement                                                                                                                                                 | Acceptance                                                 |
| ---- | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| CI-1 | P0  | Show people inside; never below 0 or above capacity                                                                                                         | Minus is disabled at 0; plus buttons clamp at capacity     |
| CI-2 | P0  | Buttons: +1, -1, +5 (group), Reset                                                                                                                          | Reset sets the count to 0                                  |
| CI-3 | P0  | Capacity is a controlled number input (1 to 1000, default 200). Lowering it below the current count lowers the count and says so                            | Typing letters, blank or 0 never produces `NaN` or a crash |
| CI-4 | P0  | Capacity bar and status derived from count and capacity: normal below 80%, warning from 80%, full at 100%. Status is also written in words, not color alone | At 160 of 200 the text reads "Nearly full"                 |
| CI-5 | P0  | `count` and `capacity` are separate state variables                                                                                                         | Documented in the README as the multiple-variables example |
| CI-6 | P1  | Split-flap digits flip when the value changes; a single settle animation plays on first load                                                                | Digits keep a fixed width (no layout shift)                |
| CI-7 | P1  | Changes are announced to screen readers ("127 of 200 inside")                                                                                               | `aria-live="polite"` region                                |

### 6.3 Checklist: todo list (CL)

| ID    | Pri | Requirement                                                                                              | Acceptance                                                |
| ----- | --- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| CL-1  | P0  | Add a task with a controlled input and `onSubmit`; trim; 1 to 80 characters; empty input shows a message | Pressing Enter adds the task; whitespace-only is rejected |
| CL-2  | P0  | Toggle done with a checkbox (immutable `map`)                                                            | Other tasks are unchanged                                 |
| CL-3  | P0  | Delete a task (`filter`)                                                                                 | The task is gone and the order of the others is preserved |
| CL-4  | P0  | Filter all, open, done: `filter` is separate state; the visible list is derived                          | Changing the filter never changes the stored tasks        |
| CL-5  | P0  | Progress as text and bar, derived (not state)                                                            | "3 of 5 done" matches the list                            |
| CL-6  | P0  | Clear completed; empty states for "no tasks" and "no matches"                                            | Messages tell the user what to do next                    |
| CL-7  | P0  | "Add starter tasks" appends the hack-day tasks that are not already present                              | Clicking twice does not duplicate                         |
| CL-8  | P1  | Undo the last delete from the toast, restoring the task at its old position                              | Uses array insertion by index with spread                 |
| CL-9  | P1  | Confetti once when every task is done (at least 3 tasks), honoring reduced motion                        | Fires from the toggle handler, not an effect              |
| CL-10 | P1  | Edit task text inline                                                                                    | Escape cancels, Enter saves                               |
| CL-11 | P2  | Move a task up or down                                                                                   | Swap done without mutation                                |

### 6.4 Teams: form with multiple inputs and validation (TM)

| ID    | Pri | Requirement                                                                                                                                                                             | Acceptance                                                       |
| ----- | --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| TM-1  | P0  | Controlled fields: team name (3 to 30 characters), contact email (valid format), track (select), phone (optional, 10 digits when given) and city, both inside a nested `contact` object | Each field has a visible label                                   |
| TM-2  | P0  | Members: 1 to 4 rows with add and remove; each needs a name (2 or more characters) and a role                                                                                           | Add is disabled at 4; remove is disabled at 1                    |
| TM-3  | P0  | Interests: checkboxes that add or remove values in an array                                                                                                                             | Unchecking removes only that value                               |
| TM-4  | P0  | Agreement checkbox is required                                                                                                                                                          | Submit is blocked without it                                     |
| TM-5  | P0  | Validation by a pure `validateTeam(values)`. Errors show after a field is touched (blur) or on submit; submit is blocked while invalid; messages are specific                           | "Team name needs at least 3 characters." and not "Invalid input" |
| TM-6  | P0  | Submit uses `e.preventDefault()`; a valid submit adds the team to a registered list, resets the form and confirms with a toast                                                          | The page does not reload                                         |
| TM-7  | P0  | Registered teams list with remove; duplicate team names (case-insensitive) are rejected                                                                                                 | "Byte Bandits" then "byte bandits" shows an error                |
| TM-8  | P0  | Form values live in one `form` object, plus a `touched` object and a `submitted` flag                                                                                                   | Documented as the single-object example                          |
| TM-9  | P1  | Live badge preview built from the form state                                                                                                                                            | The preview updates on each keystroke                            |
| TM-10 | P1  | "Fill sample team" button                                                                                                                                                               | Fills every field with valid values                              |

### 6.5 Swag shop: shopping cart (SW)

| ID   | Pri | Requirement                                                                                                                                 | Acceptance                                       |
| ---- | --- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| SW-1 | P0  | Six sample products as constant data (not state)                                                                                            | Prices are clearly sample values                 |
| SW-2 | P0  | Add to cart: new line, or +1 on an existing line, maximum 10 per line                                                                       | The add button explains why it is disabled at 10 |
| SW-3 | P0  | Increase and decrease quantity; decreasing from 1 removes the line                                                                          | Never a quantity of 0 or less                    |
| SW-4 | P0  | Remove a line                                                                                                                               | Totals update                                    |
| SW-5 | P0  | Subtotal, discount and total are derived with `reduce` and formatted as INR with `Intl.NumberFormat`                                        | No totals are stored in state                    |
| SW-6 | P0  | Coupon: controlled input; `HACK10` gives 10% off; invalid codes show an error; the applied coupon is stored as an object and can be removed | The code is case-insensitive                     |
| SW-7 | P0  | Empty cart state                                                                                                                            | Invites the user to add something                |
| SW-8 | P1  | Receipt-style cart; "Place order" clears the cart and confirms (no payment)                                                                 | The toast names the item count and total         |
| SW-9 | P1  | Item count shown in the station heading                                                                                                     | Matches the sum of quantities                    |

### 6.6 Dark mode (TH)

| ID   | Pri | Requirement                                                                                                                                                | Acceptance                            |
| ---- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| TH-1 | P0  | The switch toggles `theme` between light and dark; it is a real switch (`role="switch"`, `aria-checked`) and works with the keyboard                       | Space and Enter toggle it             |
| TH-2 | P0  | The initial theme comes from the OS preference through a lazy initializer; the theme is applied as a class on the app wrapper; all colors come from tokens | Both themes meet the contrast targets |
| TH-3 | P1  | Short color transition, off under reduced motion                                                                                                           | No flash on toggle                    |

### 6.7 Learning layer: State X-ray and State lab (LB)

| ID   | Pri | Requirement                                                                                                                                                           | Acceptance                                          |
| ---- | --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| LB-1 | P1  | `xrayOn` boolean in `App`. When on, each station shows its own live state as formatted JSON                                                                           | Typing in a form field updates the JSON immediately |
| LB-2 | P1  | Mutation demo: "wrong way" pushes into the array and sets the same array; "right way" sets a new array. The wrong way leaves the screen stale until some other update | A plain-language note explains why                  |
| LB-3 | P1  | Batching demo: "Add 3, wrong way" adds 1; "Add 3, right way" adds 3                                                                                                   | Counts shown side by side                           |
| LB-4 | P1  | Each demo has at most two sentences of explanation                                                                                                                    | No jargon without a definition                      |

## 7. Non-functional requirements

| ID     | Area          | Requirement                                                                                                                                                                                        | How to check                                                      |
| ------ | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| NFR-1  | Responsive    | Works at 375, 768 and 1280 px, no horizontal scroll, touch targets of at least 44 px                                                                                                               | DevTools device toolbar                                           |
| NFR-2  | Accessibility | Fully keyboard operable, visible `:focus-visible`, every input labelled, status changes in `aria-live` regions, text contrast of at least 4.5:1 (3:1 for UI parts), color is never the only signal | Tab through every station; Lighthouse accessibility of 95 or more |
| NFR-3  | Performance   | Production build Lighthouse performance of 90 or more on mobile; gzipped JavaScript under 200 KB; fixed digit widths so there is no layout shift                                                   | `npm run build` output; Lighthouse                                |
| NFR-4  | Reliability   | No console errors or warnings in dev with StrictMode on; no crash on empty, huge or invalid input (`NaN`, blank, 10000)                                                                            | Manual test script in `Day5_MILESTONES.md`                        |
| NFR-5  | Code quality  | ESLint with 0 errors, Prettier-formatted, components under about 150 lines, pure logic in `src/lib/`                                                                                               | `npm run lint`, `npm run format`                                  |
| NFR-6  | Scope         | Only the allowed hooks; no state or form libraries                                                                                                                                                 | The grep checks in `Day5_AI_ASSISTANT_GUIDE.md`                   |
| NFR-7  | Security      | No secrets; user text is rendered as text; no `dangerouslySetInnerHTML`                                                                                                                            | grep                                                              |
| NFR-8  | Browsers      | Latest Chrome, Edge, Safari and Firefox                                                                                                                                                            | Smoke test in two browsers                                        |
| NFR-9  | Motion        | One orchestrated moment; other motion only answers an action; reduced motion respected                                                                                                             | Toggle the OS setting                                             |
| NFR-10 | Honesty       | README and standup claim only what exists in the code                                                                                                                                              | `docs/FACTS.md`, written at the end                               |
| NFR-11 | Testing       | At least 20 Vitest tests for the pure functions in `src/lib/`                                                                                                                                      | `npm test`                                                        |
| NFR-12 | Git           | One branch and PR per milestone, Conventional Commits, no empty commits, no same-second batches                                                                                                    | `git log --oneline --graph`                                       |

## 8. WOW moments (and how each stays in scope)

| Moment                                            | How it is built                                                                 | Scope check        |
| ------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------ |
| The split-flap board flips on every change        | Remount a digit with `key={digit}` to replay a CSS keyframe; Motion is optional | State and CSS only |
| State X-ray shows live JSON                       | `JSON.stringify(state, null, 2)` in a panel toggled by one boolean              | `useState` only    |
| State lab: mutate vs immutable, +3 wrong vs right | Two small components with two buttons each                                      | `useState` only    |
| Live badge preview while typing a team            | Derived from the `form` object during render                                    | No extra state     |
| Confetti at 100% done, and Undo from a toast      | Called from the event handler                                                   | No effects         |

## 9. Success metrics

| Metric                        | Target                                           | Verified by                         |
| ----------------------------- | ------------------------------------------------ | ----------------------------------- |
| P0 requirements passing       | 100%                                             | Manual test script                  |
| Task bullets covered          | 100% of section 5                                | The coverage table matches the code |
| Unit tests                    | 20 or more, all passing                          | `npm test`                          |
| Lighthouse (production build) | Accessibility 95 or more, performance 90 or more | Lighthouse report                   |
| Console                       | Zero errors and warnings                         | DevTools                            |
| Standup                       | 4 minutes or less, with a live demo and evidence | Rehearsal with a timer              |

## 10. Assumptions

- All product names, prices (in INR), starter tasks and the capacity are sample data I made up. They are not real figures.
- The coupon code `HACK10` and its 10% discount are hard-coded for the demo.
- Data resets on reload by design (no persistence in Day 5).
- The app targets modern browsers only.

## 11. Risks and mitigations

| Risk                                        | Mitigation                                                                                                                         |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Scope creep from the wow layer              | P0 first; wow items only after every P0 milestone merges (see the cut line in `Day5_MILESTONES.md`)                                |
| Code generated faster than I can explain it | Teaching Mode and the explain-back in `Day5_AI_ASSISTANT_GUIDE.md`; I must be able to explain one handler per station without help |
| A library hiding the state logic            | The scope guardrail in section 3                                                                                                   |
| State lost when switching stations          | Keep stations mounted and use `hidden` (SH-1)                                                                                      |
| `NaN` and invalid input                     | Pure helpers with guards, tested in Vitest                                                                                         |
| Time                                        | Milestones with a cut line; the State X-ray and State lab are the last wow items to drop                                           |
| Git history looks automated                 | I type the Git commands and commit after each working piece                                                                        |

## 12. Open questions

1. Ask Rebecca or Jiya whether building one themed app for the five Day 5 projects is fine (default: yes, it covers every deliverable).
2. Deployment target: Vercel (default) or GitHub Pages. This is optional for Day 5.
