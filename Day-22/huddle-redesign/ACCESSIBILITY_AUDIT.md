# Accessibility audit: Huddle

**Scope:** every page of the app (sign-in, dashboard, chat, notes, files, profile, Query lab), light and dark theme, desktop and phone.
**Standard:** WCAG 2.2, level AA.
**Status:** baseline written in M1 (before the redesign); the "Status" column is updated as fixes land.

## How it was checked

| Method | What it covers | Tool |
|---|---|---|
| Automated scan | about a third of WCAG: contrast, names, roles, ARIA misuse | axe-core (WCAG 2.0, 2.1 and **2.2** rules), every page, **light and dark** |
| Measurements axe does not make | tab order and number of stops before the content, visible focus on every stop, skip link, landmarks, headings, live regions, images without alt, reflow at 320 px, target size, reduced-motion CSS | [`scripts/audit.mjs`](scripts/audit.mjs) → [`docs/audit/before.md`](docs/audit/before.md) |
| Keyboard walkthroughs | dialogs and popovers (Escape, focus return), the mention combobox, form errors, the skip link | scripted with Playwright, then by hand |
| Screen reader | reading order, names, announcements | the accessibility tree via Playwright; **VoiceOver** (macOS) by hand in M5. NVDA and JAWS are Windows-only and were not used. |

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
| A-1 | Chat messages are `<li>` inside a `<ul role="log">`: the role replaces the list, so the items have no list parent | 1.3.1 Info and Relationships (A) | Serious | Chat | axe `listitem` ×3 (WCAG 2.2 rules), light and dark | `<div role="log">` containing an `<ol>` | Open |
| A-2 | Messages are newest-first **in the DOM**, so a screen reader reads the conversation backwards; new messages arrive at the top, away from the composer | 1.3.2 Meaningful Sequence (A) | Serious | Chat | DOM order checked by script | Chronological order; scroll to the latest | Open |
| A-3 | The Files page scrolls horizontally by **17 px** at 320 px wide | 1.4.10 Reflow (AA) | Serious | Files | `scripts/audit.mjs` | Fix the overflowing row (wrap, `min-width: 0`) | Open |
| A-4 | After a failed sign-in, focus falls to `<body>`: the error is announced, but a keyboard user has lost their place | 2.4.3 Focus Order (A) | Moderate | Sign-in, register, reset | keyboard walkthrough | Keep focus on the form (return it to the submit button or the first invalid field) | Open |
| A-5 | Headings jump from `h1` to `h3` | 1.3.1 Info and Relationships (A), best practice | Moderate | Query lab | `docs/audit/before.md` | Section headings at `h2` | Open |
| A-6 | 27 separate `aria-live` regions, one per example card | 4.1.3 Status Messages (AA), advisory | Minor | Query lab | `docs/audit/before.md` | Announce only the card that ran | Open |
| A-7 | Stand-alone links "All notes", "Open chat", "All files" are 23 px tall | 2.5.8 Target Size (Minimum) (AA, new in 2.2) | Minor (likely passes through the spacing exception) | Dashboard | `scripts/audit.mjs` at 320 px | At least 24 px targets in the new link style | Open |
| A-8 | Native checkboxes are 16×16 px | 2.5.8 Target Size (Minimum) (AA) | Minor (label and spacing exceptions) | Notes, Chat | `scripts/audit.mjs` | Larger hit area through the label | Open |
| A-9 | On a phone, 11 navigation stops come before the content on every page (the skip link makes this pass, but it is tiring) | 2.4.1 Bypass Blocks (A): passes | Advisory | All signed-in pages | `docs/audit/before.md` | Collapsed menu on phones | Open |
| A-10 | Hidden file inputs measure 1×1 px | none: their visible labels are the targets | Not an issue | Files, Profile, Chat | script false positive, recorded so it is not "found" again | none | Closed |

Pre-existing, not accessibility: one unit test (`files-page.test.jsx`, the share-link countdown) fails now and then in the full parallel run, in Day 17 as well; it passes on its own. Tracked for M5.

## Still to check (M5)

- VoiceOver pass on the redesigned pages (rotor: headings, landmarks, form controls; chat announcements).
- 200% browser zoom on every page.
- Keyboard flow of every new component (sidebar, mobile menu, filter chips).
- Contrast of every token pair, light and dark, by script (`DESIGN.md`).
