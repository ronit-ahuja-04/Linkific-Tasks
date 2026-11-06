# FlowLane + React Context

**Day 12 Project:** Linkific Month 1 Training
**Author:** Ronit Ahuja
**Stack:** React 19, Vite, Firebase, **React Context**, Redux Toolkit (for server data), Vitest, Testing Library, Playwright
**PRD:** [Day12_PRD.md](../Day12_PRD.md)
**Comparison:** [STATE_MANAGEMENT_COMPARISON.md](../STATE_MANAGEMENT_COMPARISON.md)
**Starting point:** the Day 11 app (`Day-11/flowlane-redux`). Redux kept the server data; the things Context is better at moved into Context, and the app gained a language switcher and a reusable Tabs component.

## Run
```bash
cd Day-12/flowlane-context
npm install
cp .env.example .env    # your Firebase web app keys
npm run dev
npm test                # 141 unit and component tests (Firebase mocked)
npm run test:rules      # 23 Firestore security-rules tests (emulator, needs Java)
npm run test:e2e        # 61 browser tests against the Firebase emulators
npm run test:all
```

## 1. Who owns which state

| State | Owner | Why |
| --- | --- | --- |
| Signed-in user, sign-in/out functions | **AuthContext** | Read everywhere, changes rarely, no async orchestration or time travel needed |
| Light or dark theme | **ThemeContext** | UI preference, one value |
| Interface language and `t()` | **LanguageContext** | Read by every component that shows text, changes rarely |
| Open tab, modals, task panel | Redux (`ui` slice) | Other code (the activity listener) reads it outside React |
| Projects, board, users, invitations, notifications | **Redux** | Live Firestore data, optimistic updates with rollback, many writers, DevTools |
| Form fields, which task is being edited | `useState` | Only one component cares |

Rule used: *local state until two distant components need it; Context when the value is global but changes rarely; Redux when the state is frequently updated, shared by non-React code, or needs middleware, async logic and time travel.*

```
main.jsx
  AppProviders                      src/context/AppProviders.jsx
    Redux Provider                  server data
      AuthProvider                  who is signed in
        ThemeProvider               uses useAuth() to save the theme on the profile
          LanguageProvider
            App
```

## 2. Context basics, where to find each

| Concept | File |
| --- | --- |
| `createContext` | top of each `src/context/*Context.jsx` |
| Provider component | `AuthProvider`, `ThemeProvider`, `LanguageProvider` |
| `useContext` (modern pattern; the older `<Context.Consumer>` is not used) | inside the custom hooks |
| Custom hook wrapping `useContext`, with an error outside the provider | `useAuth`, `useThemeState`, `useThemeActions`, `useTheme`, `useLanguage` |
| Provider and hook exported together | each context file exports both |
| Multiple contexts | Auth, Theme, Language, plus the Tabs component's private one |
| Nested providers and composition | `AppProviders.jsx`; `ThemeProvider` calls `useAuth()` so it sits inside `AuthProvider` |
| Separate vs combined contexts | Theme is split in two (below); Auth and Language are single, memoized values |

**Custom hook with a clear error**
```js
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) throw new Error('useAuth must be used inside an <AuthProvider>.');
  return context;
}
```
The context is created with `null` as its default, so forgetting the provider fails immediately with a message that says what to do, instead of an obscure `undefined` error later.

## 3. The three contexts

**AuthContext** (`user`, `status`, `busy`, `error`, `signIn`, `signUp`, `signInWithGoogle`, `signOut`, `clearError`)
- Subscribes to Firebase Auth once, keeps only four plain fields of the Firebase user, and saves the profile so teammates can find the user by email.
- Sign-in functions resolve `true` or `false`; the readable message is in `error`.
- Without Firebase keys it reports "signed out" and explains what is missing, instead of crashing.

**ThemeContext** (`mode`, `isDark`, `toggleTheme`, `setTheme`)
- Applies `data-theme` to `<html>`, so even the sign-in page follows the saved theme.
- Saves the theme on the user's profile and follows it live: a change on another device applies here. It listens to the profile and only applies the server-confirmed version, because right after sign-in the app is also writing the profile and a plain read could answer from that half-written local copy (found by a browser test).

**LanguageContext** (`locale`, `locales`, `setLocale`, `t`)
- English, Spanish and Hindi, 123 keys each, one dictionary file per area of the app (`src/i18n/<lang>/`).
- `t('key', { name })` replaces `{placeholders}`. Lookup order: chosen language, English, then the key itself, so a gap is visible instead of blank.
- Saved in `localStorage`, defaults to the browser language, and keeps `<html lang>` right.
- Not translated on purpose: anything users or the server write (task titles, chat messages, notification texts, errors produced by the store).

