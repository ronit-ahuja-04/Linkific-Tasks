import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; }
  html { -webkit-font-smoothing: antialiased; color-scheme: ${({ theme }) => theme.name}; }
  body {
    margin: 0;
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: 1rem; line-height: 1.5;
    background: ${({ theme }) => theme.colors.bg};
    color: ${({ theme }) => theme.colors.ink};
    transition: background-color 200ms ease, color 200ms ease;
  }
  h1, h2, h3, h4, h5, h6 {
    margin: 0 0 .5rem; line-height: 1.2;
    font-family: ${({ theme }) => theme.fonts.heading}; letter-spacing: -0.02em;
  }
  p { margin: 0 0 1rem; }
  ul, ol { margin: 0; padding: 0; }
  a { color: ${({ theme }) => theme.colors.accent}; }
  img, svg { vertical-align: middle; }
  button, input, select, textarea { font: inherit; color: inherit; }
  button { cursor: pointer; }
  table { border-collapse: collapse; }
  hr { border: 0; border-top: 1px solid ${({ theme }) => theme.colors.line}; margin: 1rem 0; }
  ::selection { background: ${({ theme }) => theme.colors.brand}; color: ${({ theme }) => theme.colors.onBrand}; }
  :focus-visible { outline: 2px solid ${({ theme }) => theme.colors.accent}; outline-offset: 2px; }
  .visually-hidden {
    position: absolute !important; width: 1px; height: 1px; margin: -1px; padding: 0;
    overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: .01ms !important; animation-iteration-count: 1 !important;
      transition-duration: .01ms !important; scroll-behavior: auto !important;
    }
  }
`;
