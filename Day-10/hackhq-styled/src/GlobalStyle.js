import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: ${({ theme }) => theme.fonts.body};
    background: ${({ theme }) => theme.colors.bg};
    color: ${({ theme }) => theme.colors.text};
    line-height: 1.5;
    transition: background .25s, color .25s;
  }
  h1, h2, h3 { margin: 0 0 .5rem; }
  code { font-family: ${({ theme }) => theme.fonts.mono}; font-size: .9em; }
`;
