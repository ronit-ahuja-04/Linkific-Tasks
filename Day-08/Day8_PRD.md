# PRD: HackHQ Tailwind, a Tailwind CSS redesign (Day 8)

| Field        | Value                                                              |
| ------------ | ------------------------------------------------------------------ |
| Owner        | Ronit Ahuja                                                        |
| Programme    | Linkific internship, Month 1 (training phase), Day 8               |
| Date         | Monday, 2 November 2026                                            |
| Repo path    | `Linkific-Tasks/Day-08/hackhq-tailwind`                            |
| Builds on    | Day 7 `hackhq-router`                                              |
| Status       | **Shipped.** Merged via PRs #37 and #39.                           |
| Companion    | [`hackhq-tailwind/README.md`](hackhq-tailwind/README.md)           |

---

## 1. Summary

Through Day 7, HackHQ was styled by one hand-written stylesheet of about 5,400 lines and 700 class names, with dark mode done through per-component overrides. The app shell had a fixed height with hidden overflow, and the sidebar disappeared on small screens.

Day 8 rebuilds the interface with Tailwind CSS 4. Behaviour, routes and tests stay the same. Only the look and the way it is written change.

## 2. Goals

| #   | Goal                                                                    |
| --- | ----------------------------------------------------------------------- |
| G1  | Style the whole React app with Tailwind utility classes                 |
| G2  | Customise the Tailwind theme (colours, fonts, keyframes)                |
| G3  | Responsive layouts for mobile, tablet and desktop                       |
| G4  | Dark mode toggle, persisted, no flash on load                           |
| G5  | Six or more reusable responsive components                              |
| G6  | A README that records what was learned about Tailwind                   |

## 3. Non-goals

- No new routes, data or behaviour.
- No changes to the Day 7 test suite beyond what the new markup requires.
- No component library on top of Tailwind.

## 4. Requirements and status

| #   | Requirement                                                                                   | Status |
| --- | --------------------------------------------------------------------------------------------- | ------ |
| R1  | Tailwind 4 via `@tailwindcss/vite`, configured in CSS with `@theme`                           | Done   |
| R2  | Semantic colour tokens so dark mode flips without `dark:` on every class                      | Done   |
| R3  | Sticky header and sidebar, with an off-canvas drawer below the `lg` breakpoint                | Done   |
| R4  | Hero, station card grid, sponsors pricing table, contact form and footer                      | Done   |
| R5  | Command palette, toasts and split-flap board restyled                                         | Done   |
| R6  | Shared primitives (`Button`, `Card`, `Badge`, `Eyebrow`, `Kbd`) in one file                   | Done   |
| R7  | Old stylesheet deleted; remaining CSS limited to tokens, keyframes and base styles            | Done   |
| R8  | Lint clean, all tests pass, production build passes                                           | Done   |

## 5. Verification

Recorded in the project README: `npm run build` passes, `npm run lint` has 0 errors, `npm test` passes 76 of 76, and pages were checked in headless Chrome at 390 px, 820 px and 1440 px.

## 6. Risks

| Risk                                          | Mitigation                                                    |
| --------------------------------------------- | ------------------------------------------------------------- |
| Visual regressions hidden by passing tests    | Screenshot review at three widths                             |
| Flash of the wrong theme on load              | Theme class set before first paint, persisted choice          |
| Utility classes repeated across components    | Shared primitives in `src/components/ui.jsx`                  |
