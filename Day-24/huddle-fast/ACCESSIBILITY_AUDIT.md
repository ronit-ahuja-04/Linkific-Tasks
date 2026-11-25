# Accessibility audit: Huddle

**Scope:** every page of the app (sign-in, dashboard, chat, notes, files, profile, Query lab), light and dark theme, desktop and phone.
**Standard:** WCAG 2.2, level AA.
**Status:** complete (M5). Baseline written in M1, before the redesign; every finding below is fixed, explained or closed (14 after a later fix). One manual step remains for a person: the VoiceOver pass ([docs/VOICEOVER_CHECK.md](docs/VOICEOVER_CHECK.md)).

## How it was checked

| Method | What it covers | Tool |
|---|---|---|
| Automated scan | about a third of WCAG: contrast, names, roles, ARIA misuse | axe-core (WCAG 2.0, 2.1 and **2.2** rules), every page, **light and dark**, including states behind a click (an open room, open forms, the filters panel, the notification panel) |
| Measurements axe does not make | tab order and number of stops before the content, visible focus on every stop, skip link, landmarks, headings, live regions, images without alt, reflow at 320 px, target size, reduced-motion CSS | [`scripts/audit.mjs`](scripts/audit.mjs) → [`docs/audit/before.md`](docs/audit/before.md) (M1) and [`docs/audit/after.md`](docs/audit/after.md) (M5) |
| Colour contrast | every text/background and control/background pair the design uses, both themes | [`npm run contrast`](scripts/contrast.mjs) → [`docs/contrast.md`](docs/contrast.md), also a unit test and live on `/styleguide` |
| Keyboard walkthroughs | tab order with a visible ring on every stop, the skip link, the phone menu, the notification popover, filter chips, the filters panel, sending a message, focus after a page change and after a failed sign-in | Playwright: [`e2e/shell.spec.js`](e2e/shell.spec.js), [`e2e/keyboard-aria.spec.js`](e2e/keyboard-aria.spec.js) |
| Zoom, text size, motion | 320 px reflow on every page (= 400% zoom), text at 200%, `prefers-reduced-motion` | [`e2e/a11y.spec.js`](e2e/a11y.spec.js) |
| Screen reader | reading order, names, roles, announcements | **ARIA snapshots** of the accessibility tree ([`e2e/keyboard-aria.spec.js`](e2e/keyboard-aria.spec.js)); **VoiceOver** by hand with [docs/VOICEOVER_CHECK.md](docs/VOICEOVER_CHECK.md). NVDA and JAWS are Windows-only and were not used. |

## What already works (credit to Day 17)

