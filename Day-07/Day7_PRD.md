# PRD: HackHQ Router, real URLs for the hackathon control room (Day 7: React Router & Navigation)

| Field          | Value                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Owner          | Ronit Ahuja                                                                                                                          |
| Programme      | Linkific internship, Month 1 (training phase), Day 7                                                                                 |
| Date           | Saturday, 31 October 2026                                                                                                            |
| Repo path      | `Linkific-Tasks/Day-07/hackhq-router`                                                                                                |
| Builds on      | Day 6 `hackhq-live` (copied in M0, PR #29)                                                                                           |
| Status         | **Shipped.** All milestones M0–M5 merged (PRs #29–#34). This PRD records the requirements and their verified status.                 |
| Presentation   | Daily Tech Meet, maximum 4 minutes. Submit on the dashboard **before** presenting.                                                   |
| Companion docs | `Day7_TECH_STACK_AND_ARCHITECTURE.md`, `Day7_DESIGN_SPEC.md` (this folder); `hackhq-router/README.md`, `hackhq-router/docs/FACTS.md` |

---

## 1. Summary

HackHQ is the day-of control room for a 24-hour hackathon: check-in, checklist, teams, swag, a hack clock and a live attendee directory. Through Day 6 it was one screen. A `useState('directory')` value picked which panel to show, and the other seven were kept mounted but `hidden`. The URL never changed.

That broke the four things people expect from the web:

| Expectation                             | Day 6 behaviour                                                             |
| --------------------------------------- | --------------------------------------------------------------------------- |
| Refresh keeps my place                  | Always lands on Directory                                                   |
| I can bookmark or share a page          | Every link is `/`                                                           |
| Back goes to where I was                | Back leaves the app                                                         |
| Only what I'm looking at costs anything | All 8 stations mounted; every toast or theme change re-rendered all of them |

Day 7 rebuilds navigation on React Router so that every station, product and participant has an address. It also covers every Day 7 learning objective inside the same app, instead of as separate demos:

| Day 7 task item                     | Where it lives in HackHQ                               |
| ----------------------------------- | ------------------------------------------------------ |
| Home page                           | Mission control (`/`, index route)                     |
| About page                          | `/about`, with a live `<Link>` vs `<a>` comparison     |
| Products list page                  | Swag shop (`/swag`)                                    |
| Product detail page (dynamic route) | `/swag/:productId`                                     |
| Contact page with form              | `/contact` → `/contact/sent`                           |
| 404 page                            | "Signal lost" (`path="*"`)                             |
| Navigation header with active links | `NavLink` sidebar + header                             |
| Fetch data based on params          | `/directory/:userId?` → posts via the Day 6 `useFetch` |
| Protected route (bonus)             | `/organizer/*` behind a demo login                     |

**The one memorable thing:** press ⌘K anywhere, type "hoodie", hit Enter, and you're on the product page. It's programmatic navigation you can feel.

## 2. Users and jobs

| User                       | Job to be done                                  | Day 7 feature that serves it                            |
| -------------------------- | ----------------------------------------------- | ------------------------------------------------------- |
| Organizer at the help desk | Send a volunteer straight to a station          | Shareable URLs for every page                           |
| Swag desk volunteer        | Look up a product and add it to an order        | `/swag/:productId` with a cart that survives navigation |
| Organizer running check-in | Keep attendee tools away from the public screen | Guarded `/organizer` area                               |
| Attendee or sponsor        | Ask the organizers a question                   | Contact form with confirmation                          |
| Instructor reviewing Day 7 | See each routing concept working and explained  | Navigation patterns page, route badge, README           |

## 3. Goals and non-goals

**Goals**

1. Every Day 7 learning objective and deliverable is demonstrated live in the app.
2. The URL is the single source of truth for which page, product and participant is shown.
3. The upgrade feels better than Day 6, not just different (the "wow" layer in section 8).
4. Every claim in the README is backed by code and a measured check (`FACTS.md`).

**Non-goals**

- Real authentication or a backend. The guard is a UX demo.
- Deployment to a static host (documented, not done).
- Data-router features: loaders, actions, `createBrowserRouter`.
- Preserving every Day 5 station's local state across navigation (only the cart is lifted, see FR-DR-5).

### Scope guardrail (non-negotiable)

Allowed: everything from Days 1–6 (`useState`, `useEffect`, `useId`, the five Day 6 custom hooks) **plus only** the router APIs the Day 7 task names: `BrowserRouter`, `Routes`, `Route`, `Link`, `NavLink`, `Navigate`, `useParams`, `useNavigate`. `Outlet` is also allowed, because nested and layout routes cannot render without it.

Forbidden: `useLocation`, `useSearchParams`, `useOutletContext`, `useMatch`, data-router APIs, Context, `useReducer`, `useRef`, `useMemo`, `useCallback`, `useLayoutEffect`, and any new library other than `react-router-dom`. Shared state is passed as props.

## 4. Scope

**In:** route tree with layout, index, nested and catch-all routes; `NavLink` navigation; two dynamic routes (one with an optional segment); programmatic navigation on submit, click and keyboard; push vs replace; back/forward; declarative redirects; a protected route area; README explaining every concept; ⌘K palette and the other wow items.

**Out:** see non-goals. P1 extras from the plan (per-page tab titles, static-host rewrite files) were optional and are not built.

## 5. Task coverage matrix (every bullet in the Day 7 task)

| Task bullet                                                                                 | Covered by                                                                | Status                                   |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------- |
| Install React Router (`npm install react-router-dom`)                                       | `package.json`: react-router-dom 7.18.5                                   | Done                                     |
| Understand BrowserRouter vs HashRouter                                                      | README §3 comparison table + static-host note                             | Done (HashRouter explained, not shipped) |
| Setup BrowserRouter                                                                         | `main.jsx`                                                                | Done                                     |
| Create Route components / use Routes wrapper                                                | `App.jsx` route tree (20 patterns)                                        | Done                                     |
| Navigate between pages                                                                      | Sidebar, Home cards, header logo, palette                                 | Done                                     |
| Link vs anchor tags                                                                         | `About.jsx` side-by-side demo                                             | Done                                     |
| Link / NavLink (active styling) / Navigate                                                  | `Navigation.jsx`, redirects, guard                                        | Done                                     |
| URL parameters (`:id`) + `useParams`                                                        | `/swag/:productId`, `/directory/:userId?`                                 | Done                                     |
| Fetch data based on params                                                                  | `DirectoryPage` → `UserPosts` → `useFetch`                                | Done                                     |
| Optional parameters                                                                         | `directory/:userId?`                                                      | Done                                     |
| `useNavigate` for programmatic navigation                                                   | Contact, Login, Directory rows, palette, BackButton, NavPatterns          | Done                                     |
| Navigate on events (form submit, button click)                                              | Contact submit, Login submit, row click                                   | Done                                     |
| Go back / forward                                                                           | `BackButton`, NavPatterns card                                            | Done                                     |
| Replace vs push                                                                             | NavPatterns cards; Contact and Login use `replace`                        | Done                                     |
| Nested routes / index routes / layout routes                                                | `swag/*`, `organizer/*`; index at `/`, `/swag`, `/organizer`; `AppLayout` | Done                                     |
| 404 Not Found page                                                                          | `NotFound.jsx` with splat param                                           | Done                                     |
| Redirect / Navigate component                                                               | `/shop`, `/checkin`, `/lab`, guard, logged-in `/login`                    | Done                                     |
| Protected routes: conditional rendering, auth check, redirect to login, route guard concept | `ProtectedRoute.jsx`, `Login.jsx`, README §3                              | Done (bonus)                             |
| README with routing concepts explained                                                      | `README.md`                                                               | Done                                     |
| Watch tutorials / read official docs                                                        | Tracker (Ronit)                                                           | Ronit to log                             |

## 6. Functional requirements

Priority: **P0** must (a deliverable depends on it), **P1** should (wow layer), **P2** could. Status is from `FACTS.md` (browser checks) unless noted.

### 6.1 Router shell (RS)

| ID   | Pri | Requirement                                                                                                      | Acceptance                                | Status                           |
| ---- | --- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | -------------------------------- |
| RS-1 | P0  | Exactly one `<BrowserRouter>` at the root                                                                        | `main.jsx` only                           | Pass                             |
| RS-2 | P0  | A layout route renders Header + sidebar + `<Outlet />`; pages swap inside it                                     | Header never remounts on navigation       | Pass                             |
| RS-3 | P0  | `activeStation` and `hidden` panels are removed                                                                  | `grep activeStation src` → 0              | Pass                             |
| RS-4 | P0  | Deep links render directly, and refresh keeps the page                                                           | Open `/clock` in a new tab                | Pass                             |
| RS-5 | P0  | Back/Forward follow in-app navigation                                                                            | Click About → Teams, Back → `/about`      | Pass                             |
| RS-6 | P0  | Router updates are applied synchronously (`useTransitions={false}`) so auth state and navigation render together | Header Log out lands on `/`, not `/login` | Pass (bug found and fixed in M4) |

### 6.2 Navigation header (NV)

| ID   | Pri | Requirement                                                   | Acceptance                                                                                                   | Status        |
| ---- | --- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------- |
| NV-1 | P0  | Sidebar links are `NavLink`s with active styling              | Exactly one active link per page                                                                             | Pass          |
| NV-2 | P0  | Home link uses `end` so `/` is not active everywhere          | On `/about` only About is active                                                                             | Pass          |
| NV-3 | P0  | Parent links stay active on child URLs                        | "Swag shop" active on `/swag/:productId`; "Patterns" on `/patterns/navigation`; "Contact" on `/contact/sent` | Pass          |
| NV-4 | P0  | Active link exposes `aria-current="page"` (no fake tab roles) | DOM check                                                                                                    | Pass          |
| NV-5 | P0  | Header logo links to `/`                                      | Click logo                                                                                                   | Pass          |
| NV-6 | P0  | Mobile bottom bar holds all links without breaking layout     | Scrolls sideways at 500 px                                                                                   | Pass (visual) |

### 6.3 Pages (PG)

| ID   | Pri | Requirement                                                                                | Acceptance                                              | Status                                                      |
| ---- | --- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------- | ----------------------------------------------------------- |
| PG-1 | P0  | Home (index route): every station as a `<Link>` card                                       | Cards link to their paths                               | Pass                                                        |
| PG-2 | P0  | About: event info, Day 5→7 timeline, `<Link>` vs `<a>` demo                                | `<a>` reloads (document request), `<Link>` does not     | Built; for Ronit to demo live (not in the automated checks) |
| PG-3 | P0  | Day 5/6 stations reachable at `/clock`, `/patterns`, `/checklist`, `/teams`, `/swag`       | Each renders directly                                   | Pass                                                        |
| PG-4 | P0  | 404 page for unknown URLs, inside the layout, naming the missing path from the splat param | `/totally/unknown` → "No station … on /totally/unknown" | Pass                                                        |

### 6.4 Dynamic routes (DR)

| ID   | Pri | Requirement                                                                                 | Acceptance                                                                                                                 | Status |
| ---- | --- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------ |
| DR-1 | P0  | `/swag/:productId` renders a product from `useParams`                                       | `/swag/swag-tee` shows the tee                                                                                             | Pass   |
| DR-2 | P0  | Unknown product id shows a friendly "Product not found" state (route matched, data missing) | `/swag/nope`                                                                                                               | Pass   |
| DR-3 | P0  | `/directory/:userId?`: optional segment; the URL replaces `selectedUserId` state            | Row click → `/directory/:id`; no `useState` holds the selected user (it reaches `Directory` as a prop parsed from the URL) | Pass   |
| DR-4 | P0  | Params are parsed and validated (`parseUserId`); invalid ids show "Unknown participant"     | `/directory/abc`                                                                                                           | Pass   |
| DR-5 | P0  | Cart is lifted to `App` and persisted, shared by list and detail                            | Cart count survives list → detail → back and a reload                                                                      | Pass   |
| DR-6 | P0  | Posts are fetched by param; switching users aborts stale requests                           | After 3 rapid clicks the panel matches the URL's user                                                                      | Pass   |
| DR-7 | P0  | Directory stays mounted across user changes                                                 | Search text survives switching users                                                                                       | Pass   |
| DR-8 | P1  | Previous/next product links wrap around the catalog                                         | Back walks product history                                                                                                 | Pass   |

### 6.5 Programmatic navigation (PN)

| ID   | Pri | Requirement                                                           | Acceptance                                    | Status |
| ---- | --- | --------------------------------------------------------------------- | --------------------------------------------- | ------ |
| PN-1 | P0  | Contact form: controlled inputs, touched + derived errors             | Invalid submit stays put with 3 errors        | Pass   |
| PN-2 | P0  | Valid submit → `navigate('/contact/sent', { replace: true })`         | Back skips the sent form                      | Pass   |
| PN-3 | P0  | `BackButton` = `navigate(-1)` on detail views                         | Returns to the previous product               | Pass   |
| PN-4 | P1  | `BackButton` falls back to a list page when `history.state.idx === 0` | Fresh deep link → `/swag`, not out of the app | Pass   |
| PN-5 | P0  | Navigation patterns page: push, replace, back/forward, redirect       | Back behaves as each diagram says             | Pass   |
| PN-6 | P0  | `navigate()` only in handlers; render-time redirects use `<Navigate>` | Code review                                   | Pass   |
| PN-7 | P0  | Legacy `/shop` → `/swag` with `replace`                               | Back skips `/shop`                            | Pass   |

### 6.6 Protected routes (PR), bonus

| ID   | Pri | Requirement                                                                               | Acceptance                                          | Status |
| ---- | --- | ----------------------------------------------------------------------------------------- | --------------------------------------------------- | ------ |
| PR-1 | P1  | One pathless `ProtectedRoute` guards `/organizer`, `/organizer/checkin`, `/organizer/lab` | Logged out → `/login`                               | Pass   |
| PR-2 | P1  | Guard redirects with `replace`                                                            | Back from `/login` doesn't re-enter the guarded URL | Pass   |
| PR-3 | P1  | Login checks the demo passcode; wrong code shows an error                                 | `hackhq` → `/organizer`                             | Pass   |
| PR-4 | P1  | `isOrganizer` persisted; refresh keeps the session                                        | Reload `/organizer/checkin`                         | Pass   |
| PR-5 | P1  | `/login` while signed in redirects to `/organizer`                                        | Visit `/login`                                      | Pass   |
| PR-6 | P1  | Logout (header and page) → `/`                                                            | Both buttons                                        | Pass   |
| PR-7 | P1  | Legacy `/checkin`, `/lab` redirect into the guarded area                                  | `/checkin` → guard → `/login`                       | Pass   |
| PR-8 | P0  | UI and README state "demo only, not security"                                             | Visible on Login                                    | Pass   |

## 7. Non-functional requirements

| ID     | Area          | Requirement                                                                                                                       | Status / evidence                                                                       |
| ------ | ------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| NFR-1  | Responsive    | No horizontal scroll at 500 px and 1440 px; header and bottom nav fit                                                             | Pass in headless Chrome at 500 px (its minimum). 375 px and real devices **not tested** |
| NFR-2  | Accessibility | Keyboard operable; `aria-current` on active link; palette uses combobox/listbox roles; errors use `role="alert"`; labelled inputs | Implemented; **no screen-reader pass** run                                              |
| NFR-3  | Motion        | Page entrance animations respect `prefers-reduced-motion`                                                                         | Global reduced-motion rule (Day 5) applies                                              |
| NFR-4  | Reliability   | Zero console errors/warnings with StrictMode across all flows                                                                     | 5/5 browser suites clean                                                                |
| NFR-5  | Code quality  | ESLint 0, Prettier clean, no `eslint-disable`; pure logic in `src/lib/`                                                           | Pass                                                                                    |
| NFR-6  | Scope         | Section 3 guardrail holds                                                                                                         | All grep audits 0 (`FACTS.md` §2)                                                       |
| NFR-7  | Testing       | Pure route/palette/form/auth helpers unit-tested                                                                                  | 76 tests (18 new)                                                                       |
| NFR-8  | Security      | No secrets; no `dangerouslySetInnerHTML`; guard labelled as UX only                                                               | `grep dangerouslySetInnerHTML` → 0                                                      |
| NFR-9  | Performance   | Gzipped JS under 200 KB                                                                                                           | 118.50 kB gzip. Lighthouse **not run**                                                  |
| NFR-10 | Honesty       | README and standup claim only what exists                                                                                         | `FACTS.md`, written last from measurements                                              |
| NFR-11 | Git           | One branch + PR per milestone, Conventional Commits, merge commits                                                                | PRs #29–#34                                                                             |

## 8. Wow moments (and how each stays in scope)

| #   | Moment               | How it is built                                                                                                        | Scope check                                     |
| --- | -------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| W1  | Every page glides in | CSS keyframe on `.hackhq-main > *`; route elements remount, so it replays; `key={product.id}` replays between products | CSS only                                        |
| W2  | "Signal lost" 404    | CSS static, scanlines, glitch text; splat param names the bad path                                                     | `useParams`                                     |
| W3  | Live route badge     | `useParams()` printed with quotes: `/swag/:productId → { productId: "swag-tee" }`                                      | `useParams`                                     |
| W4  | Hero product page    | Category-coloured CSS visual, specs, wrap-around pager, sticky cart bar                                                | Props + CSS                                     |
| W5  | ⌘K command palette   | `keydown` listener in `useEffect` with cleanup; pure `filterCommands`; `navigate(path)`                                | `useState`, `useEffect`, `useId`, `useNavigate` |

## 9. Success metrics

| Metric                     | Target                       | Result                           |
| -------------------------- | ---------------------------- | -------------------------------- |
| Day 7 deliverables         | 8 of 8 (incl. bonus)         | 8 of 8                           |
| Routes                     | At least 5                   | 20 patterns                      |
| P0 functional requirements | 100% pass                    | 100%                             |
| Browser interaction checks | All pass, zero console noise | 53 / 53                          |
| Unit tests                 | All pass                     | 76 / 76                          |
| Scope audits               | All 0                        | All 0                            |
| Standup                    | ≤ 4 minutes with live demo   | Script ready; rehearsal by Ronit |

## 10. Assumptions

- Product names, prices (INR), the coupon and the passcode `hackhq` are sample data.
- DummyJSON stays reachable without auth, as on Day 6.
- Vite's `index.html` fallback is enough for local deep links; no hosting today.
- Modern evergreen browsers only.

## 11. Risks and mitigations

| Risk                                                | Mitigation                                                   | Outcome                                |
| --------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------- |
| Routes unmount pages, so state is lost              | Lift and persist only shared state (cart); document the rest | Cart verified; other resets documented |
| `/` NavLink always active                           | `end` prop                                                   | Verified                               |
| Relative links resolving wrong inside nested routes | All paths built by `lib/routes.js` as absolute               | No nested-path bugs found              |
| Guard Back-button loop                              | `replace` on every redirect                                  | Verified                               |
| Deep-link 404 on static hosts                       | README rewrite note / HashRouter alternative                 | Not deployed                           |
| React Router 7 transitions reorder renders          | Found by browser tests; `useTransitions={false}`             | Fixed in PR #33                        |
| Day 6 dependency drift (Vite 8 vs plugin-react 4)   | Upgrade plugin to v6, no `--legacy-peer-deps`                | Fixed in PR #29                        |
| Wow layer eats the day                              | Wow items folded into milestones after P0                    | All shipped                            |

## 12. Open questions

1. Should the organizer guard return users to the page they originally requested? That needs `useLocation`, which is outside Day 7's API list. Proposed for a later day.
2. Deploy target, if wanted: Vercel or Netlify with an SPA rewrite, or GitHub Pages with `HashRouter`.
3. Should the swag coupon be lifted like the cart, so it survives opening a product page?
