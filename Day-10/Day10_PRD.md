# PRD: HackHQ Styled, a styled-components redesign (Day 10)

| Field     | Value                                                                  |
| --------- | ---------------------------------------------------------------------- |
| Owner     | Ronit Ahuja                                                            |
| Programme | Linkific internship, Month 1 (training phase), Day 10                  |
| Date      | Wednesday, 4 November 2026                                             |
| Repo path | `Linkific-Tasks/Day-10/hackhq-styled`                                  |
| Builds on | Day 9 `hackhq-bootstrap`                                               |
| Status    | **Shipped.** Merged via PRs #48 (superseded demo) and #49.             |
| Companion | `hackhq-styled/README.md`, `STYLING_COMPARISON.md`                     |

---

## 1. Summary

Day 9 restyled HackHQ with Bootstrap. Day 10 learns CSS-in-JS and applies it to the same app: Bootstrap and React Bootstrap are removed and every page and component is restyled with styled-components v6, with a light/dark `ThemeProvider`, a shared component library and a styling comparison. No new product features. The Day 9 folder stays untouched; Day 10 starts as a copy of `hackhq-bootstrap` in a new folder.

## 2. Goals

| ID | Goal |
| -- | ---- |
| G1 | Understand the CSS-in-JS concept: scoped styles, dynamic styling, trade-offs |
| G2 | Learn styled-components: tagged templates, props, extending, `as`, `css` helper |
| G3 | Implement theming with `ThemeProvider` and a light/dark toggle |
| G4 | Cover advanced features: nesting, pseudo-classes, media queries, keyframes, polished |
| G5 | Build a themed component library with 5 or more styled components |
| G6 | Compare plain CSS, CSS Modules, Tailwind and styled-components, backed by real numbers |

## 3. Non-goals

- No new product features and no behaviour changes. The 134 Day 9 tests must keep passing.
- No Bootstrap, Tailwind or other styling framework in the Day 10 app.
- No new dependencies beyond `styled-components` and `polished`.
- No server-side rendering setup.

## 4. Approach

### 4.1 Foundation (`src/styles/`)
- `theme.js`: `lightTheme` and `darkTheme` with the same shape (colours, `space()`, radii, fonts, `media.up/down`).
- `GlobalStyle.js`: reset, fonts, headings, focus ring, reduced-motion support.
- `animations.js`: keyframes plus css helpers.
- `App.jsx` wraps the routes in `ThemeProvider`, choosing the theme from the existing `hackhq_theme` localStorage value.

### 4.2 Component library (`src/components/ui.jsx`)
Button (variants, sizes, block, link rendering with `as`), IconButton, Card, Board, Badge, PulseDot, Eyebrow, Kbd, SectionTitle, Spinner, Skeleton, Alert, Container, Stack, Grid, form controls (FormGroup, Label, Hint, ErrorText, Input, Textarea, Select, CheckRow), Backdrop, Dialog and List. Variant props are transient (`$variant`) so they never reach the DOM.

### 4.3 Migration
Every Bootstrap class and React Bootstrap component is replaced. Pieces Bootstrap supplied are rebuilt by hand with the same keyboard behaviour: drawer, command palette, modals, schedule tabs, accordion, progress bars.

### 4.4 Concept coverage

| Task from the Day 10 list | Where |
| ------------------------- | ----- |
| Creating styled components, tagged templates | every component |
| Adapting based on props | `Button $variant/$size`, `Input $invalid` |
| Extending styles | `PillButton`, `IconButton`, `Dialog` |
| `as` polymorphic prop | `<Button as={Link}>` |
| Button variants, conditional styling | `ui.jsx`, `/kit` |
| Theme-based styling, ThemeProvider, toggle | `theme.js`, header toggle |
| Global styles, CSS helper | `GlobalStyle.js`, `css` fragments |
| Nesting, pseudo-classes and elements | `&:hover`, `&::after`, `& + &` |
| Media queries | `theme.media.up('lg')` |
| Keyframes | `animations.js` |
| polished | `darken`, `lighten`, `transparentize`, `getLuminance` |

## 5. Requirements

| ID | Requirement | Verified by |
| -- | ----------- | ----------- |
| R1 | No `bootstrap` or `react-bootstrap` in `package.json` or `src` | grep, build |
| R2 | `ThemeProvider` with light and dark themes and a persisted toggle | manual, `/kit` |
| R3 | Component library with 5 or more styled components | `ui.jsx`, `/kit` |
| R4 | Dynamic styling examples (props to CSS, theme tokens, polished) | `/kit` |
| R5 | All existing routes render and behave as before | tests, server-render of 18 routes |
| R6 | 134 unit tests still pass, lint has no errors, build passes | CI commands |
| R7 | Comparison document with measured numbers | `STYLING_COMPARISON.md` |
| R8 | README explaining CSS-in-JS concepts and where each is used | `README.md` |

## 6. Milestones

| #  | Milestone | Branch | PR |
| -- | --------- | ------ | -- |
| M1 | Standalone styled-components demo (superseded) | `day10/styled-components` | #48 |
| M2 | HackHQ continuation: foundation, library, full migration, `/kit`, docs | `day10/hackhq-styled-continuation` | #49 |

## Outcome

| Measure | Day 9 Bootstrap | Day 10 styled-components |
| ------- | --------------- | ------------------------ |
| CSS | 243 kB (35.5 kB gzip) | 7.5 kB (2.9 kB gzip) |
| JS | 509 kB (151 kB gzip) | 541 kB (160 kB gzip) |
| `.jsx` lines | 6,528 | 10,521 |
| Inline `style` attributes | 104 | 27 |
| Tests | 134 passing | 134 passing |

### Where the build differs from the plan
- M1 was a standalone demo, then replaced by M2 so the work continues the HackHQ project.
- Bootstrap's modal, tabs, accordion and drawer had no styled-components equivalent, so they were rebuilt by hand.
- Home badge and footer copy now mention styled-components instead of Bootstrap.

## 7. Verification
- `npm run build`, `npx eslint .` (0 errors) and `npm test` (134 passing).
- Server-side render of all 18 routes without errors. This caught a v6 incompatibility (`.withComponent()`).
- **Not done:** a manual browser pass at mobile, tablet and desktop widths in both themes, including drawer, command palette, schedule tabs and modals.

## 8. Risks

| Risk | Mitigation |
| ---- | ---------- |
| Hand-built overlays regress accessibility | Keep Esc, focus trap and arrow-key behaviour; manual keyboard pass |
| Runtime CSS-in-JS cost and RSC fit | Documented in the comparison; measured bundle impact |
| styled-components maintenance status | Verify current status before recommending it for new projects |
| Visual drift from Day 9 | Compare screens side by side in both themes |

## 9. Deliverables
- React app using styled-components (`Day-10/hackhq-styled`)
- Theme provider with light/dark modes
- Component library with 5 or more styled components (`ui.jsx`, `/kit`)
- Dynamic styling examples (`/kit`)
- Styling comparison document (`STYLING_COMPARISON.md`)
- README with CSS-in-JS concepts (`hackhq-styled/README.md`)
