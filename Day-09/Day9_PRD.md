# PRD: HackHQ Bootstrap, a Bootstrap 5 redesign with two new features (Day 9)

| Field     | Value                                                    |
| --------- | -------------------------------------------------------- |
| Owner     | Ronit Ahuja                                              |
| Programme | Linkific internship, Month 1 (training phase), Day 9     |
| Date      | Tuesday, 3 November 2026                                 |
| Repo path | `Linkific-Tasks/Day-09/hackhq-bootstrap`                 |
| Builds on | Day 8 `hackhq-tailwind`                                  |
| Status    | **Shipped.** Merged via PRs #41 to #47.                  |
| Companion | `hackhq-bootstrap/README.md`, `BOOTSTRAP_VS_TAILWIND.md` |

---

## 1. Summary

Day 8 restyled HackHQ with Tailwind CSS 4 and left a shipped, tested app. Days 7 and 8 changed how HackHQ is built (routing, then styling) and added no new features. Day 9 does both: it restyles the app with Bootstrap 5.3 and React Bootstrap, and it adds two new features, **Announcements** and **Event schedule**.

The two features are chosen because they use the Bootstrap components the task list asks for in a natural way: Announcements for cards, a dynamic modal and a validated form, Schedule for tabs and an accordion.

The Day 8 folder stays untouched. Day 9 starts as a copy of `hackhq-tailwind` in a new folder, with Tailwind removed and Bootstrap added. Existing features keep their behaviour. New logic goes in pure `src/lib/` files with unit tests, as in earlier days.

## 2. Goals

| #   | Goal                                                                                 |
| --- | ------------------------------------------------------------------------------------ |
| G1  | Style the whole React app with Bootstrap 5.3                                         |
| G2  | Use the grid (container, row, col) with all six breakpoints, offset and order        |
| G3  | Use all nine Bootstrap components from the task list, plus Offcanvas and Toast       |
| G4  | Use React Bootstrap for components that need state, and plain classes elsewhere      |
| G5  | Show all three install options: npm, React Bootstrap, and CDN                        |
| G6  | Responsive layouts for mobile, tablet and desktop                                    |
| G7  | Ship two new features: Announcements and Event schedule                              |
| G8  | Write a Bootstrap vs Tailwind comparison backed by real numbers from Day 8 and Day 9 |
| G9  | A README that records the Bootstrap concepts learned                                 |

## 3. Non-goals

- No changes to the behaviour of existing features (check-in, swag, teams, checklist, directory, sponsors, auth).
- No backend. New features keep data in local files and `localStorage`, like the rest of HackHQ.
- No Tailwind in the Day 9 app. The comparison uses the Day 8 app for that side.
- No Sass customisation build step. Theme changes use CSS variables and `data-bs-theme`.
- No third component library on top of Bootstrap.
- No change to the Day 7 test suite beyond what the new markup requires.

## 4. New features

### 4.1 Announcements (`/announcements`)

Organizers post updates, attendees read them. This is the blog layout from the task list.

| Item             | Detail                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| Post             | Title, body, category (General, Schedule, Food, Swag, Urgent), pinned flag, author, date                       |
| Seed data        | `src/data/announcements.js`, with 6 to 8 sample posts                                                          |
| Layout           | Featured card on top (latest pinned post), card grid below, responsive `row-cols-*`                            |
| Filter           | Category `ButtonGroup`, plus a text search box                                                                 |
| Read state       | Posts newer than the last visit are unread. Unread count shows as a `Badge` on the nav link                    |
| Compose and edit | Modal with a validated form (title and body required, length limits). Content depends on the post being edited |
| Delete           | Confirmation modal, `Toast` on success                                                                         |
| Who can post     | Organizers only, using the role check HackHQ already has. Attendees get read-only access                       |
| Persistence      | New and edited posts stored in `localStorage`, merged with the seed data                                       |
| Pure logic       | `src/lib/announcements.js`: sort (pinned first, then newest), filter, search, unread count, validate           |

Bootstrap parts used: Card, Modal, Form with validation, Badge, ButtonGroup, Toast, Alert, grid.

