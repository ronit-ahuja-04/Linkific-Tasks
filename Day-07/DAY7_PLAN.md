# Day 7 Master Implementation Plan: React Router & Navigation

**Intern:** Ronit Ahuja · **Date:** Saturday, 31 October 2026  
**Context:** Month 1 Training (Day 7) · **Target Application:** HackHQ Router (`hackhq-router`)  
**Mentor Pairing Model:** Plan-First · Human-Runs-Git & Installs · Truthful Teaching Mode

---

## 1. Understanding & Architectural Approach

### 1.1 Restatement (10-Line Summary)
1. Day 7 focuses on client-side routing with React Router: turning a single-screen app into a multi-page application with real URLs.
2. We extend the Day 6 HackHQ Live dashboard, whose "stations" are currently switched by a `useState('directory')` value. The URL never changes, so refresh, bookmarks, and the Back button do not work.
3. React Router replaces that hand-rolled tab state: every station gets its own URL, and the sidebar becomes a `NavLink` menu with automatic active styling.
4. A layout route (Header + sidebar + `<Outlet />`) wraps all pages, demonstrating nested and index routes.
5. Dynamic routes come from existing data: `/swag/:productId` for product detail (local catalog) and `/directory/:userId?` for participant posts (fetched with the Day 6 `useFetch` hook, using an optional param).
6. Programmatic navigation is demonstrated on real events: Contact form submit (`replace`), Back buttons (`navigate(-1)`), and a Navigation Patterns page showing push vs replace and back/forward.
7. A 404 page catches unknown URLs, and a `<Navigate>` redirect handles a legacy path.
8. A bonus protected `/organizer` area redirects to `/login` when the fake organizer flag is off, demonstrating the route-guard concept.
9. Ronit runs all Git mutations, package installations, and manual verifications; the agent writes code and provides pre-step explanations.
10. The day ends with verification, grep audits, an honest README explaining routing concepts, and a 4-minute standup rehearsal.

### 1.2 Strict Scope (Up to Day 7)
The allowed toolset is everything from Days 1–6 plus **only** the routing APIs named in the Day 7 task.

| Category | Allowed | Forbidden (grep-audited) |
|---|---|---|
| **React hooks** | `useState`, `useEffect`, `useId` | `useReducer`, `useContext`, `useRef`, `useMemo`, `useCallback`, `useLayoutEffect`, `createContext` |
| **Custom hooks** | Day 6 hooks: `useFetch`, `useDebounce`, `useStopwatch`, `useWindowSize`, `useLocalStorage` | New third-party hook libraries |
| **Router components** | `BrowserRouter`, `Routes`, `Route`, `Link`, `NavLink`, `Navigate`, `Outlet` (needed to render nested routes) | `createBrowserRouter`, `RouterProvider`, loaders, actions, `<Form>`, `<Await>` (Data Router mode, not in Day 7 task) |
| **Router hooks** | `useParams`, `useNavigate` | `useLocation`, `useSearchParams`, `useOutletContext`, `useMatch`, `useLoaderData`, `useNavigation` |
| **Libraries** | `react-router-dom` (the only new dependency) | `axios`, `@tanstack/*`, `swr`, `redux`, `zustand`, any auth library |

**Consequences of the strict scope (documented honestly in the README):**
* Shared state (cart, theme, organizer flag) lives in `App.jsx` and is passed to route elements **as props**. No Context, no `useOutletContext`.
* After login, the app always returns to `/organizer`. Returning to the exact page originally requested needs `useLocation` + `location.state`, which is out of scope. It is listed as a "next step" in the README.
* `HashRouter` is **explained and compared** in the README (and tried as a local one-line experiment), but the shipped app uses `BrowserRouter`.

### 1.3 Variant Recommendation
* **Recommended Variant:** **Variant A ("HackHQ Router")**: copy Day 6 `hackhq-live` into `Day-07/hackhq-router` and convert it.
* **Rationale:**
  * **Before/After Story:** Day 6 already has fake routing (`activeStation` state + `hidden` panels). Replacing it with real routes shows exactly what a router solves: URL ↔ UI sync, refresh, deep links, and history.
  * **Data Reuse:** The Swag catalog (`data/products.js`) gives Products list and detail pages. The DummyJSON directory + `useFetch` gives "fetch data based on params" for free.
  * **Portfolio Continuity:** Days 5 → 6 → 7 remain one coherent, growing app.
* **Fallback:** If the copy has unexpected breakage, scaffold **Variant B ("Router Lab")**, a minimal Vite app with the same route tree and placeholder pages. Route specs in Section 6 stay unchanged.

### 1.4 Assumptions
1. **Toolchain:** macOS Apple Silicon, zsh, Node v20, npm 10, Vite + React 19 (JavaScript), StrictMode enabled.
2. **Router Version:** `npm install react-router-dom` installs the current major version. We use **declarative mode** only (`<BrowserRouter>` + `<Routes>`), whose API matches the "v6 complete guide" tutorials. Optional segments (`:userId?`) are supported.
3. **Dev Server:** Vite's dev server and `vite preview` already serve `index.html` for unknown paths, so deep links work locally without extra config.
4. **API Access:** DummyJSON (`https://dummyjson.com/users/{id}/posts`) remains reachable without auth, as on Day 6.
5. **Execution Division:** Ronit runs all Git mutations, installs, and manual UI checks; the agent creates/edits files and runs read-only audits.

### 1.5 Pre-Flight (Before M0)
Day 6 still has 5 uncommitted one-line deletions on `day6/readme` (`useDebounce.js`, `useLocalStorage.js`, `useStopwatch.js`, `useWindowSize.js`, `format.js`). Ronit should review (`git diff`), then commit or discard them **before** copying Day 6, so Day 7 starts from a known state.

### 1.6 Decisions (confirmed by Ronit, 31 Oct 2026)
1. **Variant A** confirmed: build in `Day-07/hackhq-router`.
2. **Station state:** only the **cart** is lifted and persisted. Other station resets on navigation are documented as expected routing behaviour.
3. **Organizer login:** fake passcode (`hackhq`) stored in `useLocalStorage`, labelled "demo only, not real security."
4. **Wow-factor upgrades:** approved, folded into M1–M3 (Section 1.7). Same strict scope: CSS + allowed hooks, no new libraries.

