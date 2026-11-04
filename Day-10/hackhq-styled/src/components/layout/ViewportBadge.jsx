import styled from 'styled-components';
import { useWindowSize } from '../../hooks/useWindowSize.js';
import { toneColors } from '../ui.jsx';

// The six grid breakpoints, widest first, with the tone used for each group
const BREAKPOINTS = [
  { name: 'xxl', min: 1400, tone: 'good' },
  { name: 'xl', min: 1200, tone: 'good' },
  { name: 'lg', min: 992, tone: 'good' },
  { name: 'md', min: 768, tone: 'accent' },
  { name: 'sm', min: 576, tone: 'warn' },
  { name: 'xs', min: 0, tone: 'warn' },
];

const Root = styled.aside`
  position: fixed;
  bottom: 0.75rem;
  left: 0.75rem;
  z-index: 1030;
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 1rem;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ theme }) => theme.colors.line};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.muted};
  box-shadow: ${({ theme }) => theme.shadow};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.68rem;
  ${({ theme }) => theme.media.up('sm')} {
    display: flex;
  }
  ${({ theme }) => theme.media.up('lg')} {
    left: 17rem;
  }
`;
const Size = styled.span`
  color: ${({ theme }) => theme.colors.ink};
`;
const Tag = styled.span`
  border-radius: ${({ theme }) => theme.radii.pill};
  padding: 0.25rem 0.5rem;
  font-weight: 500;
  background: ${({ theme, $tone }) => toneColors(theme, $tone).bg};
  color: ${({ theme, $tone }) => toneColors(theme, $tone).fg};
`;

/**
 * Viewport dimensions badge displaying live screen width, height,
 * and the grid breakpoint currently in effect.
 * Complies with requirement VP-1.
 */
export function ViewportBadge() {
  const { width, height } = useWindowSize();

  const breakpoint = BREAKPOINTS.find((bp) => width >= bp.min);

  return (
    <Root aria-label="Responsive viewport diagnostics">
      <span>Viewport</span>
      <Size>
        {width} × {height}
      </Size>
      <Tag $tone={breakpoint.tone}>
        {breakpoint.name} (≥{breakpoint.min}px)
      </Tag>
    </Root>
  );
}