- **Visible focus on every tab stop** on every page (the script compares each element focused and unfocused).
- **Skip link** on every signed-in page, moving focus to `main`.
- **Landmarks** (`header`, `nav "Main"`, `main`, `aside "Rooms"`, `search`) and a sensible heading outline on most pages.
- **Labelled forms**; the sign-in error is announced (`role="alert"`).
- **The @mention box is a correct ARIA combobox**: `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, arrow keys, Escape closes.
- **The notification popover** opens with Enter, sets `aria-expanded`, closes with Escape and returns focus to the bell.
- **No images without alt text**; `prefers-reduced-motion` is respected in the CSS.
- **No axe violations with the WCAG 2.1 rules**, in either theme.

## Findings

| ID | Finding | WCAG | Severity | Where | Evidence | Planned fix | Status |
|---|---|---|---|---|---|---|---|
| A-1 | Chat messages are `<li>` inside a `<ul role="log">`: the role replaces the list, so the items have no list parent | 1.3.1 Info and Relationships (A) | Serious | Chat | axe `listitem` ×3 (WCAG 2.2 rules), light and dark | `<div role="log">` containing an `<ol>` | **Fixed (M4)**: `RoomView`; tested in `test/chat-room.test.jsx` (the log contains a list, items in order) |
| A-2 | Messages are newest-first **in the DOM**, so a screen reader reads the conversation backwards; new messages arrive at the top, away from the composer | 1.3.2 Meaningful Sequence (A) | Serious | Chat | DOM order checked by script | Chronological order; scroll to the latest | **Fixed (M4), diagnosis corrected**: the list was already built oldest first. The seed inserted three messages in one statement, so they shared one `created_at`, and the query had no tie-breaker: Postgres may return equal timestamps in any order. Fix: `.order('id', desc)` after `created_at` (ids only grow), and the seed now uses realistic, staggered times. Real messages, sent one at a time, were never affected. |
| A-3 | The Files page scrolls horizontally by **17 px** at 320 px wide | 1.4.10 Reflow (AA) | Serious | Files | `scripts/audit.mjs` | Fix the overflowing row (wrap, `min-width: 0`) | **Fixed (M4)**: no fixed minimum widths in `files.css`; every grid track is `min(…, 100%)`. Re-measured in M5: **0 px** overflow at 320 px ([`docs/audit/after.md`](docs/audit/after.md)) |
| A-4 | After a failed sign-in, focus falls to `<body>`: the error is announced, but a keyboard user has lost their place | 2.4.3 Focus Order (A) | Moderate | Sign-in, register, reset | keyboard walkthrough | Keep focus on the form (return it to the submit button or the first invalid field) | **Fixed (M4)**: the cause was `disabled={busy}` on the focused submit button; it now stays focusable (`aria-disabled` and a guard against double submits). Checked in the browser: after a wrong password, focus is still on "Sign in" and the alert is read. Same fix on the profile forms |
| A-5 | Headings jump from `h1` to `h3` | 1.3.1 Info and Relationships (A), best practice | Moderate | Query lab | `docs/audit/before.md` | Section headings at `h2` | **Fixed (M4)**: example titles `h2`, code labels `h3` |
| A-6 | 27 separate `aria-live` regions, one per example card | 4.1.3 Status Messages (AA), advisory | Minor | Query lab | `docs/audit/before.md` | Announce only the card that ran | **Fixed (M4)**: one `role="status"` on the page; each example reports what happened ("… was refused by the database, as expected") |
| A-7 | Stand-alone links "All notes", "Open chat", "All files" are 23 px tall | 2.5.8 Target Size (Minimum) (AA, new in 2.2) | Minor (likely passes through the spacing exception) | Dashboard | `scripts/audit.mjs` at 320 px | At least 24 px targets in the new link style | **Fixed (M4)**: card header links and the Workspace links have `min-height: 1.5rem` |
| A-8 | Native checkboxes are 16×16 px | 2.5.8 Target Size (Minimum) (AA) | Minor (label and spacing exceptions) | Notes, Chat | `scripts/audit.mjs` | Larger hit area through the label | **Fixed (M5)**: the box is 20 px and its label (which toggles it) is at least 24 px tall; measured at 320 px: "Pinned" 74×29, "Private" 254×42 |
| A-9 | On a phone, 11 navigation stops come before the content on every page (the skip link makes this pass, but it is tiring) | 2.4.1 Bypass Blocks (A): passes | Advisory | All signed-in pages | `docs/audit/before.md` | Collapsed menu on phones | **Fixed (M3)**: on a phone the bar has 4 stops (Menu, Huddle, bell, theme); the navigation is behind the Menu button. `e2e/shell.spec.js` |
| A-11 | Choosing a page left focus on the link (or on `<body>` when the link disappeared): a screen reader did not hear that the page changed | 2.4.3 Focus Order (A), 4.1.3 | Moderate | Every page change | found while building the shell | Move focus to the new page's `h1` | **Fixed (M3)**: `AppLayout`, tested in `test/app-layout.test.jsx` and `e2e/shell.spec.js` |
| A-10 | Hidden file inputs measure 1×1 px | none: their visible labels are the targets | Not an issue | Files, Profile, Chat | script false positive, recorded so it is not "found" again | none | Closed |
| A-12 | The same hidden file inputs WERE in the accessibility tree: a screen reader met two "Attach a file" buttons in the composer (one of them invisible) | 4.1.2 Name, Role, Value (A), 1.3.1 | Moderate | Chat, Files, Profile | ARIA snapshot (M5) | Hide the real input from assistive technology; the visible button opens it | **Fixed (M5)**: `aria-hidden="true"` and `tabIndex={-1}` on the three inputs; the snapshot test asserts one "Attach a file" button |
| A-13 | Toasts were announced by giving each new toast `role="status"`/`alert`; a live region created together with its text is often not read (VoiceOver especially) | 4.1.3 Status Messages (AA) | Moderate | Every toast | code review (M5) | Live regions that are always present; put the message inside | **Fixed (M5)**: `ToastViewport` has a polite and an assertive region; unit tests check every toast is both shown and in a live region; `e2e/keyboard-aria.spec.js` checks "Note created" in the browser |
| A-14 | A session the server had ended (account deleted, or "sign out of all devices" elsewhere) was only noticed at the next reload; until then the page acted signed in and showed PostgREST's raw "Cannot coerce the result to a single JSON object" | 3.3.1 Error Identification (A), 3.3.3 Error Suggestion (AA) | Moderate | Every signed-in page | found in use after a local `supabase db reset` deleted an open account | Ask the Auth server again on returning to the tab and after a "no such row" error; say why on the sign-in page; map PGRST116 to words | **Fixed**: `AuthContext` (`confirmSession`, `sessionEnded`), `friendlyProfileError`; unit tests, `e2e/auth.spec.js`, and reproduced by deleting a user in the database with its tab open |

Pre-existing, not accessibility: one unit test (`files-page.test.jsx`, the share-link countdown) failed now and then in the full parallel run, in Day 17 as well. **Fixed in M2**: the test advanced the fake clock before the countdown's interval existed; it now waits for it (15 of 15 runs under load).

### Found and fixed while building the design system and the shell

- **M2:** `.sr-only` text inside a scrolling table escaped the scroller and widened the page on phones (1.4.10). `.table-wrap` is now `position: relative`.
- **M3:** the phone menu closes when keyboard focus leaves it, so the open panel can never cover the focused element (2.4.11 Focus Not Obscured, new in 2.2). Tested in `e2e/shell.spec.js`.

## Before and after (the same script, the same pages)

| Measure | Before (M1, Day 17 design) | After (M5) |
|---|---|---|
| axe violations, WCAG 2.2 AA rules, light + dark | 1 rule on 3 elements (`listitem`, chat) | **0**, also with a room, forms, filters and the bell open |
| Pages that scroll sideways at 320 px | 1 (Files, 17 px) | **0** |
| Targets under 24×24 px | links 23 px, checkboxes 16 px | **0** (the script now skips elements hidden from assistive technology, i.e. the file inputs of A-10/A-12) |
| Heading levels skipped | Query lab (h1 → h3) | **none** |
| Live regions on the Query lab | 27 | **1** |
| Tab stops before the content on a phone | 11 | **4** (and a skip link) |
| Tab stops before the content on a desktop | 11 | 15: the sidebar adds my rooms and the developer tools. The skip link (first stop) jumps all of them. |
| Focus after a failed sign-in | lost to `<body>` | stays on "Sign in" |
| Focus after choosing a page | stayed on the link | the new page's `h1` |
| Colour pairs checked by script | none | **68, all pass AA** (lowest text pair 5.20:1) |
| Text at 200%, reduced motion | not tested | tested: fits, no sideways scroll; animations off |

## VoiceOver pass

Not run yet: it needs a person listening. The 10-minute script is [docs/VOICEOVER_CHECK.md](docs/VOICEOVER_CHECK.md); record the date, macOS and Safari versions, and anything that sounded wrong here.

## Limits

- Automated checks and ARIA snapshots cover the accessibility tree; how it sounds is only known after the VoiceOver pass, and Windows screen readers (NVDA, JAWS) were not tried.
- Browser zoom is covered by the 320 px reflow test (1280 px at 400%) and the text-size test (200%), not by driving the browser's zoom control.
- Colour contrast is checked for every token pair the design uses; a one-off colour written into a page would not be (a unit test fails if a raw colour appears outside `tokens.css`).
