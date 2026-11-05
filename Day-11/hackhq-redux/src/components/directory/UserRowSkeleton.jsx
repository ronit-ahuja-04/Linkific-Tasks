import styled, { css } from 'styled-components';
import { Skeleton, List } from '../ui.jsx';

const hidden = css`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
const Wrap = styled(List)`
  position: relative;
`;
const Item = styled.li`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.line};
  }
`;
const Avatar = styled(Skeleton)`
  flex-shrink: 0;
  border-radius: 50%;
`;
const Lines = styled.div`
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;
const Hidden = styled.span`
  ${hidden}
`;

/**
 * Accessible skeleton placeholder rows displayed while participant data is loading.
 * Complies with requirement PD-1.
 */
export function UserRowSkeleton({ count = 5 }) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <Wrap
      as="div"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading participants"
    >
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map((idx) => (
          <Item key={idx}>
            <Avatar $w="44px" $h="44px" />
            <Lines>
              <Skeleton $w="50%" $h="1rem" />
              <Skeleton $w="75%" $h="0.75rem" />
            </Lines>
          </Item>
        ))}
      </ul>
      <Hidden>Loading participants list...</Hidden>
    </Wrap>
  );
}
