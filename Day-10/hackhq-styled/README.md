# HackHQ Styled — CSS-in-JS with styled-components

Day 10 deliverable: a themed component library (light/dark) built entirely with styled-components v6, plus a demo page.

## Run
```bash
npm install
npm run dev     # http://localhost:5173
npm run build
```
VS Code: install the **vscode-styled-components** extension for CSS highlighting and IntelliSense inside template literals.

## Structure
```
src/
  theme.js          light + dark theme objects (colors, radii, space, breakpoints)
  GlobalStyle.js    createGlobalStyle (reset, body, theme-aware colours)
  useTheme.jsx      mode state, persisted to localStorage, defaults to OS preference
  components/       Button, PillButton, Card, Input, Modal, Badge, ThemeSwitcher
  App.jsx           demo page showing every feature
```

## CSS-in-JS concepts
- **What**: CSS is written in JavaScript next to the component. styled-components turns each tagged template into a real stylesheet rule with a unique class.
- **Benefits**: styles scoped automatically (no collisions), co-located with the component, dead styles removed with the component, dynamic styles from props and state, theming through context.
- **Costs**: runtime work and bundle size, extra SSR setup, awkward with React Server Components.
- **Use when**: a client-rendered design system with many prop-driven variants and runtime theming.

## Syntax cheat sheet (all used in this repo)
| Feature | Where |
|---|---|
| Tagged template + styling HTML elements | `styled.button\`...\`` in every component |
| Props adaptation | `${({ $variant }) => ...}` in `Button.jsx`, `$pct` in `Bar` (`App.jsx`) |
| Transient props (`$x`) | stop non-DOM props leaking into the HTML |
| Extending | `styled(Button)` → `PillButton` |
| `as` polymorphic prop | `<Button as="a" href>` and `<Heading as="h1">` |
| `css` helper | `variants`, `sizes` objects in `Button.jsx` |
| Conditional styling | `$loading`, `$block`, `$interactive`, `disabled` |
| Theming | `ThemeProvider` in `App.jsx`, `theme.colors.*` everywhere |
| Global styles | `GlobalStyle.js` |
| Nesting / pseudo-classes / pseudo-elements | `&:hover`, `&:focus-visible`, `&::after`, `& + &` |
| Media queries | `Grid` in `App.jsx`, breakpoints from theme |
| Keyframes | spinner in `Button.jsx`, fade/pop in `Modal.jsx` |
| polished | `darken`, `lighten`, `transparentize` for hover and badge colours |

## Theming
`theme.js` exports `lightTheme` and `darkTheme` with the same shape. `useThemeMode` picks one (saved choice, else OS preference) and `ThemeProvider` supplies it. The `ThemeSwitcher` toggle (a `role="switch"` button) flips it, and the choice is saved in localStorage.

## Component library
| Component | Variants/props |
|---|---|
| Button | `$variant` primary/secondary/danger/ghost, `$size` sm/md/lg, `$block`, `$loading` |
| PillButton | extends Button |
| Card (+ CardTitle, CardText) | `$interactive` |
| Input | `label`, `error`, `hint`, disabled |
| Modal | `open`, `title`, `actions`, Esc/overlay close |
| Badge | `$tone` info/danger/neutral |
| ThemeSwitcher | `mode`, `onToggle` |

See [../STYLING_COMPARISON.md](../STYLING_COMPARISON.md) for the comparison with CSS Modules, Tailwind and plain CSS.
