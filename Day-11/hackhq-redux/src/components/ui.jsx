import styled, { css } from 'styled-components';
import { transparentize } from 'polished';
import { animatePop, pingSlow, spin, shimmer } from '../styles/animations.js';

/**
 * Shared styled-components primitives. Every page and station composes these, so the look stays
 * consistent and a design change is a one-file edit. Variant/size/tone props are transient ($-prefixed)
 * so they never reach the DOM.
 */

export const cx = (...parts) => parts.filter(Boolean).join(' ');

/* ---------- Buttons ---------- */
const buttonVariants = {
  primary: css`
    background: ${({ theme }) => theme.colors.brand};
    color: ${({ theme }) => theme.colors.onBrand};
    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.brandHover};
    }
  `,
  secondary: css`
    background: transparent;
    color: ${({ theme }) => theme.colors.ink};
    border-color: ${({ theme }) => theme.colors.line};
    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.surface2};
    }
  `,
  ghost: css`
    background: transparent;
    color: ${({ theme }) => theme.colors.muted};
    &:hover:not(:disabled) {
      color: ${({ theme }) => theme.colors.ink};
      background: ${({ theme }) => theme.colors.surface2};
    }
  `,
  danger: css`
    background: transparent;
    color: ${({ theme }) => theme.colors.bad};
    border-color: ${({ theme }) => theme.colors.bad};
    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.bad};
      color: #fff;
    }
  `,
  dark: css`
    background: ${({ theme }) => theme.colors.ink};
    color: ${({ theme }) => theme.colors.bg};
    &:hover:not(:disabled) {
      opacity: 0.88;
    }
  `,
};
const buttonSizes = {
  sm: css`
    padding: 0.25rem 0.625rem;
    font-size: 0.8125rem;
  `,
  md: css`
    padding: 0.5rem 1rem;
    font-size: 0.9375rem;
  `,
  lg: css`
    padding: 0.75rem 1.5rem;
    font-size: 1.0625rem;
  `,
};

/** css fragment so anything (e.g. a Link) can look like a button */
export const buttonStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radii.md};
  font-weight: 600;
  line-height: 1.5;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background-color 0.15s,
    color 0.15s,
    opacity 0.15s,
    transform 0.1s;
  ${({ $variant = 'primary' }) => buttonVariants[$variant]}
  ${({ $size = 'md' }) => buttonSizes[$size]}
  ${({ $block }) =>
    $block &&
    css`
      width: 100%;
    `}
  &:active:not(:disabled) {
    transform: translateY(1px);
  }
  &:disabled,
  &[aria-disabled='true'] {
    opacity: 0.55;
    cursor: not-allowed;
    pointer-events: none;
  }
`;

/** <Button $variant="primary|secondary|ghost|danger|dark" $size="sm|md|lg" $block />
 *  Render a router link as a button with <Button as={Link} to="/x"> */
export const Button = styled.button.attrs(({ as, type }) => ({
  type: as ? type : (type ?? 'button'),
}))`
  ${buttonStyles}
`;

/** Round icon-only button */
export const IconButton = styled(Button)`
  padding: 0;
  width: 2.5rem;
  height: 2.5rem;
`;

/* ---------- Surfaces ---------- */
/** <Card $padded={false} $interactive $flush> */
export const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadow};
  padding: ${({ $padded = true }) => ($padded ? '1.5rem' : '0')};
  min-width: 0;
  ${({ $interactive }) =>
    $interactive &&
    css`
      transition:
        transform 0.15s,
        border-color 0.15s;
      &:hover {
        transform: translateY(-3px);
        border-color: ${({ theme }) => theme.colors.accent};
      }
    `}
`;

/** Dark "departure board" panel */
export const Board = styled.div`
  background: ${({ theme }) => theme.colors.board};
  color: ${({ theme }) => theme.colors.onBoard};
  border-radius: ${({ theme }) => theme.radii.lg};
`;

/* ---------- Badges and small bits ---------- */
const toneStyles = {
  neutral: ({ colors }) => ({ bg: colors.surface2, fg: colors.muted }),
  brand: ({ colors }) => ({ bg: colors.brand, fg: colors.onBrand }),
  accent: ({ colors }) => ({ bg: colors.accentSoft, fg: colors.accent }),
  good: ({ colors }) => ({ bg: colors.goodSoft, fg: colors.good }),
  warn: ({ colors }) => ({ bg: colors.warnSoft, fg: colors.warn }),
  bad: ({ colors }) => ({ bg: colors.badSoft, fg: colors.bad }),
};
export const toneColors = (theme, tone = 'neutral') => toneStyles[tone](theme);

/** <Badge $tone="neutral|brand|accent|good|warn|bad"> */
export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25em 0.75em;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.75em;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  line-height: 1.2;
  white-space: nowrap;
  background: ${({ theme, $tone }) => toneColors(theme, $tone).bg};
  color: ${({ theme, $tone }) => toneColors(theme, $tone).fg};
`;

const PulseWrap = styled.span`
  position: relative;
  display: inline-flex;
  width: 0.5rem;
  height: 0.5rem;
`;
const Dot = styled.span`
  display: inline-flex;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  position: relative;
  background: ${({ theme, $tone }) => toneColors(theme, $tone === 'bad' ? 'bad' : $tone === 'warn' ? 'warn' : 'good').fg};
`;
const Ring = styled(Dot)`
  position: absolute;
  inset: 0;
  opacity: 0.6;
  animation: ${pingSlow} 2s cubic-bezier(0, 0, 0.2, 1) infinite;
`;
export function PulseDot({ tone = 'good', className }) {
  return (
    <PulseWrap className={className} aria-hidden="true">
      <Ring $tone={tone} />
      <Dot $tone={tone} />
    </PulseWrap>
  );
}

export const Eyebrow = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.8125rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: ${({ theme }) => theme.colors.muted};
`;

