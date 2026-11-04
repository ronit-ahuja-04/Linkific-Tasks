const shared = {
  radii: { sm: '6px', md: '10px', lg: '16px' },
  space: (n) => `${n * 4}px`,
  breakpoints: { sm: '640px', md: '900px' },
  fonts: { body: "system-ui, -apple-system, 'Segoe UI', sans-serif", mono: "ui-monospace, 'SF Mono', monospace" },
};

export const lightTheme = {
  ...shared,
  name: 'light',
  colors: {
    bg: '#f6f7fb', surface: '#ffffff', text: '#171923', muted: '#5b6275', border: '#dfe3ee',
    primary: '#5b3df5', primaryText: '#ffffff',
    secondary: '#e8e6fd', secondaryText: '#3a22c9',
    danger: '#d92d48', dangerText: '#ffffff', overlay: 'rgba(15,17,30,.45)',
  },
  shadow: '0 4px 18px rgba(30,30,80,.08)',
};

export const darkTheme = {
  ...shared,
  name: 'dark',
  colors: {
    bg: '#0f111a', surface: '#181b29', text: '#eceef7', muted: '#9aa1b8', border: '#2b3046',
    primary: '#8b78ff', primaryText: '#0f111a',
    secondary: '#262a45', secondaryText: '#c9c2ff',
    danger: '#ff5c75', dangerText: '#0f111a', overlay: 'rgba(0,0,0,.6)',
  },
  shadow: '0 4px 18px rgba(0,0,0,.4)',
};
