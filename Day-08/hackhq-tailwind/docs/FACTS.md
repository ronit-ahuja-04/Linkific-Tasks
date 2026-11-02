# Day 7 Verified Facts Sheet

**Project:** HackHQ Router (`hackhq-router`)  
**Audit Date:** Saturday, 31 October 2026  
**Method:** Read-only grep audits, the npm scripts, and a headless Chrome session driven over the DevTools Protocol against `npm run dev` (StrictMode on)

Every number below was measured on the final `day7/readme` code. Nothing here is estimated.

---

## 1. Codebase Metrics

| Metric                         | Measured value                                                                | How it was measured                                 |
| ------------------------------ | ----------------------------------------------------------------------------- | --------------------------------------------------- |
| Installed versions             | React 19.3.1, react-router-dom 7.18.5, Vite 8.3.5, @vitejs/plugin-react 6.1.2 | `npm ls`                                            |
| Route patterns                 | 20 (16 pages, 3 `<Navigate>` redirects, 1 catch-all)                          | `grep -oE 'path="[^"]+"\|<Route index' src/App.jsx` |
| `<Route>` elements in the tree | 25 (includes the layout, guard and `swag` / `organizer` parents)              | `grep -c "<Route" src/App.jsx`                      |
| Source files (`.js` / `.jsx`)  | 59                                                                            | `find src -name "*.js" -o -name "*.jsx"`            |
| `// CONCEPT:` teaching tags    | 23                                                                            | `grep -rn "CONCEPT:" src`                           |
| Unit tests                     | 76 passing across 8 files (Day 7 added 4 files and 18 tests)                  | `npm test`                                          |
| ESLint                         | 0 errors, 0 warnings                                                          | `npm run lint`                                      |
| Prettier                       | All matched files pass                                                        | `npm run format:check`                              |
| Production build               | JS 395.83 kB (118.50 kB gzip), CSS 81.97 kB (15.34 kB gzip)                   | `npm run build`                                     |

## 2. Strict-Scope Audits (all must be 0)

| Audit                         | Command                                                                                                                        | Result |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------ |
| Forbidden React hooks         | `grep -rnE "useReducer\|useContext\|createContext\|useRef\|useMemo\|useCallback\|useLayoutEffect" src`                         | **0**  |
| Forbidden router APIs         | `grep -rnE "useLocation\|useSearchParams\|useOutletContext\|useMatch\|createBrowserRouter\|RouterProvider\|useLoaderData" src` | **0**  |
| Forbidden libraries           | `grep -rnEi "axios\|tanstack\|swr\|redux\|zustand" src package.json`                                                           | **0**  |
| `eslint-disable` comments     | `grep -rn "eslint-disable" src test`                                                                                           | **0**  |
| `TODO` / `PASTE` placeholders | `grep -rnE "TODO\|PASTE" src test`                                                                                             | **0**  |

Router APIs in use: `BrowserRouter`, `Routes`, `Route`, `Link`, `NavLink`, `Navigate`, `Outlet`, `useParams`, `useNavigate`, which is exactly the Day 7 list plus `Outlet` (required for nested and layout routes).

## 3. Browser Interaction Checks: 53 / 53 pass

Five suites, each in a fresh Chrome profile. Every suite also asserts **zero console errors and warnings**, which accounts for 5 of the 53.

| Suite                        | Checks | What it proves                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Routes & dynamic params      | 16     | Deep link `/clock` renders directly; exactly one active `NavLink` with `aria-current="page"`; Back/Forward follow clicks; product-name `Link` → `/swag/swag-tee`; "Swag shop" stays active on detail pages; cart count carries list → detail → back and survives a full reload; Back walks product history; directory row clicks change `/directory/:id`; search text survives switching users; after 3 rapid clicks the posts panel matches the URL's user; Back restores the previous user |
| Programmatic navigation & ⌘K | 17     | ⌘K and Ctrl+K open the palette, Esc closes it; "tee" + Enter → `/swag/swag-tee`; `BackButton` = `navigate(-1)`; invalid Contact submit stays put with 3 errors; valid submit → `/contact/sent`, and Back skips the form (`replace`); push vs replace differ on Back exactly as the diagrams say; `/shop` → `/swag`, and Back skips `/shop`                                                                                                                                                   |
| Back-button fallback         | 3      | A fresh deep link has `history.state.idx === 0`; `BackButton` falls back to `/swag` instead of leaving the app                                                                                                                                                                                                                                                                                                                                                                               |
| Protected routes             | 14     | Logged out, `/organizer/lab` → `/login`, and Back does not re-enter the guarded URL; legacy `/checkin` redirects then gets guarded; wrong passcode shows an error; correct passcode → `/organizer`; guarded children render; a refresh keeps the session; `/login` while signed in → `/organizer`; header Log out → `/`; the palette to a guarded page while logged out → `/login`                                                                                                           |
| Organizer logout             | 3      | The organizer page's own Log out button → `/`, and the header returns to "Log in"                                                                                                                                                                                                                                                                                                                                                                                                            |

### Bug caught by these checks

The first protected-routes run failed one check: **header Log out landed on `/login`, not `/`**. React Router 7's `BrowserRouter` wraps location updates in `React.startTransition`, so the urgent `setIsOrganizer(false)` rendered while the URL was still `/organizer`, and the guard redirected. Setting `<BrowserRouter useTransitions={false}>` fixed it (commit `9e7f395`, PR #33), and all 14 checks pass.

## 4. Pull Requests

| PR                                                              | Milestone                                          | Branch                  |
| --------------------------------------------------------------- | -------------------------------------------------- | ----------------------- |
| [#29](https://github.com/ronit-ahuja-04/Linkific-Tasks/pull/29) | M0 copy + plugin upgrade                           | `day7/setup`            |
| [#30](https://github.com/ronit-ahuja-04/Linkific-Tasks/pull/30) | M0 router install + M1 layout, pages, NavLink, 404 | `day7/routes`           |
| [#31](https://github.com/ronit-ahuja-04/Linkific-Tasks/pull/31) | M2 dynamic routes                                  | `day7/dynamic-routes`   |
| [#32](https://github.com/ronit-ahuja-04/Linkific-Tasks/pull/32) | M3 programmatic navigation + ⌘K                    | `day7/navigation`       |
| [#33](https://github.com/ronit-ahuja-04/Linkific-Tasks/pull/33) | M4 protected routes                                | `day7/protected-routes` |
| this PR                                                         | M5 README, facts, screenshots                      | `day7/readme`           |

## 5. Not Verified / Out of Scope

- **Static-host deployment:** not deployed. Deep links rely on Vite's `index.html` fallback in dev and preview; a host would need a rewrite rule.
- **`HashRouter`:** explained in the README, not shipped or exercised.
- **Screen-reader pass:** ARIA attributes were added (`aria-current`, combobox/listbox roles in the palette, `role="alert"` errors), but no screen reader was run.
- **Real mobile devices:** layouts were checked at 500 px in headless Chrome (its minimum window width), not on a phone.