## 4. Optimizing Context

Context re-renders **every** consumer when its value changes. Three techniques are used and tested:

1. **Memoize the value.** Each provider builds its value with `useMemo` and its functions with `useCallback`, so a re-render of the provider does not hand consumers a new object. A test renders the provider three times and asserts the same object comes back.
2. **Split a context by how often things change.** ThemeContext has a *state* context (`mode`) and an *actions* context (`toggleTheme`, `setTheme`). The actions never change. A test proves that a component using only `useThemeActions()` rendered **0 extra times** over three theme changes, while a component using `useThemeState()` rendered 3 times.
3. **Keep fast-changing data out of Context.** The board, notifications and chat messages change constantly, so they stay in Redux, where `useSelector` re-renders a component only when the slice it selected changes.

When Context becomes a performance problem: a value that changes many times per second, read by many components, with no way to select a part of it. That is the point to move it to Redux (or split it).

## 5. Context and Redux together

They are not rivals. The only coupling is one line of data flow, from Context to Redux:

- **Context to Redux:** thunks run outside React and cannot call `useContext`, so `AuthProvider` publishes the plain user to `src/lib/session.js`, and the store hands `getUser` to every thunk as its *extra argument* (`store/index.js`). Thunks call `extra.getUser()`. Context stays the only owner of the user.
- **Redux does not feed Context.** Nothing in a context depends on the store, which keeps the dependency one-way and easy to test.
- A browser test signs out and in as someone else and checks that thunks act as the *new* user.

## 6. Compound component: `Tabs`

`src/components/Tabs.jsx`: `Tabs`, `Tabs.List`, `Tabs.Tab`, `Tabs.Panel`.
```jsx
<Tabs value={tab} onChange={setTab}>
  <Tabs.List aria-label="Project views">
    <Tabs.Tab value="board">Board</Tabs.Tab>
    <Tabs.Tab value="activity">Activity</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="board">...</Tabs.Panel>
  <Tabs.Panel value="activity">...</Tabs.Panel>
</Tabs>
```
- **Internal state through Context.** The parts never receive props from each other; they read the open tab from a Context that only `Tabs.jsx` knows. A part used outside `<Tabs>` throws a clear error.
- **Flexible API.** `Tabs` renders no element of its own, so anything can sit between the parts (FlowLane puts the project header between the list and the panels), and parts can be reordered or left out.
- **Controlled or uncontrolled.** The project view passes `value` and `onChange` so Redux can read the open tab; the Settings page passes `defaultValue` and lets Tabs keep its own state.
- **Accessible.** WAI-ARIA tabs pattern: roles, `aria-selected`, `aria-controls`, roving `tabIndex`, arrow keys, Home and End, and the panel of a closed tab is not rendered (or `keepMounted` keeps it hidden).

Used twice: the project Board/Activity tabs and the Settings Appearance/Language tabs.

## 7. Comparing local state, Context and Redux

See [STATE_MANAGEMENT_COMPARISON.md](../STATE_MANAGEMENT_COMPARISON.md) for the table, the decision rules, and measured numbers from this app.

## 8. Tests

| Layer | Command | Count | Covers |
| --- | --- | --- | --- |
| Unit and component | `npm test` | 141 | Redux slices and thunks, listeners, the three contexts and their hooks (errors outside the provider, memoization, render counts), Tabs behaviour and keyboard, translations complete in every language |
| Security rules | `npm run test:rules` | 23 | Firestore rules against the emulator |
| Browser end to end | `npm run test:e2e` | 61 | Auth, projects, board and drag and drop, collaboration with several browsers, chat, language switching, theme persistence, Tabs keyboard use, the Context-to-Redux bridge, and WCAG 2.1 AA audits (including Spanish and Hindi) |

Every browser test fails on any console error, warning or browser Issue hint. The translation tests check that every language has exactly the same keys as English, no empty values, the same placeholders, that every `t('...')` key used in the code exists, and that no dictionary key is unused.

## 9. Limits and honest notes

- **Cart context:** the task list mentions a shopping-cart context. FlowLane has no cart, so it is not built here. The Day 11 app `redux-app` has the cart (in Redux); the comparison document shows how it would differ as a Context.
- **Translations:** the interface text is translated. Messages stored in Firestore (notifications) and error texts that come from the store stay in English. Spanish and Hindi were written by me and should be reviewed by a native speaker before shipping.
- **Not covered by automated tests:** Google popup sign-in (needs real Google), Google Calendar sync, browsers other than Chrome, phone-sized screens, and a run against your real Firebase project.
- **Lint:** `npm run lint` has no errors; the remaining warnings are in Chat, Messages and Calendar, which this task did not change.
