// Theme objects for ThemeProvider. Colours are carried over from the Day 8/9 brand tokens.
const BREAKPOINTS = { sm: 576, md: 768, lg: 992, xl: 1200, xxl: 1400 };

const base = {
  space: (n) => `${n * 0.25}rem`, // theme.space(4) === '1rem'
  radii: { sm: '0.5rem', md: '0.75rem', lg: '1.25rem', pill: '999px' },
  fonts: {
    body: "'Inter Variable', system-ui, sans-serif",
    heading: "'Space Grotesk Variable', system-ui, sans-serif",
    mono: "'JetBrains Mono Variable', ui-monospace, monospace",
  },
  breakpoints: BREAKPOINTS,
  // media.up('lg') -> '@media (min-width: 992px)'; media.down('lg') -> max-width 991.98px
  media: {
    up: (k) => `@media (min-width: ${BREAKPOINTS[k]}px)`,
    down: (k) => `@media (max-width: ${BREAKPOINTS[k] - 0.02}px)`,
  },
  headerHeight: '4rem',
};

export const lightTheme = {
  ...base,
  name: 'light',
  colors: {
    bg: '#f5f5f1',
    surface: '#ffffff',
    surface2: '#eeeee8',
    line: '#deded6',
    ink: '#0e0e11',
    muted: '#5a5a64',
    brand: '#c8f031',
    brandHover: '#b7e016',
    onBrand: '#0e0e11',
    accent: '#5636e8',
    accentSoft: 'rgb(86 54 232 / 0.1)',
    board: '#0e0e11',
    onBoard: '#f4f4f5',
    good: '#198754',
    goodSoft: 'rgb(25 135 84 / 0.12)',
    warn: '#9a6b00',
    warnSoft: 'rgb(255 193 7 / 0.2)',
    bad: '#c62839',
    badSoft: 'rgb(220 53 69 / 0.12)',
    overlay: 'rgb(14 14 17 / 0.5)',
  },
  shadow: '0 1px 2px rgb(0 0 0 / 0.06), 0 4px 14px rgb(0 0 0 / 0.05)',
};

export const darkTheme = {
  ...base,
  name: 'dark',
  colors: {
    bg: '#09090c',
    surface: '#131317',
    surface2: '#1b1b21',
    line: '#2a2a33',
    ink: '#f4f4f5',
    muted: '#9b9ba8',
    brand: '#d2ff3f',
    brandHover: '#e1ff7a',
    onBrand: '#0e0e11',
    accent: '#a98bff',
    accentSoft: 'rgb(169 139 255 / 0.14)',
    board: '#050507',
    onBoard: '#f4f4f5',
    good: '#4cc38a',
    goodSoft: 'rgb(76 195 138 / 0.15)',
    warn: '#ffc857',
    warnSoft: 'rgb(255 200 87 / 0.15)',
    bad: '#ff6b7a',
    badSoft: 'rgb(255 107 122 / 0.15)',
    overlay: 'rgb(0 0 0 / 0.65)',
  },
  shadow: '0 1px 2px rgb(0 0 0 / 0.4), 0 4px 14px rgb(0 0 0 / 0.35)',
};

export const themes = { light: lightTheme, dark: darkTheme };
