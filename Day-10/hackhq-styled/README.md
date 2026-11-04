# HackHQ: styled-components Redesign

**Day 10 Project:** Linkific Month 1 Training
**Author:** Ronit Ahuja
**Stack:** React 19, React Router 7, Vite 8, **styled-components 6**, polished, Vitest 4
**Comparison:** [STYLING_COMPARISON.md](../STYLING_COMPARISON.md)
**Starting point:** the Day 9 app (`Day-09/hackhq-bootstrap`). Bootstrap and React Bootstrap were removed and every page and component was restyled with styled-components. Features and tests are unchanged.

## Run
```bash
cd Day-10/hackhq-styled
npm install
npm run dev      # http://localhost:5173, the UI kit is at /kit
npm test         # 134 tests
npm run build
```
VS Code: install **vscode-styled-components** for highlighting and IntelliSense inside template literals.

## 1. What changed

| Before (Day 9) | After (Day 10) |
|---|---|
| Bootstrap classes and React Bootstrap components | Styled components, no CSS framework |
| `data-bs-theme` plus Bootstrap variables | `ThemeProvider` with `lightTheme` / `darkTheme` objects |
| Global `index.css` overrides | `GlobalStyle` plus per-component styles |
| `buttonClass()` helper | `<Button as={Link}>` and the `buttonStyles` css helper |
| Bootstrap Offcanvas, Modal, Tabs, Accordion | Hand-built, with Esc, focus trap and arrow-key support |
| New page: none | `/kit`, a themed component library and dynamic styling demo |

## 2. Structure
```
src/styles/
  theme.js          light + dark theme objects (colors, space(), radii, fonts, media.up/down)
  GlobalStyle.js    createGlobalStyle: reset, body, headings, focus ring, reduced motion
  animations.js     keyframes plus animateRise/Fade/Pop/... css helpers
src/components/ui.jsx   shared library: Button, IconButton, Card, Board, Badge, PulseDot, Eyebrow,
                        Kbd, SectionTitle, Spinner, Skeleton, Alert, Container, Stack, Grid,
                        FormGroup, Label, Hint, ErrorText, Input, Textarea, Select, CheckRow,
                        Backdrop, Dialog, List
src/pages/UiKit.jsx     live showcase of the library at /kit
```
Pages and stations compose these primitives and declare their own local styled components for anything specific.

## 3. CSS-in-JS concepts
- **What:** CSS is written in JavaScript next to the component. Each tagged template becomes a real rule with a generated class name.
- **Benefits over plain CSS:** styles are scoped automatically (no collisions), live next to the component, are deleted with it, can depend on props and state, and theme through React context.
- **Costs:** runtime work and bundle size, extra setup for SSR, and a poor fit with React Server Components.
- **Use it when:** a client-rendered app has a design system with many prop-driven variants and runtime theming.

## 4. Where each feature is used

| Feature | Where |
|---|---|
| Tagged templates, styling HTML elements | every component, e.g. `styled.button` in `ui.jsx` |
| Adapting to props | `Button` `$variant`/`$size`, `Card` `$interactive`, `Meter $pct` in `UiKit.jsx` |
| Transient props (`$x`) | all variant props, so they never reach the DOM |
| Extending styles | `PillButton = styled(Button)`, `IconButton = styled(Button)`, `Dialog = styled(Card)` |
| `as` polymorphic prop | `<Button as={Link} to="/x">`, `<Button as="a">` |
| `css` helper | `buttonVariants`, `buttonSizes`, `buttonStyles`, `hoverLift` |
| Conditional styling | `$block`, `$invalid`, `$selected`, `$wrap` |
| Theme-based styling | `theme.colors.*`, `theme.space()`, `theme.radii` everywhere |
| Global styles | `src/styles/GlobalStyle.js` |
| Nesting, pseudo-classes, pseudo-elements | `&:hover`, `&:focus`, `&::after`, `& + &`, `${Eyebrow}` selector in `SectionTitle` |
| Media queries | `theme.media.up('lg')` in `Grid` and the app shell |
| Keyframes and animations | `src/styles/animations.js`, spinner, pulse dot, modal pop |
| polished | `darken`, `lighten`, `transparentize`, `getLuminance` in `ui.jsx` and `UiKit.jsx` |

## 5. Theming
`src/styles/theme.js` exports two themes with the same shape. `App.jsx` keeps the `'light' | 'dark'` string in `useLocalStorage('hackhq_theme')`, picks `themes[theme]` and passes it to `ThemeProvider`. The header toggle flips the string, so every component re-styles with no code of its own. An inline script in `index.html` sets the page background before first paint to avoid a flash in dark mode.

## 6. Component library
Everything in section 2 is exported from `src/components/ui.jsx`. Open `/kit` to see buttons (variants, sizes, loading, `as`), cards, badges, alerts, form fields with validation state, a dynamic meter, polished colour helpers, a hover underline, skeletons and a modal.

## 7. Notes
- Bundle: CSS drops from 243 kB to 7.5 kB, JS grows from 151 to 160 kB gzip. Numbers and discussion are in the comparison doc.
- I verified `vite build`, ESLint (0 errors), 134 unit tests, and a server-side render of all 18 routes. I have not clicked through every page in a browser, so visual details and overlay behaviour (drawer, command palette, schedule tabs) deserve a manual pass.
