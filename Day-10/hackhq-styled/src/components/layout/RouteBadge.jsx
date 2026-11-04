import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Route as RouteIcon } from 'lucide-react';

const Root = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  max-width: 100%;
  padding: 0.5rem 1rem;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.board};
  color: ${({ theme }) => theme.colors.onBoard};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.875rem;
`;
const Brand = styled.code`
  color: ${({ theme }) => theme.colors.brand};
`;
const Params = styled.code`
  word-break: break-word;
  color: #fff;
  opacity: 0.75;
`;
const Arrow = styled.span`
  opacity: 0.5;
`;

/**
 * W3: Live route badge. Shows the pattern this page was matched by and the
 * raw params React Router extracted from the URL. Values print with quotes
 * on purpose: params are always strings.
 */
export default function RouteBadge({ pattern }) {
  const params = useParams();
  const entries = Object.entries(params);

  return (
    <Root aria-label={`Matched route ${pattern}`}>
      <RouteIcon size={14} aria-hidden="true" style={{ color: 'currentColor' }} />
      <Brand>{pattern}</Brand>
      <Arrow aria-hidden="true">→</Arrow>
      <Params>
        {entries.length === 0
          ? '{ }'
          : `{ ${entries.map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(', ')} }`}
      </Params>
    </Root>
  );
}
