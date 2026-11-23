# PRD: Huddle redesign, UI/UX design principles (Day 22)

| Field     | Value |
| --------- | ----- |
| Owner     | Ronit Ahuja |
| Programme | Linkific internship, Month 1 (training phase), Day 22 |
| Repo path | `Linkific-Tasks/Day-22/huddle-redesign` (a copy of `Day-17/huddle`) |
| Status    | **Built.** PRs #108 to #112, plus the documentation PR |
| Companion | the project README, `DESIGN.md`, `ACCESSIBILITY_AUDIT.md`, `docs/GALLERY.md` |

## 1. Summary

Take a project already built, redesign it with real design principles, make it accessible, and document every decision with evidence. The project is **Huddle** (Day 17): a team workspace on Supabase with a dashboard, chat, notes, files, profile and sign-in, built quickly to learn Supabase, with styling as an afterthought. The redesign keeps the database, the API calls and the features, and replaces everything the user sees: a design system (tokens, two fonts, components, a living style guide), an app shell, every page, and an accessibility pass to WCAG 2.2 AA.

## 2. Goals and non-goals

**Goals**
- Every page follows the system: hierarchy, contrast, alignment, proximity, repetition, white space; F- and Z-patterns where they fit; mobile first.
- A documented colour palette and type scale, light and dark, with every colour pair passing WCAG AA, **measured**.
- An accessibility audit against WCAG 2.2 AA, with each finding fixed and tested.
- Before/after screenshots that are comparable (same pages, data and sizes, taken by a script).

**Non-goals**
- New features, schema changes, or changes to the Supabase calls.
- Figma (optional in the brief): the style guide in the app is the design reference.
- Native apps, other browsers than Chrome in the automated tests.

## 3. Decisions

| Decision | Choice | Why |
|---|---|---|
| Which project | Huddle (Day 17) | a real product shape with visible design problems; Dispatch too small, SalesPulse already designed, FlowLane too big for a day |
| Visual direction | a calm work tool, in the spirit of Linear or Slack, keeping Huddle's green | it is a workspace people sit in all day |
| Developer explanations | kept, collapsed in one "Under the hood" panel per page | they made Day 17 a learning project; collapsed, the product leads |
| Fonts | Inter + JetBrains Mono, self-hosted | built for screens; code needs a mono; no third-party requests, tests run offline |
| Accent | one amber, only for "needs you" | an accent used everywhere stops meaning anything |
| Navigation | sidebar on wide screens, one bar + disclosure menu on phones, one DOM | the Day 17 header wrapped into three rows on a phone |
| Chat layout | a room browser at `/chat`, the conversation full width at `/chat/:id` | the sidebar already lists my rooms; a second list wasted 280 px; on phones it gives two natural screens |
| Evidence | scripts for contrast, measurements and screenshots; tests for every fix | claims a reviewer can re-run |
| Figma | skipped | optional; the connector was not authorised, and `/styleguide` renders the real components |

## 4. Requirements and verification

| # | Requirement | How it is verified |
|---|---|---|
| R1 | Every text pair ≥ 4.5:1, control edges and focus ring ≥ 3:1, light and dark | `npm run contrast` (68 of 68 pass), a unit test, live on `/styleguide` |
| R2 | No raw colours outside `tokens.css` | unit test |
| R3 | axe WCAG 2.2 AA: zero violations on every page, both themes, including states behind a click | `e2e/a11y.spec.js` |
| R4 | No sideways scrolling at 320 px; text at 200% fits | `e2e/a11y.spec.js`, `scripts/audit.mjs` |
| R5 | Keyboard: skip link first, visible focus ring on every stop, menus close with Escape and return focus, focus moves to the new page's heading | `e2e/shell.spec.js`, `e2e/keyboard-aria.spec.js` |
| R6 | Screen readers: one `h1`, labelled controls, a log for chat, toasts announced | ARIA snapshot tests; unit tests for toasts; VoiceOver script |
| R7 | Targets ≥ 24×24 px | `scripts/audit.mjs` (none under) |
| R8 | Reduced motion respected | `e2e/a11y.spec.js` |
| R9 | All Day 17 behaviour still works | 304 unit, 74 browser and 77 database tests pass; selectors changed only where the markup did |

## 5. Milestones

| # | Milestone | PR |
|---|---|---|
| M1 | Baseline: copy, scripted "before" screenshots, measurement script, UX review (16 findings), accessibility audit (10 findings) | #108 |
| M2 | Design system: tokens, contrast script, fonts, components, `/styleguide` | #109 |
| M3 | App shell: sidebar, phone menu, focus on navigation | #110 |
| M4 | Every page redesigned | #111 |
| M5 | Accessibility fixes and proof | #112 |
| M6 | Documentation, gallery, PRD | this PR |

## 6. Risks and what happened

| Risk | What happened |
|---|---|
| A redesign breaks the Day 17 tests | 49 browser tests became 74; the existing ones needed selector changes only where the markup changed (for example, rooms are now in the sidebar too) |
| "Accessible" claimed without proof | every finding has a test; the before/after table comes from the same script |
| A wrong diagnosis | A-2 ("chat is newest first") was wrong: the list was always oldest first; seed messages shared a timestamp and the query had no tie-breaker. Corrected in the audit, fixed with `.order('id')` |
| Fixing focus creates new problems | the phone menu closes when focus leaves it (WCAG 2.4.11), found while building it |

## 7. Open items

- A VoiceOver pass by a person: `docs/VOICEOVER_CHECK.md` (10 minutes); its result goes in the audit.
- NVDA and JAWS (Windows) and Safari/Firefox in the automated tests.
- A Figma file, if the team wants design to live outside the code.
