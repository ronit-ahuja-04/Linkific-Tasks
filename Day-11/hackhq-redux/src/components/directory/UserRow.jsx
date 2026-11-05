import styled from 'styled-components';
import { Badge } from '../ui.jsx';

const Row = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem;
  text-align: left;
  font: inherit;
  cursor: pointer;
  border: 0;
  border-radius: 0;
  background: ${({ theme, $selected }) => ($selected ? theme.colors.accent : theme.colors.surface)};
  color: ${({ theme, $selected }) => ($selected ? theme.colors.surface : theme.colors.ink)};
  &:hover {
    background: ${({ theme, $selected }) => ($selected ? theme.colors.accent : theme.colors.surface2)};
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: -2px;
  }
`;
const Avatar = styled.img`
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid ${({ theme }) => theme.colors.line};
  background: ${({ theme }) => theme.colors.surface2};
`;
const Body = styled.div`
  min-width: 0;
  flex: 1 1 auto;
`;
const NameLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  > span:first-child {
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;
const Email = styled.div`
  font-size: 0.875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  ${({ theme, $selected }) => !$selected && `color: ${theme.colors.muted};`}
`;
const Cta = styled.div`
  display: none;
  flex-shrink: 0;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  ${({ theme }) => theme.media.up('sm')} {
    display: block;
  }
`;

/**
 * Single participant list row rendering avatar, full name, email, and age.
 * Complies with requirement PD-2.
 */
export function UserRow({ user, isSelected, onSelect }) {
  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <Row type="button" $selected={isSelected} onClick={() => onSelect(user.id)}>
      <Avatar src={user.image} alt={fullName} loading="lazy" />
      <Body>
        <NameLine>
          <span>{fullName}</span>
          <Badge $tone="neutral">{user.age} yrs</Badge>
        </NameLine>
        <Email $selected={isSelected}>{user.email}</Email>
      </Body>
      <Cta>{isSelected ? 'Selected ✓' : 'View posts →'}</Cta>
    </Row>
  );
}