export const Kbd = styled.kbd`
  border: 1px solid ${({ theme }) => theme.colors.line};
  background: ${({ theme }) => theme.colors.surface2};
  color: ${({ theme }) => theme.colors.muted};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.8em;
  padding: 0.125rem 0.5rem;
  border-radius: ${({ theme }) => theme.radii.sm};
`;

const SectionHead = styled.div`
  margin-bottom: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  h2 {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0;
  }
  ${Eyebrow} {
    margin-bottom: 0.5rem;
  }
`;
export function SectionTitle({ eyebrow, title, children, className }) {
  return (
    <SectionHead className={className}>
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2>{title}</h2>
      </div>
      {children}
    </SectionHead>
  );
}

export const Spinner = styled.span`
  display: inline-block;
  width: 1em;
  height: 1em;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-right-color: transparent;
  animation: ${spin} 0.7s linear infinite;
`;

/** Loading placeholder block: <Skeleton $w="8rem" $h="1rem" /> */
export const Skeleton = styled.span`
  display: block;
  width: ${({ $w = '100%' }) => $w};
  height: ${({ $h = '1rem' }) => $h};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface2};
  animation: ${shimmer} 1.4s ease-in-out infinite;
`;

/** Inline alert: <Alert $tone="bad|warn|good|accent"> */
export const Alert = styled.div`
  padding: 0.75rem 1rem;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid
    ${({ theme, $tone = 'accent' }) => transparentize(0.6, toneColors(theme, $tone).fg)};
  background: ${({ theme, $tone = 'accent' }) => toneColors(theme, $tone).bg};
  color: ${({ theme, $tone = 'accent' }) => toneColors(theme, $tone).fg};
`;

/* ---------- Layout primitives (replace Bootstrap grid + utility classes) ---------- */
/** Page container: <Container $fluid> */
export const Container = styled.div`
  width: 100%;
  margin: 0 auto;
  padding: 0 1rem;
  max-width: ${({ $fluid, $max = '90rem' }) => ($fluid ? '100%' : $max)};
`;

/** Flex column/row with gap. <Stack $gap={3} $dir="row" $align="center" $justify="space-between" $wrap /> (gap is in theme.space units) */
export const Stack = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: ${({ $dir = 'column' }) => $dir};
  gap: ${({ theme, $gap = 3 }) => theme.space($gap)};
  align-items: ${({ $align }) => $align || 'stretch'};
  ${({ $justify }) =>
    $justify &&
    css`
      justify-content: ${$justify};
    `}
  ${({ $wrap }) =>
    $wrap &&
    css`
      flex-wrap: wrap;
    `}
`;

/** Responsive grid. <Grid $cols={{ base: 1, md: 2, lg: 3 }} $gap={4} /> or $cols={3} */
export const Grid = styled.div`
  display: grid;
  min-width: 0;
  gap: ${({ theme, $gap = 4 }) => theme.space($gap)};
  ${({ theme, $cols = 1 }) => {
    const c = typeof $cols === 'number' ? { base: $cols } : $cols;
    return css`
      grid-template-columns: repeat(${c.base ?? 1}, minmax(0, 1fr));
      ${['sm', 'md', 'lg', 'xl', 'xxl']
        .filter((k) => c[k])
        .map(
          (k) => css`
            ${theme.media.up(k)} {
              grid-template-columns: repeat(${c[k]}, minmax(0, 1fr));
            }
          `
        )}
    `;
  }}
`;

export const Muted = styled.span`
  color: ${({ theme }) => theme.colors.muted};
`;
export const Mono = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
`;

/* ---------- Forms ---------- */
export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  min-width: 0;
`;
export const Label = styled.label`
  font-weight: 500;
  font-size: 0.9375rem;
`;
export const Hint = styled.p`
  margin: 0;
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.muted};
`;
export const ErrorText = styled.p`
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.bad};
`;

const control = css`
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.ink};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme, $invalid }) => ($invalid ? theme.colors.bad : theme.colors.line)};
  border-radius: ${({ theme }) => theme.radii.md};
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  &::placeholder {
    color: ${({ theme }) => theme.colors.muted};
  }
  &:focus {
    outline: none;
    border-color: ${({ theme, $invalid }) => ($invalid ? theme.colors.bad : theme.colors.accent)};
    box-shadow: 0 0 0 3px
      ${({ theme, $invalid }) => transparentize(0.75, $invalid ? theme.colors.bad : theme.colors.accent)};
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
/** <Input $invalid />, <Textarea $invalid />, <Select $invalid /> */
export const Input = styled.input`
  ${control}
`;
export const Textarea = styled.textarea`
  ${control} resize: vertical;
`;
export const Select = styled.select`
  ${control}
`;

/** Checkbox/radio row: <CheckRow><input type="checkbox" /> Label</CheckRow> */
export const CheckRow = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  input {
    accent-color: ${({ theme }) => theme.colors.accent};
    width: 1rem;
    height: 1rem;
  }
`;

/* ---------- Overlay / modal ---------- */
export const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1050;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.overlay};
`;
export const Dialog = styled(Card).attrs({ role: 'dialog', 'aria-modal': 'true' })`
  width: min(${({ $width = '32rem' }) => $width}, 100%);
  max-height: 90vh;
  overflow: auto;
  ${animatePop}
`;

/* ---------- Lists ---------- */
/** Bordered list container whose direct children get dividers */
export const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface};
  > li {
    padding: 0.75rem 1rem;
  }
  > li + li {
    border-top: 1px solid ${({ theme }) => theme.colors.line};
  }
`;