### 4.2 Event schedule (`/schedule`)

A day-by-day agenda where attendees build their own plan.

| Item          | Detail                                                                                              |
| ------------- | --------------------------------------------------------------------------------------------------- |
| Session       | Day, start and end time, title, speaker, room, track, description                                   |
| Seed data     | `src/data/schedule.js`, three days with 4 to 6 sessions each                                        |
| Layout        | One `Tab` per day, sessions listed in time order, details in an `Accordion` item                    |
| Track filter  | `ButtonGroup` to show one track or all                                                              |
| My schedule   | "Add to my schedule" toggle on each session, saved in `localStorage`, with a summary view           |
| Clash warning | An `Alert` when two saved sessions overlap in time                                                  |
| Now and next  | The current or next session is marked with a `Badge` (uses the existing clock logic where possible) |
| Pure logic    | `src/lib/schedule.js`: group by day, sort, filter by track, overlap detection, now and next         |

Bootstrap parts used: Tabs, Accordion, Badge, ButtonGroup, Alert, Card, grid.

## 5. Approach to the restyle

### 5.1 Install options

| Option            | Where it is used                                                               |
| ----------------- | ------------------------------------------------------------------------------ |
| npm `bootstrap`   | CSS imported in `main.jsx`, plus utility classes everywhere                    |
| `react-bootstrap` | Stateful components (Modal, Tabs, Accordion, Navbar, Offcanvas, Toast, Form)   |
| CDN links         | A standalone `cdn-demo.html` in the app folder, showing the hero with no build |

### 5.2 Task list mapped to HackHQ

| Task list item               | Where it lands in HackHQ                                                 |
| ---------------------------- | ------------------------------------------------------------------------ |
| Landing page with hero       | Home: hero, station card grid                                            |
| Blog layout with cards       | Announcements: featured card and card grid                               |
| Dashboard with sidebar       | App layout and organizer home: fixed sidebar on `lg`, Offcanvas below it |
| Form with validation styling | Contact, Login, check-in and the announcement composer                   |
| Modal with dynamic content   | Announcement compose and edit, swag quick view, directory user posts     |

### 5.3 Component coverage

| Component       | Planned use                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------- |
| Buttons, groups | Actions throughout, `ButtonGroup` for filters in announcements, schedule, swag and directory |
| Card            | Station grid, sponsors, swag, announcements                                                  |
| Navbar          | Header, with collapse on small screens                                                       |
| Forms           | Contact, login, check-in, announcement composer, with validation styling                     |
| Modal           | Announcement compose, edit and delete, swag quick view, directory posts                      |
| Alert           | Form errors, notices, schedule clash warning                                                 |
| Badge           | Route badge, unread count, now and next, tags                                                |
| Accordion       | Schedule session details                                                                     |
| Tabs            | Schedule days                                                                                |
| Offcanvas       | Mobile sidebar                                                                               |
| Toast           | Replaces the hand-built toast container                                                      |

### 5.4 Utilities to use on purpose

Spacing (`m-`, `p-`, `gap-`), display (`d-flex`, `d-grid`, `d-none d-lg-block`), colour (`bg-`, `text-`, `border-`), borders and shadows (`rounded-`, `shadow-`), and position (`sticky-top`, `position-relative`, `position-absolute`, `fixed-bottom`).

### 5.5 Dark mode

Map the existing persisted toggle to Bootstrap 5.3 colour modes by setting `data-bs-theme` before first paint, so there is no flash of the wrong theme.

## 6. Requirements

