# PRD: FlowLane + React Context (Day 12)

| Field     | Value                                                           |
| --------- | --------------------------------------------------------------- |
| Owner     | Ronit Ahuja                                                     |
| Programme | Linkific internship, Month 1 (training phase), Day 12          |
| Date      | Friday, 6 November 2026                                         |
| Repo path | `Linkific-Tasks/Day-12/flowlane-context`                        |
| Builds on | Day 11 `flowlane-redux`                                         |
| Status    | **Built.** Merged via PR #65.                                   |
| Companion | `flowlane-context/README.md`, `STATE_MANAGEMENT_COMPARISON.md`  |

---

## 1. Summary

Day 12 covers React Context and when to use it instead of Redux. FlowLane (Day 11) kept everything in Redux. Day 12 moves the signed-in user, the theme and a new language setting into Context, keeps the busy server data in Redux, and adds a reusable compound `Tabs` component. A comparison document explains the choices with numbers from the two builds. The Day 11 folder stays untouched.

## 2. Goals

| ID | Goal |
| -- | ---- |
| G1 | Understand Context: what it is, `createContext`, Provider, `useContext`, and the older Consumer pattern |
| G2 | Write custom context hooks that fail with a clear error outside their provider |
| G3 | Build practical contexts: Auth (login state, logout), Theme (toggle), Language (i18n) |
| G4 | Use multiple, nested and composed providers, and know when to split contexts |
| G5 | Optimize Context: memoize values, split state from actions, understand when it causes re-renders |
| G6 | Compare local state, Context and Redux, and show they can work together |
| G7 | Build a compound component (Tabs) that uses Context for its internal state |

## 3. Scope

**In scope.** AuthContext, ThemeContext, LanguageContext with custom hooks; a composed provider tree; the Tabs component used in two places; translations of the interface into Spanish and Hindi; tests; the comparison document and README.

**Out of scope.** A shopping-cart context (FlowLane has no cart; the Day 11 `redux-app` has one in Redux). Translating server-written text (notifications, errors from the store). New product features. Moving server data out of Redux.

## 4. Design

### 4.1 Mapping the task list

| Day 12 task | Implementation |
| ----------- | -------------- |
| Theme Context: light/dark | `ThemeContext`, split into state and actions; saved on the profile |
| Auth Context: user login state, logout | `AuthContext` wrapping Firebase Auth: `user`, `status`, `signIn`, `signUp`, `signInWithGoogle`, `signOut` |
| Language Context: i18n | `LanguageContext` with `t()`, three languages, 123 keys each |
| Cart Context | Not applicable to FlowLane (see section 3) |
| Wrap `useContext` in a custom hook, error outside provider | `useAuth`, `useThemeState`, `useThemeActions`, `useTheme`, `useLanguage` |
| Export provider and hook together | each context file |
| Multiple, nested, composed contexts | `AppProviders` |
| Separate vs combined contexts | Theme split in two; Auth and Language single |
| Optimize: memoization, splitting, re-renders | `useMemo` and `useCallback` everywhere; render-count tests |
| Compare local state, Context, Redux | `STATE_MANAGEMENT_COMPARISON.md` |
| Can they work together? | Context to Redux bridge through the thunk extra argument |
| Compound components: Tabs with Context | `components/Tabs.jsx`, used for project views and Settings |

### 4.2 Decisions

| Decision | Reason |
| -------- | ------ |
| Keep server data in Redux | Live Firestore listeners, optimistic updates with rollback, DevTools: Context would re-render the whole page on every card move |
| Bridge Context to Redux with the thunk `extraArgument` | Thunks run outside React; keeps Context the only owner of the user and the dependency one-way |
| Context created with `null`, hook throws | A missing provider fails with a clear message |
| Theme context split into state and actions | Components that only toggle never re-render on theme changes |
| Theme follows the profile through a listener that ignores pending writes | A one-shot read could return the half-written local copy right after sign-in |
| Tabs renders no wrapper element, controlled or uncontrolled | Flexible layout; Redux keeps the open tab for the project view |
| Only interface text is translated | Server-written text cannot be translated client-side |

## 5. Requirements

| ID | Requirement | Verified by |
| -- | ----------- | ----------- |
| R1 | Multiple contexts in one app | Auth, Theme, Language (+ Tabs internal) |
| R2 | Auth context with login and logout | `test/context/auth.test.jsx`, browser tests |
| R3 | Theme context with toggle, persisted | `test/context/theme.test.jsx`, browser tests |
| R4 | Custom hooks with errors outside the provider | `test/context/hooks-outside-provider.test.jsx` |
| R5 | Compound Tabs component, accessible, controlled and uncontrolled | `test/context/tabs.test.jsx`, browser tests |
| R6 | Language switching with complete translations | `test/i18n-completeness.test.js`, browser tests |
| R7 | Context and Redux working together | thunks use `extra.getUser()`; browser test switches users |
| R8 | All Day 11 behaviour still works | the Day 11 browser tests pass on the new architecture (the accessibility tour gained one step for the Language tab) |
| R9 | State management comparison document | `STATE_MANAGEMENT_COMPARISON.md` |
| R10 | README explaining the Context patterns | `flowlane-context/README.md` |

## 6. Milestones

| #  | Milestone | Branch | PR |
| -- | --------- | ------ | -- |
| M1 | Contexts, hooks, Tabs, i18n, tests, comparison and README | `day12/flowlane-context` | #65 |

## 7. Verification

| Layer | Result |
| ----- | ------ |
| Build and lint | `npm run build` passes; no lint errors |
| Unit and component tests | 141 passing: Redux slices and thunks, listeners, contexts and hooks, render counts, Tabs, translation completeness |
| Browser end to end | 61 passing in Chrome against the Firebase emulators, including all the Day 11 tests, plus language, theme, Tabs and bridge tests |
| Accessibility | axe-core WCAG 2.1 AA: zero violations in light, dark, Spanish and Hindi |

A browser test found a real defect in how the saved theme is restored (also present in the Day 11 version); it is fixed here and covered by unit and browser tests.

**Not covered:** Google popup sign-in, Google Calendar, browsers other than Chrome, phone-sized screens, native-speaker review of the Spanish and Hindi, and a run against the real Firebase project.

## 8. Risks

| Risk | Mitigation |
| ---- | ---------- |
| Context re-render storms | Memoized values, a split theme context, busy data kept in Redux, render-count tests |
| Wrong provider order | Hooks throw clear errors; one `AppProviders` file; tests |
| Context and Redux disagreeing about the user | Context is the only owner; Redux reads it through one function |
| Translations out of sync | A test requires the same keys, placeholders and no empty values in every language |
| Machine-written translations | Documented; native-speaker review recommended |

## 9. Deliverables

- React app with multiple Contexts (`Day-12/flowlane-context`)
- Authentication context with login and logout
- Theme context with toggle
- Custom Context hooks
- Compound component example (Tabs)
- State management comparison document
- README with Context patterns explained
