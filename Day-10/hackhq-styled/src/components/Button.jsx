import styled, { css, keyframes } from 'styled-components';
import { darken, lighten } from 'polished';

const spin = keyframes`to { transform: rotate(360deg); }`;

// css helper: reusable fragment, picks colours from the theme by variant
const variants = {
  primary: css`
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primaryText};
    &:hover:not(:disabled) { background: ${({ theme }) => darken(0.07, theme.colors.primary)}; }
  `,
  secondary: css`
    background: ${({ theme }) => theme.colors.secondary};
    color: ${({ theme }) => theme.colors.secondaryText};
    &:hover:not(:disabled) { background: ${({ theme }) => lighten(0.04, theme.colors.secondary)}; }
  `,
  danger: css`
    background: ${({ theme }) => theme.colors.danger};
    color: ${({ theme }) => theme.colors.dangerText};
    &:hover:not(:disabled) { background: ${({ theme }) => darken(0.08, theme.colors.danger)}; }
  `,
  ghost: css`
    background: transparent;
    color: ${({ theme }) => theme.colors.text};
    border-color: ${({ theme }) => theme.colors.border};
    &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.secondary}; }
  `,
};

const sizes = {
  sm: css`padding: 4px 10px; font-size: .8rem;`,
  md: css`padding: 8px 16px; font-size: .95rem;`,
  lg: css`padding: 12px 24px; font-size: 1.05rem;`,
};

// transient props ($variant, $size, ...) are NOT forwarded to the DOM
export const Button = styled.button`
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radii.md};
  font-weight: 600; cursor: pointer;
  text-decoration: none;
  transition: background .15s, transform .1s, box-shadow .15s;
  ${({ $variant = 'primary' }) => variants[$variant]}
  ${({ $size = 'md' }) => sizes[$size]}
  ${({ $block }) => $block && css`width: 100%;`}

  &:active:not(:disabled) { transform: translateY(1px); }
  &:focus-visible { outline: 3px solid ${({ theme }) => theme.colors.primary}; outline-offset: 2px; }
  &:disabled { opacity: .5; cursor: not-allowed; }

  ${({ $loading }) => $loading && css`
    pointer-events: none;
    &::after {
      content: ''; width: 1em; height: 1em; border-radius: 50%;
      border: 2px solid currentColor; border-right-color: transparent;
      animation: ${spin} .7s linear infinite;
    }
  `}
`;

// Extending: same styles + overrides
export const PillButton = styled(Button)`
  border-radius: 999px;
`;
