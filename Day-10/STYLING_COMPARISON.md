# Styling approaches compared

Same app (HackHQ) was styled in Day 8 (Tailwind), Day 9 (Bootstrap) and Day 10 (styled-components), so this comes from using all three.

## Summary

| | Plain CSS | CSS Modules | Tailwind | Styled Components |
|---|---|---|---|---|
| Scoping | Global, naming discipline (BEM) | Auto-hashed class names per file | Utility classes, no scoping needed | Auto-generated class per component |
| Dynamic styles | Toggle classes, CSS variables | Toggle classes, `clsx` | Conditional class strings | Props and theme in the CSS itself |
| Theming | CSS variables | CSS variables | `dark:` variant, config tokens | `ThemeProvider` (JS object) |
| Runtime cost | None | None | None | Small JS runtime, styles injected at render |
| Build step | None | Bundler | PostCSS/Vite plugin | None (just a library) |
| Co-location | Separate file | Separate file, same folder | In the JSX | In the component file |
| Bundle impact | CSS only | CSS only | Small purged CSS | ~13 kB gzip library + styles in JS |
| SSR | Trivial | Trivial | Trivial | Needs `ServerStyleSheet` setup |
| Learning curve | Lowest | Low | Medium (memorise utilities) | Medium (tagged templates, props) |
| Typing/tooling | Good | Class names are strings | IntelliSense plugin | Highlighting needs extension |

## Plain CSS vs CSS Modules
- Plain CSS has global scope, so collisions and specificity fights grow with the codebase.
- CSS Modules keep the same CSS syntax but hash class names per file. This fixes collisions at no runtime cost.
- Downside: dynamic values still need class toggling or inline variables.

## CSS Modules vs Tailwind
- Modules: semantic class names, styles live apart from markup, familiar CSS.
- Tailwind: no naming and no context switching, a constrained design scale, and tiny output. Markup gets noisy, and variants need `clsx` or `cva`.

## Tailwind vs Styled Components
- Tailwind decides styling at build time; styled-components decides at render time from props.
- Styled-components wins when styles depend on many runtime values (theme, state, props) and when you want a component API such as `<Button $variant="danger">`.
- Tailwind wins on performance, SSR/RSC friendliness and speed of prototyping.

## When to use each
- **Plain CSS**: small sites, global resets, design tokens as CSS variables.
- **CSS Modules**: component libraries or apps that want zero runtime and plain CSS.
- **Tailwind**: product teams that want speed and consistency, and server-rendered apps.
- **Styled Components**: themeable design systems with heavy prop-driven variants in client-rendered React.

## Caveats
- styled-components is in maintenance mode, and runtime CSS-in-JS is a poor fit for React Server Components. New projects often pick zero-runtime options (Tailwind, CSS Modules, vanilla-extract, Panda, Linaria) instead. Check current status before committing.
- A hybrid is common: Tailwind or Modules for layout, CSS variables for theme tokens.

## Measured on the real app (HackHQ Day 9 Bootstrap vs Day 10 styled-components)
Same pages, same features, same 134 tests. Production build, `vite build`.

| | Day 9 Bootstrap | Day 10 styled-components |
|---|---|---|
| CSS file | 243 kB (35.5 kB gzip) | 7.5 kB (2.9 kB gzip, just the @font-face rules) |
| JS bundle | 509 kB (151 kB gzip) | 541 kB (160 kB gzip) |
| JS + CSS gzip | about 186 kB | about 163 kB |
| Styled components declared | none | 519 across 48 files |
| Runtime dependencies for styling | bootstrap, react-bootstrap | styled-components, polished |

## What I observed
- **Bundle:** the stylesheet nearly disappears and the JS grows by about 9 kB gzip, because styled-components and the CSS now ship inside the bundle. Total gzip is lower here because Bootstrap ships all of its CSS, used or not.
- **Theming:** light/dark is one `ThemeProvider` value (`src/styles/theme.js`). No `data-bs-theme` variables, no mapping of brand tokens onto framework variables.
- **Variants:** `Button` has variants, sizes, block and link rendering (`as={Link}`) in one `ui.jsx` definition. Day 9 needed a `buttonClass()` helper plus custom `.btn-brand` CSS overrides.
- **Lost for free:** Bootstrap's grid, Offcanvas, Modal, Tabs and Accordion. I rebuilt them with `Grid`/`Stack` primitives and small hand-written components, which cost more effort and more accessibility care (focus trap, Esc, arrow keys).
- **Gotcha found while building:** styled-components v6 removed `.withComponent()` and passes non-transient props to the DOM, so variant props must be `$`-prefixed.