| #   | Requirement                                                                                                        | Status |
| --- | ------------------------------------------------------------------------------------------------------------------ | ------ |
| R1  | New app at `Day-09/hackhq-bootstrap`, copied from Day 8, Tailwind removed                                          | Done   |
| R2  | `bootstrap` and `react-bootstrap` installed, Bootstrap CSS imported once in `main.jsx`                             | Done   |
| R3  | App shell on the grid, with a sidebar on `lg` and up and an Offcanvas drawer below                                 | Done   |
| R4  | At least one layout each using `offset-*`, `order-*` and breakpoint-specific column sizes                          | Done   |
| R5  | Existing pages restyled: home hero, stations, sponsors, about, swag, directory, forms, command palette             | Done   |
| R6  | Dark mode through `data-bs-theme`, persisted, no flash on load                                                     | Done   |
| R7  | Announcements feature as described in 4.1                                                                          | Done   |
| R8  | Event schedule feature as described in 4.2                                                                         | Done   |
| R9  | Unit tests for `announcements.js` and `schedule.js`, covering the pure logic                                       | Done   |
| R10 | All nine task-list components used, plus Offcanvas and Toast                                                       | Done   |
| R11 | At least 5 React Bootstrap integration examples, with event handling (`onClick`, `onSubmit`, `onSelect`, `onHide`) | Done   |
| R12 | Tailwind dependencies and Day 8 utility classes removed, custom CSS kept small and listed in the README            | Done   |
| R13 | `cdn-demo.html` showing the CDN install option                                                                     | Done   |
| R14 | `BOOTSTRAP_VS_TAILWIND.md` covering when to use each, pros and cons, and performance with measured figures         | Done   |
| R15 | README with the Bootstrap concepts, install options, the two features and screenshots                              | Done   |
| R16 | Lint clean, all tests pass, production build passes                                                                | Done   |

## 7. Milestones

Work is split into seven milestones. Each one ends in a working, buildable app and ships as its own pull request, so nothing is left half-done between sessions. A milestone starts only when the previous one's exit criteria are met.

| #   | Milestone                    | Covers requirements  | Pull request branch    | Pull request |
| --- | ---------------------------- | -------------------- | ---------------------- | ------------ |
| M1  | Foundation and baseline      | R1, R2               | `day9/foundation`      | #41          |
| M2  | Layout and grid              | R3, R4, R6           | `day9/layout-grid`     | #42          |
| M3  | Restyle existing pages       | R5, part of R10, R11 | `day9/restyle-pages`   | #43          |
| M4  | Feature: Announcements       | R7, part of R9       | `day9/announcements`   | #44          |
| M5  | Feature: Event schedule      | R8, part of R9       | `day9/schedule`        | #45          |
| M6  | Cleanup, CDN demo and polish | R10, R12, R13, R16   | `day9/cleanup-cdn`     | #46          |
| M7  | Comparison and documentation | R14, R15             | `day9/docs-comparison` | #47          |

### M1. Foundation and baseline

| Task | Work                                                                                                |
| ---- | --------------------------------------------------------------------------------------------------- |
| 1.1  | Record the Day 8 baseline: gzipped CSS and JS build size, lines of markup, class counts, test count |
| 1.2  | Copy `hackhq-tailwind` to `Day-09/hackhq-bootstrap`, rename the package                             |
| 1.3  | Remove Tailwind and its Vite plugin, install `bootstrap` and `react-bootstrap`                      |
| 1.4  | Import Bootstrap CSS once in `main.jsx`, load the Bootstrap JS bundle only where needed             |

**Exit criteria:** the app builds and runs with Bootstrap CSS loaded (unstyled-looking pages are fine), existing tests still pass, and the baseline numbers are saved in a file for M7.

### M2. Layout and grid

| Task | Work                                                                                                                     |
| ---- | ------------------------------------------------------------------------------------------------------------------------ |
| 2.1  | App shell on `Container`, `Row` and `Col`, with the sidebar fixed on `lg` and up                                         |
| 2.2  | `Navbar` header with icon-only actions on small screens, `Offcanvas` drawer for stations below `lg`                      |
| 2.3  | Footer and page header restyled                                                                                          |
| 2.4  | Grid examples: sidebar and main at `lg` and `xl`, footer with `order-*` and `offset-*`, viewport badge showing xs to xxl |
| 2.5  | Dark mode through `data-bs-theme`, persisted, set before first paint                                                     |

**Exit criteria:** every route renders inside the new shell at 390, 820 and 1440 px, the drawer opens and closes, and the dark mode toggle works without a flash.

### M3. Restyle existing pages