### 1.7 Wow-Factor Upgrades
Day 6 felt sluggish partly because all 8 stations stayed mounted (`hidden`), so every toast or theme change re-rendered all of them, including the clock and the effect demos. Routing alone fixes that: only the matched page is mounted. On top of that:

| # | Feature | Milestone | How (in scope) | Routing Concept It Shows Off |
|---|---|---|---|---|
| W1 | **Page entrance animations** | M1 | CSS `@keyframes` on the page wrapper; route elements mount fresh, so the animation replays on every navigation. Disabled under `prefers-reduced-motion`. | Routes mount/unmount |
| W2 | **"Signal Lost" 404** | M1 | Animated CSS static/scanline screen, big `404`, suggested `<Link>`s to popular routes | Catch-all `*` route |
| W3 | **Live Route Badge** | M2 | `RouteBadge` pill in each page header showing the matched pattern + live params, e.g. `/swag/:productId → swag-tee`; pages pass their pattern, params come from `useParams` | Dynamic segments |
| W4 | **Hero Product Page** | M2 | Large CSS-drawn product visual per category, sticky "Add to cart" bar, previous/next product `<Link>`s | `useParams`, URL-driven browsing |
| W5 | **⌘K Command Palette** | M3 | `keydown` listener in `useEffect` (with cleanup); filtered list of every route + every product + every station; ↑/↓/Enter; `navigate(path)` on select | Programmatic navigation |

---

## 2. Milestone Overview Table

| Milestone | Branch | Estimated Time | Primary Outputs | Done When |
|---|---|---|---|---|
| **R: Research & Notes** | *(none)* | 2:30 | Tutorials (2–3 h total incl. M-work), reactrouter.com declarative-mode docs | Mental models for client-side routing, BrowserRouter vs HashRouter, route matching, push vs replace written in notes. |
| **M0: Setup & Router Install** | `day7/setup` | 0:30 | `hackhq-router` copy, `react-router-dom` installed, `<BrowserRouter>` in `main.jsx` | `npm run lint`, `npm test`, `npm run build` pass; app renders unchanged inside the router. |
| **M1: Layout, Pages & NavLink** | `day7/routes` | 1:15 | `AppLayout.jsx`, `Home`, `About`, `NotFound`, station pages as routes, NavLink sidebar | Every station has a URL; refresh keeps the page; Back/Forward work; active link highlighted; `/nope` shows 404. |
| **M2: Dynamic Routes** | `day7/dynamic-routes` | 1:15 | `/swag` + `/swag/:productId`, `/directory/:userId?`, lifted cart | Product detail reads `useParams`; unknown product shows not-found state; directory posts are driven by URL, not state. |
| **M3: Programmatic Navigation** | `day7/navigation` | 1:00 | `Contact` + `ContactSent`, Back buttons, `NavPatterns` page, legacy `<Navigate>` redirect | Form submit navigates with `replace`; Back works; push/replace/back/forward demos behave as documented. |
| **M4: Protected Routes (Bonus)** | `day7/protected-routes` | 0:50 | `ProtectedRoute.jsx`, `Login.jsx`, `/organizer` nested area | Logged-out visit to `/organizer/*` redirects to `/login`; login uses `replace`; logout returns to Home. |
| **M5: Documentation & Evidence** | `day7/readme` | 0:50 | `README.md`, `docs/FACTS.md`, `docs/STANDUP.md`, screenshots | Grep audits pass; README explains every routing concept truthfully with relative links. |
| **P1: Extras (Optional)** | `day7/extras` | 0:30 | Per-route `document.title`, static-host rewrite files | Tab title changes per page; `public/_redirects` and `vercel.json` documented. |

---

## 3. Milestone Execution Details

### Milestone R: Foundational Research & Mental Models
* **Objective:** Watch 2–3 h of React Router tutorials (Codevolution, Web Dev Simplified, Net Ninja, Traversy Media). Read reactrouter.com **declarative mode** pages: Installation, Routing (nested, index, layout, dynamic and optional segments, splats), Navigating (`Link`, `NavLink`, `useNavigate`), and the `BrowserRouter` / `HashRouter` API references.
* **Files Created by Agent:** None (concept discussion).
* **Commands Run by Ronit:** None.
* **Explain-Back Questions:**
  1. *What is client-side routing?* (The browser loads one `index.html`; the router reads the URL and decides which components to render, updating the URL through the History API without a full page reload.)
  2. *Why does `<a href>` break a single-page app but `<Link>` doesn't?* (`<a>` makes the browser request a new document, which reloads the whole app and wipes in-memory state; `<Link>` calls `history.pushState` and lets React re-render.)
  3. *BrowserRouter vs HashRouter?* (BrowserRouter uses clean paths like `/swag/tee` but needs the server to return `index.html` for every path; HashRouter puts the route after `#` (`/#/swag/tee`), which servers ignore, so it works on any static host but has uglier URLs and is worse for SEO.)

---

