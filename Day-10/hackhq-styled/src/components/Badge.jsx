import styled from 'styled-components';
import { transparentize } from 'polished';

const toneKey = { info: 'primary', danger: 'danger', neutral: 'muted' };

export const Badge = styled.span`
  display: inline-block; padding: 2px 10px; border-radius: 999px;
  font-size: .75rem; font-weight: 700; letter-spacing: .02em;
  color: ${({ theme, $tone = 'info' }) => theme.colors[toneKey[$tone]]};
  background: ${({ theme, $tone = 'info' }) => transparentize(0.85, theme.colors[toneKey[$tone]])};
`;