| Task | Work                                                                                                          |
| ---- | ------------------------------------------------------------------------------------------------------------- |
| 3.1  | Home: hero and station `Card` grid, `Badge` and `Button` styling                                              |
| 3.2  | Sponsors and About restyled with `Card`, `Table` and utilities                                                |
| 3.3  | Contact, Login and check-in as `Form` with `validated`, `isInvalid` and `Form.Control.Feedback`, plus `Alert` |
| 3.4  | One `Modal` for swag quick view and directory user posts, content taken from state                            |
| 3.5  | `Toast` and `ToastContainer` replacing the hand-built toast container                                         |
| 3.6  | Stations, organizer home, command palette and split-flap board restyled, `ButtonGroup` view toggles           |

**Exit criteria:** every existing page is on Bootstrap with its behaviour unchanged, the validated form and dynamic modal work, and the existing tests pass.

### M4. Feature: Announcements

| Task | Work                                                                                      |
| ---- | ----------------------------------------------------------------------------------------- |
| 4.1  | `src/lib/announcements.js` and `src/data/announcements.js`, with unit tests written first |
| 4.2  | `/announcements` route and nav link with unread `Badge`                                   |
| 4.3  | Featured card and responsive card grid, category `ButtonGroup` and search                 |
| 4.4  | Compose and edit `Modal` with validated form, delete confirmation, `Toast` feedback       |
| 4.5  | Organizer-only controls using the existing role check, `localStorage` persistence         |

**Exit criteria:** an organizer can create, edit, pin and delete a post, an attendee can only read, filters and unread count work, and the new unit tests pass.

### M5. Feature: Event schedule

| Task | Work                                                                            |
| ---- | ------------------------------------------------------------------------------- |
| 5.1  | `src/lib/schedule.js` and `src/data/schedule.js`, with unit tests written first |
| 5.2  | `/schedule` route and nav link, one `Tab` per day                               |
| 5.3  | Session list with `Accordion` details and a track `ButtonGroup`                 |
| 5.4  | "My schedule" toggle, summary view, clash `Alert`, now and next `Badge`         |

**Exit criteria:** days switch, track filter works, saved sessions persist after a reload, overlapping sessions show the warning, and the new unit tests pass.

### M6. Cleanup, CDN demo and polish

| Task | Work                                                                                       |
| ---- | ------------------------------------------------------------------------------------------ |
| 6.1  | Delete leftover Tailwind classes and code, keep custom CSS to brand tokens and a few rules |
| 6.2  | Update test selectors that depend on changed markup                                        |
| 6.3  | `cdn-demo.html`: the hero built with CDN links and no build step                           |
| 6.4  | Event handling written up as at least 5 React Bootstrap examples                           |
| 6.5  | Keyboard check on Modal, Offcanvas, Tabs and Accordion (focus trap, Escape, arrow keys)    |
| 6.6  | Lint, test and build, then screenshots at three widths in light and dark mode              |

**Exit criteria:** `npm run build`, `npm run lint` and `npm test` all pass, no Tailwind left, and screenshots are saved in `docs/screenshots`.

### M7. Comparison and documentation

| Task | Work                                                                                                                 |
| ---- | -------------------------------------------------------------------------------------------------------------------- |
| 7.1  | Measure Day 9 build size, markup lines and class counts against the M1 baseline                                      |
| 7.2  | Write `BOOTSTRAP_VS_TAILWIND.md`: when to use each, pros and cons, performance with measured figures                 |
| 7.3  | Write the README: Bootstrap concepts, install options, which approach each page uses, the two features, verification |
| 7.4  | Mark requirements done in this PRD and set its status to Shipped                                                     |

**Exit criteria:** all deliverables in section 10 exist, and every figure in the comparison traces back to a measured build.

M4 and M5 touch different pages, so they can be swapped if one is blocked.

### Stretch (only if time remains)

An organizer dashboard in the sidebar layout showing live numbers from existing data: check-ins, swag orders, team count and checklist progress, using `Card`, `ProgressBar` and `Table`.

## Outcome

All sixteen requirements are done and all seven milestones are merged. The stretch organizer dashboard was not built.

