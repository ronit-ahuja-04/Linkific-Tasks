import { useState } from 'react';
import styled from 'styled-components';
import { CalendarCheck, CalendarPlus, ChevronDown, MapPin, User } from 'lucide-react';
import { Badge, Button, Mono, PulseDot } from '../ui.jsx';
import { TRACK_TONES, formatTimeRange } from '../../lib/schedule.js';

const Wrap = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface};
`;
const Item = styled.div`
  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.line};
  }
`;
const ItemHeading = styled.h3`
  margin: 0;
  font-size: inherit;
`;
const Trigger = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 1rem 1.25rem;
  text-align: left;
  background: ${({ theme, $open }) => ($open ? theme.colors.surface2 : 'transparent')};
  color: ${({ theme }) => theme.colors.ink};
  border: 0;
  cursor: pointer;
  &:hover {
    background: ${({ theme }) => theme.colors.surface2};
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: -2px;
  }
  & > svg {
    flex: 0 0 auto;
    transition: transform 0.2s;
    transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'none')};
  }
`;
const Summary = styled.span`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: ${({ theme }) => theme.space(1)};
  width: 100%;
  margin-right: ${({ theme }) => theme.space(3)};
  ${({ theme }) => theme.media.up('md')} {
    flex-direction: row;
    align-items: center;
    gap: ${({ theme }) => theme.space(3)};
  }
`;
const Time = styled(Mono)`
  font-size: 0.875rem;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.muted};
`;
const Title = styled.span`
  flex-grow: 1;
  font-weight: 600;
`;
const Badges = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
`;
const Body = styled.div`
  padding: 1rem 1.25rem;
`;
const Description = styled.p`
  margin: 0 0 1rem;
  color: ${({ theme }) => theme.colors.muted};
`;
const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(3)};
`;
const Facts = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  column-gap: ${({ theme }) => theme.space(4)};
  row-gap: ${({ theme }) => theme.space(1)};
  font-size: 0.875rem;
  li {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.space(2)};
  }
`;
const Hidden = styled.span`
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

/**
 * CONCEPT: Accordion - one collapsible item per session. The header keeps the scannable facts
 * (time, title, badges); the body holds the details and the save button, so the header stays a
 * single button and never nests another one. Only one item is open at a time.
 */
export default function SessionList({
  sessions,
  savedIds,
  clashingIds,
  nowIds,
  nextIds,
  onToggleSaved,
}) {
  const [openId, setOpenId] = useState(null);

  return (
    <Wrap>
      {sessions.map((session) => {
        const saved = savedIds.includes(session.id);
        const open = openId === session.id;
        const panelId = `session-panel-${session.id}`;
        const headerId = `session-header-${session.id}`;

        return (
          <Item key={session.id}>
            <ItemHeading>
              <Trigger
                type="button"
                id={headerId}
                $open={open}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenId(open ? null : session.id)}
              >
                <Summary>
                  <Time>{formatTimeRange(session)}</Time>
                  <Title>{session.title}</Title>
                  <Badges>
                    {nowIds.has(session.id) && (
                      <Badge $tone="good">
                        <PulseDot />
                        Live now
                      </Badge>
                    )}
                    {nextIds.has(session.id) && <Badge $tone="accent">Up next</Badge>}
                    {saved && clashingIds.has(session.id) && <Badge $tone="warn">Clash</Badge>}
                    {saved && <Badge $tone="neutral">Saved</Badge>}
                    <Badge $tone={TRACK_TONES[session.track]}>{session.track}</Badge>
                  </Badges>
                </Summary>
                <ChevronDown size={16} aria-hidden="true" />
              </Trigger>
            </ItemHeading>
            {open && (
              <Body id={panelId} role="region" aria-labelledby={headerId}>
                <Description>{session.description}</Description>
                <Actions>
                  <Facts>
                    <li>
                      <User size={14} aria-hidden="true" />
                      <Hidden>Speaker: </Hidden>
                      {session.speaker}
                    </li>
                    <li>
                      <MapPin size={14} aria-hidden="true" />
                      <Hidden>Room: </Hidden>
                      {session.room}
                    </li>
                  </Facts>
                  <Button
                    $variant={saved ? 'secondary' : 'primary'}
                    $size="sm"
                    aria-pressed={saved}
                    onClick={() => onToggleSaved(session)}
                  >
                    {saved ? (
                      <CalendarCheck size={14} aria-hidden="true" />
                    ) : (
                      <CalendarPlus size={14} aria-hidden="true" />
                    )}
                    {saved ? 'Remove from my schedule' : 'Add to my schedule'}
                  </Button>
                </Actions>
              </Body>
            )}
          </Item>
        );
      })}
    </Wrap>
  );
}
