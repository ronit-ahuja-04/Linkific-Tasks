# Day 10 Report: CSS-in-JS and styled-components

**Programme:** Linkific internship, Month 1 (training phase), Day 10
**Author:** Ronit Ahuja
**Project:** HackHQ, restyled with styled-components (`Day-10/hackhq-styled`)
**Pull requests:** #48 (first standalone demo, superseded), #49 (HackHQ continuation, merged)

## 1. Summary

Day 10 was about CSS-in-JS and styled-components. Instead of building a throwaway demo, I carried the HackHQ app forward: the Day 9 Bootstrap app was copied into `Day-10/hackhq-styled`, Bootstrap and React Bootstrap were removed, and every page and component was restyled with styled-components. All features and all 134 existing tests carry over unchanged. A light/dark `ThemeProvider`, a shared component library and a `/kit` showcase page cover the day's deliverables.

## 2. Deliverables checklist

| Deliverable | Status | Where |
|---|---|---|
| React app using styled-components | Done | `Day-10/hackhq-styled` (all 45 UI files migrated) |
| Theme provider with light/dark modes | Done | `src/styles/theme.js`, wired in `src/App.jsx`, toggle in the header, persisted in localStorage |
| Component library with 5+ styled components | Done (about 25) | `src/components/ui.jsx`, shown live at `/kit` |
| Dynamic styling examples | Done | `/kit`: prop-driven meter, variants, `$invalid` inputs, polished colour helpers |
| Styling comparison document | Done | `Day-10/STYLING_COMPARISON.md` |
| README with CSS-in-JS concepts | Done | `Day-10/hackhq-styled/README.md` |
| Watch tutorials (2 hours), read docs, VS Code extension | Not recorded here | Personal learning tasks, no artefact in the repo |

## 3. What was built

**Foundation (`src/styles/`)**
- `theme.js`: light and dark theme objects with the HackHQ brand colours, a `space()` helper, radii, fonts and `media.up/down` breakpoint helpers.
- `GlobalStyle.js`: reset, fonts, headings, focus ring, reduced-motion support.
- `animations.js`: keyframes plus `animateRise/Fade/Pop/...` css helpers.

**Component library (`src/components/ui.jsx`)**
Button (primary, secondary, ghost, danger, dark; sm, md, lg; block), IconButton, Card, Board, Badge, PulseDot, Eyebrow, Kbd, SectionTitle, Spinner, Skeleton, Alert, Container, Stack, Grid, FormGroup, Label, Hint, ErrorText, Input, Textarea, Select, CheckRow, Backdrop, Dialog and List.

**Migration of the app**
About 6,000 lines of Bootstrap markup were converted. Parts that Bootstrap used to provide were rebuilt by hand with Esc, backdrop click and focus handling: the navigation drawer, command palette, content modal, schedule tabs (arrow keys, Home and End), accordion, progress bars and form controls.

**`/kit` page**
Buttons (variants, sizes, loading spinner, `as="a"`), cards, badges, alerts, validated form fields, a dynamic meter, polished colour swatches, a hover underline using `::after`, skeletons and a modal.

## 4. CSS-in-JS concepts covered

| Concept | Where it shows up |
|---|---|
| Tagged template literals | every styled component |
| Props adaptation and transient props (`$x`) | `Button $variant/$size`, `Card $interactive`, `Input $invalid` |
| Extending styles | `styled(Button)` for `PillButton`/`IconButton`, `styled(Card)` for `Dialog` |
| `as` polymorphic prop | `<Button as={Link} to="/x">` replaced the old `buttonClass()` helper |
| `css` helper and conditional fragments | `buttonVariants`, `buttonSizes`, `hoverLift` |
| Theming | `ThemeProvider`, theme read by every component |
| Global styles | `createGlobalStyle` |
| Nesting, pseudo-classes and pseudo-elements | `&:hover`, `&::after`, `& + &`, component selectors |
| Media queries | `theme.media.up('lg')` in `Grid` and the app shell |
| Keyframes | spinner, pulse dot, modal pop, page rise |
| polished | `darken`, `lighten`, `transparentize`, `getLuminance` |

## 5. Measured results (Day 9 Bootstrap vs Day 10 styled-components)

Production builds of the same app.

| Measure | Day 9 Bootstrap | Day 10 styled-components |
|---|---|---|
| CSS file | 243 kB (35.5 kB gzip) | 7.5 kB (2.9 kB gzip, font-face rules only) |
| JS bundle | 509 kB (151 kB gzip) | 541 kB (160 kB gzip) |
| JS + CSS, gzip | about 186 kB | about 163 kB |
| `.jsx` lines | 6,528 | 10,521 (styles now live in the components) |
| Hand-written CSS files | 366 lines | 154 lines across 3 JS files |
| Inline `style` attributes | 104 | 27 |
| `className` uses left | hundreds | 15 (selector hooks inside styled components) |
| Tests | 134 | 134, all passing |

## 6. Verification

- `vite build` passes.
- ESLint: 0 errors (4 fast-refresh warnings about exporting helpers next to components).
- Vitest: 134 of 134 tests pass.
- A server-side render of all 18 routes completed without errors. This caught one real bug (`.withComponent()` was removed in styled-components v6) which is fixed.
- **Not verified:** I have not clicked through the app in a browser. Visual details and overlay behaviour (drawer, command palette, schedule tabs, modals) still need a manual pass.

## 7. Comparison takeaways (full text in `STYLING_COMPARISON.md`)

- **Plain CSS:** simplest, but global scope causes collisions as the project grows.
- **CSS Modules:** same CSS syntax with automatic scoping and no runtime cost; dynamic styles need class toggling.
- **Tailwind:** fastest to prototype and the smallest output, constrained design scale; markup gets noisy.
- **styled-components:** best when styles depend on props and a theme, with a clean component API; costs a runtime, extra SSR setup and a poor fit with React Server Components.
- **My pick for HackHQ-style client apps:** styled-components for themeable design systems, Tailwind or CSS Modules for apps that need zero runtime or server rendering.

## 8. Challenges and lessons

- Replacing Bootstrap meant rebuilding behaviour (focus traps, keyboard navigation), not just styles.
- styled-components v6 forwards unknown props to the DOM, so every variant prop had to become transient (`$variant`).
- `.withComponent()` no longer exists in v6; use `styled(Component).attrs({ as })` instead.
- The bundle got about 9 kB gzip heavier in JS, but total transfer dropped because the full Bootstrap stylesheet is gone.
- styled-components is in maintenance mode (from my own knowledge, worth re-checking), which matters for new projects.

## 9. Next steps

1. Manual browser pass at mobile, tablet and desktop widths in both themes.
2. Add a screenshot set like Day 9.
3. Add component tests for the hand-built overlays.
4. Consider code-splitting, since the JS bundle is over 500 kB.