### Results

| Measure        | Result                                                                       |
| -------------- | ---------------------------------------------------------------------------- |
| Build          | Passes. CSS 35.5 kB and JS 152.3 kB gzipped                                  |
| Lint           | 0 errors, 2 warnings (the same two as Day 8)                                 |
| Tests          | 134 of 134 (76 from Day 8, 30 for announcements, 28 for the schedule)        |
| Routes         | All load at 390, 820 and 1440 px with no horizontal scroll or console errors |
| Keyboard audit | 20 of 20, after adding Home and End to the schedule tabs                     |
| Components     | All nine from the task list, plus Offcanvas and Toast                        |

The comparison figures are in [`BASELINE.md`](BASELINE.md) and [`BOOTSTRAP_VS_TAILWIND.md`](BOOTSTRAP_VS_TAILWIND.md).

### Where the build differs from the plan

- **Header (task 2.2):** the `Navbar` header keeps its actions visible and shrinks them to icons on small screens. It does not collapse. The stations list moves into an `Offcanvas` drawer.
- **Sidebar widths (task 2.4):** the sidebar is 3 of 12 columns from `lg`, widening to `xl` and dropping to 2 of 12 at `xxl`. `order-*` and `offset-*` appear in the footer only.
- **Look changes in M3:** the swag thermal-receipt styling and the team badge barcode became plain cards, the contact page aside is no longer sticky, and State X-ray is a fixed panel. Directory posts open in a modal whose title is "Participant Posts" plus a user id, not the person's name.
- **Schedule "now and next":** it does not reuse the clock station, which is a stopwatch. It uses the real time, or a **Preview time** input (`?at=`) that was added because the event dates are in the past.
- **Added beyond the plan:** Home and End keys on the schedule tabs, found by the keyboard audit.
- **React Bootstrap examples (R11):** they are written up in `hackhq-bootstrap/docs/REACT_BOOTSTRAP_EXAMPLES.md`, with links to the real code, not shown in the interface.
- **Bootstrap JavaScript:** the app never loads it (task 1.4). React Bootstrap replaces it. It is used only in `cdn-demo.html`.
- **Not covered:** screen readers, Safari and Firefox, and any measurement of build time or design effort for either framework.

## 8. Verification

- `npm run build`, `npm run lint` and `npm test` all pass, with the counts recorded in the README.
- Pages checked in headless Chrome at 390 px, 820 px and 1440 px, in light and dark mode.
- Keyboard check on the Modal, Offcanvas, Tabs and Accordion (focus trap, Escape, arrow keys).
- Comparison figures come from real builds of both apps. Because the new features have no Tailwind version, the like-for-like figures use the restyled existing pages only, and the comparison says so.

## 9. Risks

| Risk                                                   | Mitigation                                                                                  |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Bootstrap looks generic compared with the Day 8 design | Keep a short custom CSS file for the brand colours and fonts, using Bootstrap CSS variables |
| Tests break on changed markup                          | Update selectors only, never test logic                                                     |
| Bootstrap JS and React both touching the DOM           | Use React Bootstrap for interactive components, and plain `data-bs-*` only on static ones   |
| Mixed approaches confuse the codebase                  | README states which approach each page uses and why                                         |
| The comparison reads as opinion                        | Record the Day 8 baseline before changing anything, and report measured numbers             |
| New features turn into a large scope                   | Front end only, local data, pure logic with tests, and the dashboard stays a stretch        |
| Organizer role check differs from what is assumed      | Read the existing auth code at the start of M4 and adjust the plan before building          |
| Seed data and `localStorage` edits conflict            | Store edits as a separate list and merge by id, never overwrite the seed data               |

## 10. Deliverables

- React app styled with Bootstrap, in `Day-09/hackhq-bootstrap`
- All nine task-list components in use, plus Offcanvas and Toast
- Responsive layout on the grid system
- Two new features: Announcements and Event schedule, with unit tests
- React Bootstrap integration examples
- `BOOTSTRAP_VS_TAILWIND.md`
- README with Bootstrap concepts