### Milestone M0: Setup, Router Install & Baseline
* **Scope:** Branch `day7/setup`. Copy Day 6 app (without `node_modules`/`dist`), install `react-router-dom`, wrap `<App />` in `<BrowserRouter>`.
* **Files Created/Edited by Agent:**
  * `Day-07/hackhq-router/src/main.jsx` (wrap in `<BrowserRouter>` inside `<StrictMode>`)
  * `Day-07/hackhq-router/package.json` (name/description update only; the dependency is added by Ronit's install)
* **Commands Run by Ronit:**
  ```bash
  # Step 1: Switch to main, pull latest, and branch
  git switch main && git pull
  git switch -c day7/setup

  # Step 2: Copy Day 6 app without build artefacts
  mkdir -p Day-07
  rsync -a --exclude node_modules --exclude dist Day-06/hackhq-live/ Day-07/hackhq-router/
  cd Day-07/hackhq-router
  npm install
  # (Expected: dependencies restored, no errors)

  git add .
  git commit -m "chore: add Day 7 app copied from Day 6"

  # Step 3: Install React Router
  npm install react-router-dom
  # (Expected: react-router-dom added to "dependencies" in package.json)

  # Step 4: After agent edits main.jsx, verify baseline
  npm run lint && npm test && npm run build

  # Step 5: Commit
  git status
  git add package.json package-lock.json src/main.jsx
  git diff --staged
  git commit -m "chore: install react-router-dom and wrap app in BrowserRouter"
  git push -u origin day7/setup
  ```
* **Agent Read-Only Verification:**
  * `npm ls react-router-dom` shows a single installed version under `dependencies`.
  * `main.jsx` contains exactly one `<BrowserRouter>` (a router must never be nested in another router).
  * `git log --oneline -2` shows two clean commits.
* **Explain-Back Questions:**
  1. *Why is react-router-dom a dependency and not a devDependency?* (Its code ships in the browser bundle and runs at runtime.)
  2. *Why does `<BrowserRouter>` wrap `<App />` in `main.jsx` and not live inside a page?* (Every `Link`, `Routes`, and router hook must be a descendant of exactly one router.)
  3. *One thing Ronit explains alone:* Why the app looks identical after M0 even though routing is "installed."

---

### Milestone M1: Layout Route, Pages, NavLink & 404
* **Scope:** Branch `day7/routes`. Replace the `activeStation` state and `hidden` panels with `<Routes>`. Add a layout route, an index route (Home), About, a catch-all 404, and convert the sidebar to `NavLink`.
* **Files Created/Edited by Agent:**
  * `src/components/layout/AppLayout.jsx`: Header + Navigation + `<main><Outlet /></main>` + Toasts + ViewportBadge
  * `src/pages/Home.jsx`: mission-control overview; each station card is a `<Link>`
  * `src/pages/About.jsx`: event + project info; one deliberate `<a href>` vs `<Link>` comparison with an on-screen note
  * `src/pages/NotFound.jsx`: "Unknown station" 404 with `<Link to="/">`
  * `src/pages/stations/*.jsx`: thin page wrappers (breadcrumb + title) around existing station components
  * `src/data/stations.js`: add `path` to each station (`/directory`, `/clock`, `/patterns`, `/checklist`, `/teams`, `/swag`, `/about`, `/contact`)
  * `src/components/Navigation.jsx`: `<button role="tab">` → `<NavLink>` with `className={({ isActive }) => ...}`; remove tab ARIA roles (links are not tabs); `NavLink` adds `aria-current="page"` automatically
  * `src/App.jsx`: keeps theme, X-ray, toasts, laps state; renders the `<Routes>` tree; deletes `activeStation`
  * `src/index.css`: **W1** page entrance animation, **W2** "Signal Lost" 404 styles
* **Commands Run by Ronit:**
  ```bash
  git switch main && git pull
  git switch -c day7/routes

  # Commit 1: layout route
  git add src/components/layout/AppLayout.jsx src/App.jsx
  git diff --staged
  git commit -m "feat: add app layout route with Outlet"

  # Commit 2: pages
  git add src/pages/Home.jsx src/pages/About.jsx src/pages/NotFound.jsx src/pages/stations/ src/App.jsx
  git diff --staged
  git commit -m "feat: add home, about, station and 404 routes"

  # Commit 3: NavLink sidebar
  git add src/components/Navigation.jsx src/data/stations.js src/index.css
  git diff --staged
  git commit -m "feat: replace station tabs with NavLink navigation"

  npm run lint && npm test && npm run build
  git push -u origin day7/routes
  ```
* **Agent Read-Only Verification:**
  * `grep -rn "activeStation\|hidden={" src/` returns 0 matches.
  * The Home `NavLink` uses `end` (otherwise `/` would be "active" on every page).
  * The `path="*"` route is the last child of the layout route, so 404 keeps the header and sidebar.
  * No `<a href="/...">` for internal navigation except the single labelled demo on About.
* **Explain-Back Questions:**
  1. *What is the difference between a layout route, an index route, and a nested route?* (Layout: a parent with `element` but no own content, which renders children through `<Outlet />`. Index: the child shown at the parent's exact URL. Nested: child paths are relative to the parent.)
  2. *Why did Check-in's count reset after navigating away, when it didn't on Day 5?* (Day 5 hid panels with `hidden`, so they stayed mounted. A route that stops matching **unmounts** its element, and local `useState` is destroyed.)
  3. *One thing Ronit explains alone:* How `NavLink` knows which link is active, and why `end` is needed for `/`.

---

### Milestone M2: Dynamic Routes, `useParams` & Param-Driven Fetching
* **Scope:** Branch `day7/dynamic-routes`. Split Swag into list + detail pages. Make the directory's selected user part of the URL. Lift the cart so it survives list ↔ detail navigation.
* **Files Created/Edited by Agent:**
  * `src/lib/routes.js`: pure helpers `productPath(id)`, `userPath(id)`, `findProduct(id)`, `parseUserId(param)` (returns a positive integer or `null`)
  * `test/routes.test.js`: Vitest tests for the helpers (valid/invalid ids, unknown product)
  * `src/pages/swag/SwagList.jsx`: product grid; each card `<Link to={productPath(p.id)}>`
  * `src/pages/swag/ProductDetail.jsx`: `const { productId } = useParams()`, then `findProduct`; Add to cart; in-page "Product not found" state if missing
  * `src/components/stations/SwagStation.jsx`: receives `cart` / `setCart` as props instead of owning them
  * `src/pages/stations/DirectoryPage.jsx`: `const { userId } = useParams()` (optional), `parseUserId`; passes it to `Directory` + `UserPosts`
  * `src/components/directory/Directory.jsx`: `onSelectUser` → `navigate(userPath(id))`
  * `src/components/directory/UserPosts.jsx`: close → `navigate('/directory')`; `useFetch(buildUserPostsUrl(userId))` unchanged
  * `src/App.jsx`: `const [cart, setCart] = useLocalStorage('hackhq_cart', [])`; routes `swag` (index list + `:productId`) and `directory/:userId?`; delete `selectedUserId` state
  * `src/components/layout/RouteBadge.jsx`: **W3** live pattern + params pill
  * `src/pages/swag/ProductDetail.jsx`: **W4** hero layout, sticky cart bar, previous/next links
* **Commands Run by Ronit:**
  ```bash
  git switch main && git pull
  git switch -c day7/dynamic-routes

  git add src/lib/routes.js test/routes.test.js
  git commit -m "feat: add route path helpers with tests"

  git add src/pages/swag/ src/components/stations/SwagStation.jsx src/App.jsx
  git diff --staged
  git commit -m "feat: add products list and product detail route"

  git add src/pages/stations/DirectoryPage.jsx src/components/directory/ src/App.jsx
  git diff --staged
  git commit -m "feat: drive directory posts from userId route param"

  npm run lint && npm test && npm run build
  git push -u origin day7/dynamic-routes
  ```
* **Agent Read-Only Verification:**
  * `grep -rn "selectedUserId" src/` returns 0 matches (the URL is the single source of truth).
  * `useParams` is used in exactly `ProductDetail.jsx` and `DirectoryPage.jsx`.
  * Fast switching between `/directory/1` → `/directory/2` still aborts the stale request (Day 6 `useFetch` cleanup).
  * `/swag/does-not-exist` and `/directory/abc` show friendly not-found states, not crashes.
* **Explain-Back Questions:**
  1. *What type is every value from `useParams`, and why does it matter?* (Always a string or `undefined`; `/directory/7` gives `"7"`, so we parse and validate before using it as a number.)
  2. *Why is putting `userId` in the URL better than `useState`?* (Shareable/bookmarkable, survives refresh, Back button returns to the previous user, and there is no duplicate state to keep in sync.)
  3. *One thing Ronit explains alone:* What happens, step by step, when the URL changes from `/directory/1` to `/directory/2` (same component stays mounted → param changes → `useFetch` dependency changes → cleanup aborts old request → new fetch).

---

### Milestone M3: Programmatic Navigation, Replace vs Push & Redirects
* **Scope:** Branch `day7/navigation`. Contact form with navigate-on-submit, Back buttons, a Navigation Patterns teaching page, and a legacy redirect.
* **Files Created/Edited by Agent:**
  * `src/pages/Contact.jsx`: controlled form (name, email, topic, message), reusing `lib/validation.js` patterns; on valid submit → `navigate('/contact/sent', { replace: true })`
  * `src/pages/ContactSent.jsx`: confirmation with `<Link to="/">` and a "Send another" link
  * `src/components/layout/BackButton.jsx`: `onClick={() => navigate(-1)}`, used on `ProductDetail` and `UserPosts`
  * `src/pages/NavPatterns.jsx`: four cards like Day 6's EffectPatterns: **Push** (`navigate('/swag')`), **Replace** (`navigate('/swag', { replace: true })`), **Back/Forward** (`navigate(-1)` / `navigate(1)`), **Declarative redirect** (link to `/shop`). Each card explains what Back will do afterwards.
  * `src/App.jsx`: routes `contact`, `contact/sent`, `patterns/navigation`, and `shop` → `<Navigate to="/swag" replace />`
  * `src/components/layout/CommandPalette.jsx`: **W5** ⌘K / Ctrl+K palette; `keydown` listener added and removed in `useEffect`; `navigate(path)` on Enter or click
* **Commands Run by Ronit:**
  ```bash
  git switch main && git pull
  git switch -c day7/navigation

  git add src/pages/Contact.jsx src/pages/ContactSent.jsx src/App.jsx src/data/stations.js
  git commit -m "feat: add contact form that navigates on submit"

  git add src/components/layout/BackButton.jsx src/pages/swag/ProductDetail.jsx src/components/directory/UserPosts.jsx
  git commit -m "feat: add back buttons using navigate(-1)"

  git add src/pages/NavPatterns.jsx src/App.jsx
  git commit -m "feat: add navigation patterns page and legacy redirect"

  npm run lint && npm test && npm run build
  git push -u origin day7/navigation
  ```
* **Agent Read-Only Verification:**
  * `navigate(...)` is only called inside event handlers, never during render (render-time redirects use `<Navigate>`).
  * The Contact submit handler calls `event.preventDefault()` before navigating.
  * After submitting Contact, pressing Back skips `/contact` (the replace was effective).
* **Explain-Back Questions:**
  1. *Push vs replace: what does each do to the history stack?* (Push adds a new entry, so Back returns to the previous page. Replace overwrites the current entry, so Back skips it. Use replace after form submit, login, and redirects so Back doesn't land on a stale screen.)
  2. *`<Navigate>` vs `useNavigate()`: when do you use each?* (`<Navigate>` for redirects decided **during render**, such as legacy paths or guards. `useNavigate()` for navigation in response to **events**: submit, click.)
  3. *One thing Ronit explains alone:* Why calling `navigate()` directly in a component body is a bug.

---

### Milestone M4: Protected Routes (Bonus)
* **Scope:** Branch `day7/protected-routes`. A fake organizer login guarding a nested `/organizer` area that hosts the Check-in and State Lab stations.
* **Files Created/Edited by Agent:**
  * `src/components/auth/ProtectedRoute.jsx`: `({ isAllowed, redirectTo = '/login' }) => isAllowed ? <Outlet /> : <Navigate to={redirectTo} replace />`
  * `src/pages/Login.jsx`: passcode form; on success `onLogin()` then `navigate('/organizer', { replace: true })`; inline error on wrong code; if already logged in → `<Navigate to="/organizer" replace />`
  * `src/pages/organizer/OrganizerHome.jsx`: index page with links to sub-pages + Logout button (`onLogout()` → `navigate('/')`)
  * `src/App.jsx`: `const [isOrganizer, setIsOrganizer] = useLocalStorage('hackhq_organizer', false)`; route tree: `<Route element={<ProtectedRoute isAllowed={isOrganizer} />}>` → `organizer` (index, `checkin`, `lab`)
  * `src/components/Header.jsx`: shows "Organizer" badge + Login/Logout link based on the prop
* **Commands Run by Ronit:**
  ```bash
  git switch main && git pull
  git switch -c day7/protected-routes

  git add src/components/auth/ProtectedRoute.jsx src/pages/Login.jsx
  git commit -m "feat: add ProtectedRoute guard and login page"

  git add src/pages/organizer/ src/App.jsx src/components/Header.jsx src/data/stations.js
  git commit -m "feat: move check-in and state lab behind organizer route"

  npm run lint && npm test && npm run build
  git push -u origin day7/protected-routes
  ```
* **Agent Read-Only Verification:**
  * Typing `/organizer/lab` in the address bar while logged out lands on `/login`, and Back does **not** loop to the guarded URL.
  * The guard is a layout route, so one `ProtectedRoute` protects all organizer children.
  * README and the Login page both state: "Demo guard only. Real auth must be enforced by the server."
* **Explain-Back Questions:**
  1. *Why is a client-side route guard not real security?* (All JS ships to the browser; anyone can flip `localStorage` or read the bundle. Guards are UX; the server must protect data.)
  2. *Why does the guard use `replace` when redirecting?* (Otherwise Back from `/login` returns to the guarded URL, which redirects again, creating a Back-button trap.)
  3. *One thing Ronit explains alone:* How wrapping routes in a pathless layout route applies one guard to many pages.

---

### Milestone M5: Documentation, Audits, Evidence & Standup
* **Scope:** Branch `day7/readme`. README with routing concepts, facts sheet, screenshots, standup script.
* **Files Created/Edited by Agent:**
  * `README.md`: overview, **route tree table**, concept sections (client-side routing, BrowserRouter vs HashRouter, Routes/Route/Link/NavLink/Navigate/Outlet, dynamic + optional params, push vs replace, nested/index/layout routes, 404, protected routes), "Day 6 → Day 7 before/after", strict-scope table, known limitations, run instructions
  * `docs/FACTS.md`: verified route count, file counts, test count, grep audit output
  * `docs/STANDUP.md`: 4-minute script built only from repo facts
* **Commands Run by Ronit:**
  ```bash
  git switch main && git pull
  git switch -c day7/readme

  git add README.md docs/FACTS.md docs/STANDUP.md
  git commit -m "docs: add README with routing concepts and route map"

  git add docs/screenshots/
  git commit -m "docs: add screenshots"

  npm run lint && npm test && npm run build && npm run format -- --check
  git push -u origin day7/readme
  ```
* **Agent Read-Only Verification:**
  * Forbidden-hook grep: `useReducer|useContext|createContext|useRef|useMemo|useCallback|useLayoutEffect` → 0 matches.
  * Forbidden-router grep: `useLocation|useSearchParams|useOutletContext|useMatch|createBrowserRouter|RouterProvider|loader|useLoaderData` → 0 matches.
  * Forbidden-library grep: `axios|tanstack|swr|redux|zustand` → 0 matches.
  * Every route listed in the README table exists in `App.jsx`, and vice versa.
  * No `TODO` / `PASTE` placeholders; all README links relative.
* **Explain-Back Questions:**
  1. *If this app were deployed to a static host, what would break and how do you fix it?* (Refreshing `/swag/swag-tee` returns the host's 404 because no such file exists. Fix: a rewrite rule sending all paths to `index.html`, or switch to `HashRouter`.)
  2. *One thing Ronit explains alone:* Walk the route tree from `<BrowserRouter>` down to `ProductDetail`.

---

### Milestone P1: Extras (Optional / Stretch)
* **Scope:** Branch `day7/extras`. Small, in-scope polish only.
* **Files Created/Edited by Agent:**
  * `src/hooks/useDocumentTitle.js`: `useEffect(() => { document.title = \`${title} · HackHQ\` }, [title])`, called by each page (Day 6 effect pattern reused)
  * `public/_redirects` (`/* /index.html 200`) and `vercel.json` (rewrite to `/index.html`): static-host SPA fallbacks, documented in README (no deployment required today)
* **Commands Run by Ronit:**
  ```bash
  git switch main && git pull
  git switch -c day7/extras
  git add src/hooks/useDocumentTitle.js src/pages/
  git commit -m "feat: set document title per route"
  git add public/_redirects vercel.json README.md
  git commit -m "chore: add SPA rewrite rules for static hosts"
  npm run lint && npm test && npm run build
  git push -u origin day7/extras
  ```

---

## 4. Complete Commit Plan

| # | Milestone | Branch | Commit Message | Target Files | Key Concept Taught |
|---|---|---|---|---|---|
| 1 | M0 | `day7/setup` | `chore: add Day 7 app copied from Day 6` | `Day-07/hackhq-router/*` | Clean baseline before routing |
| 2 | M0 | `day7/setup` | `chore: install react-router-dom and wrap app in BrowserRouter` | `package.json`, `package-lock.json`, `src/main.jsx` | Single router at the root |
| 3 | M1 | `day7/routes` | `feat: add app layout route with Outlet` | `AppLayout.jsx`, `App.jsx` | Layout routes, `<Outlet />` |
| 4 | M1 | `day7/routes` | `feat: add home, about, station and 404 routes` | `src/pages/*`, `App.jsx` | `Routes`/`Route`, index route, `path="*"` |
| 5 | M1 | `day7/routes` | `feat: replace station tabs with NavLink navigation` | `Navigation.jsx`, `stations.js`, `index.css` | `NavLink`, `isActive`, `end`, `aria-current` |
| 6 | M2 | `day7/dynamic-routes` | `feat: add route path helpers with tests` | `lib/routes.js`, `test/routes.test.js` | Param parsing/validation as pure functions |
| 7 | M2 | `day7/dynamic-routes` | `feat: add products list and product detail route` | `pages/swag/*`, `SwagStation.jsx`, `App.jsx` | `:productId`, `useParams`, lifting state across routes |
| 8 | M2 | `day7/dynamic-routes` | `feat: drive directory posts from userId route param` | `DirectoryPage.jsx`, `directory/*`, `App.jsx` | Optional param `:userId?`, fetch based on params |
| 9 | M3 | `day7/navigation` | `feat: add contact form that navigates on submit` | `Contact.jsx`, `ContactSent.jsx`, `App.jsx` | `useNavigate`, `replace` on submit |
| 10 | M3 | `day7/navigation` | `feat: add back buttons using navigate(-1)` | `BackButton.jsx`, `ProductDetail.jsx`, `UserPosts.jsx` | History delta navigation |
| 11 | M3 | `day7/navigation` | `feat: add navigation patterns page and legacy redirect` | `NavPatterns.jsx`, `App.jsx` | Push vs replace, back/forward, `<Navigate>` |
| 12 | M4 | `day7/protected-routes` | `feat: add ProtectedRoute guard and login page` | `ProtectedRoute.jsx`, `Login.jsx` | Route guard, redirect to login |
| 13 | M4 | `day7/protected-routes` | `feat: move check-in and state lab behind organizer route` | `pages/organizer/*`, `App.jsx`, `Header.jsx` | Pathless guard layout over nested routes |
| 14 | M5 | `day7/readme` | `docs: add README with routing concepts and route map` | `README.md`, `docs/*.md` | Truthful documentation |
| 15 | M5 | `day7/readme` | `docs: add screenshots` | `docs/screenshots/*` | Evidence |
| 16 | P1 | `day7/extras` | `feat: set document title per route` | `useDocumentTitle.js`, pages | Effect synced to route |
| 17 | P1 | `day7/extras` | `chore: add SPA rewrite rules for static hosts` | `public/_redirects`, `vercel.json` | History fallback on servers |

---

## 5. Pull Request (PR) Plan

| PR # | Branch | Title | Description Outline | Merge Method |
|---|---|---|---|---|
| **PR 1** | `day7/setup` | `Setup: Day 7 app and React Router install` | Copies Day 6 HackHQ, installs `react-router-dom`, wraps the app in `BrowserRouter`. No visual change. | Create a merge commit |
| **PR 2** | `day7/routes` | `Feature: layout route, pages, NavLink sidebar, 404` | Replaces `activeStation` tab state with real URLs; adds Home/About/404 and active-link styling. | Create a merge commit |
| **PR 3** | `day7/dynamic-routes` | `Feature: product detail and URL-driven directory` | Adds `/swag/:productId` and `/directory/:userId?` with `useParams`; lifts the cart into persisted App state. | Create a merge commit |
| **PR 4** | `day7/navigation` | `Feature: programmatic navigation and redirects` | Contact submit with `replace`, Back buttons, push/replace patterns page, `/shop` → `/swag` redirect. | Create a merge commit |
| **PR 5** | `day7/protected-routes` | `Feature: organizer route guard (bonus)` | Demo login + `ProtectedRoute` layout guarding `/organizer/*`. | Create a merge commit |
| **PR 6** | `day7/readme` | `Docs: routing README, facts sheet, evidence` | Concept guide, route map, audits, screenshots, standup script. | Create a merge commit |
| **PR 7** *(Opt)* | `day7/extras` | `Feature: per-route titles and SPA rewrites` | `useDocumentTitle` hook and static-host fallback configs. | Create a merge commit |

---

## 6. Route Specifications

### 6.1 Route Tree (`src/App.jsx`)
```jsx
<Routes>
  <Route element={<AppLayout {...layoutProps} />}>               {/* layout route */}
    <Route index element={<Home />} />                           {/* /            */}
    <Route path="about" element={<About />} />
    <Route path="directory/:userId?" element={<DirectoryPage />} /> {/* optional param */}
    <Route path="swag">
      <Route index element={<SwagList cart={cart} setCart={setCart} />} />
      <Route path=":productId" element={<ProductDetail cart={cart} setCart={setCart} />} />
    </Route>
    <Route path="clock" element={<ClockPage laps={laps} ... />} />
    <Route path="patterns" element={<PatternsPage />} />
    <Route path="patterns/navigation" element={<NavPatterns />} />
    <Route path="checklist" element={<ChecklistPage />} />
    <Route path="teams" element={<TeamsPage />} />
    <Route path="contact" element={<Contact />} />
    <Route path="contact/sent" element={<ContactSent />} />
    <Route path="login" element={<Login isOrganizer={isOrganizer} onLogin={...} />} />
    <Route element={<ProtectedRoute isAllowed={isOrganizer} />}>  {/* pathless guard */}
      <Route path="organizer">
        <Route index element={<OrganizerHome onLogout={...} />} />
        <Route path="checkin" element={<CheckInPage />} />
        <Route path="lab" element={<StateLabPage />} />
      </Route>
    </Route>
    <Route path="shop" element={<Navigate to="/swag" replace />} /> {/* legacy redirect */}
    <Route path="*" element={<NotFound />} />                    {/* 404 */}
  </Route>
</Routes>
```

### 6.2 Route Table

| URL | Element | Concept Demonstrated |
|---|---|---|
| `/` | `Home` | Index route, `<Link>` cards |
| `/about` | `About` | Static route, `<a>` vs `<Link>` demo |
| `/directory` | `DirectoryPage` (no user) | Optional param absent → "Select a participant" |
| `/directory/:userId` | `DirectoryPage` + `UserPosts` | `useParams`, fetch by param, abort on change |
| `/swag` | `SwagList` | Nested index route, products list |
| `/swag/:productId` | `ProductDetail` | Dynamic segment, not-found state, Back button |
| `/clock`, `/patterns`, `/checklist`, `/teams` | Existing stations | Day 5/6 features as routes |
| `/patterns/navigation` | `NavPatterns` | Push, replace, back, forward |
| `/contact` → `/contact/sent` | `Contact`, `ContactSent` | Navigate on submit with `replace` |
| `/login` | `Login` | Redirect target, navigate after login |
| `/organizer`, `/organizer/checkin`, `/organizer/lab` | Guarded pages | Protected layout route |
| `/shop` | `<Navigate to="/swag" replace />` | Declarative redirect |
| anything else | `NotFound` | Catch-all `*` |

**Deliverable check:** 13+ distinct routes (requirement: at least 5).

### 6.3 Component Contracts
* **`AppLayout`**: props `theme`, `onToggleTheme`, `xrayOn`, `onToggleXray`, `isOrganizer`, `toasts`, `onDismissToast`. Renders Header, Navigation, `<Outlet />`, ToastContainer, ViewportBadge.
* **`Navigation`**: maps `STATIONS` to `<NavLink to={s.path} end={s.path === '/'} className={({ isActive }) => \`nav-button ${isActive ? 'active' : ''}\`}>`. Keeps the existing icon + accent bar, shown via `isActive` from the children render function.
* **`ProductDetail`**: `useParams().productId` → `findProduct(id)`. Missing → "Product not found" panel with `<Link to="/swag">`. Never throws.
* **`DirectoryPage`**: `parseUserId(useParams().userId)`. `undefined` → placeholder; invalid (`"abc"`, `"0"`, `"-3"`) → "Unknown participant" panel; valid → `<UserPosts userId={n} />`.
* **`ProtectedRoute`**: `isAllowed ? <Outlet /> : <Navigate to={redirectTo} replace />`. No side effects.
* **`Contact`**: controlled inputs, `touched` + derived errors (Day 5 pattern), `useId` for label wiring, `navigate('/contact/sent', { replace: true })` on valid submit.

---

## 7. Traceability Matrix

| Req ID | Requirement (Day 7 Task) | Implementation Location | Proven By |
|---|---|---|---|
| **V-1** | Watch tutorials (2–3 h) | Tracker row, README learning log | Logged titles and time |
| **V-2** | Read reactrouter.com docs | Milestone R | Explain-back answers |
| **IN-1** | `npm install react-router-dom` | `package.json` | `npm ls react-router-dom` |
| **IN-2** | BrowserRouter vs HashRouter | `main.jsx`, README section | README comparison + local HashRouter experiment |
| **BR-1** | Setup BrowserRouter | `main.jsx` | Single router at root |
| **BR-2** | Route components inside `Routes` | `App.jsx` | Route tree (6.1) |
| **BR-3** | Navigate between pages | `Navigation.jsx`, `Home.jsx` | Click-through, URL changes |
| **BR-4** | Link vs anchor tags | `About.jsx`, README | Demo: `<a>` reloads (Network tab shows document request), `<Link>` doesn't |
| **RC-1** | `NavLink` active styling | `Navigation.jsx` | Active highlight + `aria-current="page"` |
| **RC-2** | `Navigate` component | `App.jsx` (`/shop`), `ProtectedRoute.jsx`, `Login.jsx` | Redirects with `replace` |
| **DR-1** | URL parameters `:id` | `/swag/:productId`, `/directory/:userId?` | Detail pages render from URL |
| **DR-2** | `useParams` hook | `ProductDetail.jsx`, `DirectoryPage.jsx` | grep + UI |
| **DR-3** | Fetch data based on params | `DirectoryPage` → `UserPosts` → `useFetch` | Network tab per user id, aborts on change |
| **DR-4** | Optional parameters | `directory/:userId?` | `/directory` and `/directory/3` both match |
| **NV-1** | `useNavigate` programmatic navigation | `Contact.jsx`, `Directory.jsx`, `Login.jsx`, `NavPatterns.jsx` | UI walkthrough |
| **NV-2** | Navigate on events (submit, click) | Contact submit, directory row click | UI walkthrough |
| **NV-3** | Go back / forward | `BackButton.jsx`, `NavPatterns.jsx` | `navigate(-1)` / `navigate(1)` |
| **NV-4** | Replace vs push | `NavPatterns.jsx`, Contact, Login | Back-button behaviour differs as documented |
| **AP-1** | Nested routes | `swag/*`, `organizer/*` | Route tree |
| **AP-2** | Index routes | `/`, `/swag`, `/organizer` | Route tree |
| **AP-3** | Layout routes | `AppLayout`, `ProtectedRoute` | `<Outlet />` usage |
| **AP-4** | 404 Not Found page | `NotFound.jsx`, `path="*"` | `/nope` renders 404 inside layout |
| **AP-5** | Redirect / Navigate component | `/shop` route | `/shop` lands on `/swag`, Back skips `/shop` |
| **PR-1** | Conditional rendering guard | `ProtectedRoute.jsx` | Code review |
| **PR-2** | Authentication check | `isOrganizer` (`useLocalStorage`) | Toggle login/logout |
| **PR-3** | Redirect to login | `ProtectedRoute.jsx` | Logged-out `/organizer/lab` → `/login` |
| **PR-4** | Route guards concept | README section | Honest "UX, not security" note |
| **APP-1** | Home page | `Home.jsx` | `/` |
| **APP-2** | About page | `About.jsx` | `/about` |
| **APP-3** | Products list page | `SwagList.jsx` | `/swag` |
| **APP-4** | Product detail (dynamic) | `ProductDetail.jsx` | `/swag/:productId` |
| **APP-5** | Contact page with form | `Contact.jsx` | `/contact` |
| **APP-6** | 404 page | `NotFound.jsx` | Unknown URL |
| **APP-7** | Navigation header with active links | `Navigation.jsx`, `Header.jsx` | NavLink highlight |
| **D1** | Multi-page React application | `hackhq-router` | Route tree |
| **D2** | At least 5 routes | `App.jsx` | 13+ routes |
| **D3** | Navigation header with NavLink | `Navigation.jsx` | grep `NavLink` |
| **D4** | Dynamic route with `useParams` | `ProductDetail.jsx`, `DirectoryPage.jsx` | grep `useParams` |
| **D5** | 404 error page | `NotFound.jsx` | UI |
| **D6** | Programmatic navigation examples | Contact, BackButton, NavPatterns, Login | UI |
| **D7** | Protected route example (bonus) | `ProtectedRoute.jsx`, `/organizer` | UI |
| **D8** | README with routing concepts | `README.md` | Concepts + route map |
| **NFR-1** | Responsive at 375 / 768 / 1280 px | Layout | DevTools device toolbar |
| **NFR-2** | Keyboard operable; links are real `<a>` elements | `NavLink`, `Link` | Tab-through, no buttons faking links |
| **NFR-3** | Zero console errors/warnings in StrictMode | Console | Clean console on every route |
| **NFR-4** | `npm run lint` 0 errors, no disable comments | ESLint | Lint output |
| **NFR-5** | `npm test` + `npm run build` + Prettier pass | Scripts | Command output |
| **NFR-6** | Strict-scope APIs only (Section 1.2) | grep audits | 0 matches |
| **NFR-7** | Truthful README, relative links | `README.md` | Review |

---

## 8. Risks, Gotchas & The Cut Line

### 8.1 Technical Risks & Playbook
1. **State lost on navigation:**
   * *Risk:* Routes unmount elements; the Swag cart would empty when opening a product detail.
   * *Mitigation:* Lift `cart` to `App.jsx` with `useLocalStorage` and pass it as props. Other station resets are documented as the expected routing behaviour.
2. **`/` NavLink always active:**
   * *Risk:* Every path starts with `/`.
   * *Mitigation:* `end` prop on the Home link.
3. **Relative vs absolute paths:**
   * *Risk:* `<Link to="tee">` inside `/swag` resolves relative to the current route. Mixing styles causes `/swag/swag/tee` bugs.
   * *Mitigation:* All links built with `lib/routes.js` helpers that return absolute paths (`/swag/${id}`).
4. **Deep-link refresh on static hosts:**
   * *Risk:* Fine on Vite dev/preview, but 404 on hosts without SPA fallback.
   * *Mitigation:* Documented in README; P1 adds `_redirects` / `vercel.json`. HashRouter is the alternative.
5. **`navigate()` during render:**
   * *Risk:* React warning and possible loops.
   * *Mitigation:* Render-time redirects use `<Navigate>`; `useNavigate` only in event handlers.
6. **Guard redirect loop / Back-button trap:**
   * *Mitigation:* `replace` on every guard and login redirect.
7. **Interactive nesting:**
   * *Risk:* `<Link>` wrapped around a `<button>` (or vice versa) is invalid HTML and breaks keyboard focus.
   * *Mitigation:* Cards are a single `<Link>`; actions inside detail pages are plain buttons.
8. **Git hygiene:**
   * *Mitigation:* `git status` + `git diff --staged` before every commit; agent verifies with read-only commands.

### 8.2 Prioritized Cut Line
* **Drop First (P1):** per-route titles, static-host rewrite files.
* **Drop Second (M4 Bonus):** protected routes. Keep a README section explaining the guard concept with the planned `ProtectedRoute` code.
* **Drop Third (M3 polish):** `NavPatterns` page shrinks to the Push vs Replace card only.
* **NON-NEGOTIABLE CORE:**
  * BrowserRouter + layout route + NavLink header.
  * Home, About, Products list, Product detail (`useParams`), Contact form, 404.
  * At least one `useNavigate` on submit and one `navigate(-1)`.
  * Strict-scope grep audits, truthful README, tracker/Drive deliverables.

---

## 9. Manual Test Script (Verification Checklist)

Ronit runs these 13 checks before submission:
1. **Deep Link:** Paste `http://localhost:5173/swag/swag-tee` into a new tab. The detail page renders directly.
2. **Refresh:** On `/directory/3`, press `Cmd+R`. The same user's posts reload; you don't land on the default station.
3. **Active Link:** Visit each sidebar link. Exactly one is highlighted. On `/swag/swag-tee`, "Swag shop" stays highlighted. On `/`, only Home is.
4. **Link vs Anchor:** On About, click the `<a>` demo with the Network tab open. A full document request appears and theme/toasts reset. The `<Link>` demo shows no document request.
5. **useParams + Not Found:** `/swag/nope` shows "Product not found"; `/directory/abc` shows "Unknown participant"; `/totally/unknown` shows the 404 page with the sidebar intact.
6. **Param-Driven Fetch:** With slow network on, click users 1 → 2 → 3 quickly. Earlier requests show `cancelled`; the final posts match user 3 and the URL.
7. **Cart Survives Navigation:** Add 2 items on `/swag`, open a detail page, go Back. The cart still holds 2 items, also after refresh.
8. **Push vs Replace:** On `/patterns/navigation`, use "Push to /swag", then Back. You return to patterns. Use "Replace with /swag", then Back. You skip patterns.
9. **Contact Submit:** Invalid form shows inline errors and stays put. A valid submit lands on `/contact/sent`, and Back skips `/contact`.
10. **Redirect:** Visiting `/shop` lands on `/swag`; Back does not return to `/shop`.
11. **Protected Route:** Logged out, `/organizer/lab` → `/login`. A wrong passcode shows an error; `hackhq` → `/organizer`. Logout → `/`, and `/organizer` redirects again.
12. **Wow Checks:** Every page animates in (and doesn't with "Reduce motion" on). ⌘K opens the palette; typing "tee" + Enter lands on the tee's detail page; Esc closes it. The route badge on `/swag/swag-tee` reads `/swag/:productId → swag-tee`. Previous/next links on product pages change the URL.
13. **Clean Console:** Walk every route with StrictMode on. Zero errors or warnings, and no lingering stopwatch interval after leaving `/clock`.

---

## 10. Execution Status (31 October 2026)

| Milestone | PR | Status | Notes |
| --- | --- | --- | --- |
| M0 | #29, #30 | Done | `@vitejs/plugin-react` upgraded 4 → 6 (Day 6 had a Vite 8 peer conflict). The router-install commit missed #29 and shipped in #30. |
| M1 | #30 | Done | W1 entrance animation and W2 "Signal lost" 404 included. |
| M2 | #31 | Done | W3 route badge and W4 hero product page included. |
| M3 | #32 | Done | Contact and NavPatterns shipped in one commit so every commit builds; W5 ⌘K palette added. |
| M4 | #33 | Done | Found and fixed a logout bounce caused by `BrowserRouter` transitions (`useTransitions={false}`). |
| M5 | day7/readme | Done | README, `docs/FACTS.md`, 10 screenshots, 53/53 browser checks. `docs/STANDUP.md` intentionally not committed (Day 6's was removed from `main`); the script was handed over directly. |
| P1 | — | Not started | Optional. |
