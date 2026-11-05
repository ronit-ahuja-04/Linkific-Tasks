import styled, { css } from 'styled-components';
import { HACKATHON_TRACKS } from '../../lib/validation.js';
import { Shield, MapPin } from 'lucide-react';

const mono = css`
  font-family: ${({ theme }) => theme.fonts.mono};
  text-transform: uppercase;
  letter-spacing: 0.18em;
  opacity: 0.75;
`;
const Badge = styled.div`
  position: relative;
  margin: 0 auto;
  width: 100%;
  max-width: 24rem;
  overflow: hidden;
  border-radius: 1rem;
  box-shadow: 0 0.5rem 1rem rgb(0 0 0 / 0.15);
  background: ${({ theme }) => theme.colors.board};
  color: ${({ theme }) => theme.colors.onBoard};
  opacity: ${({ $active }) => ($active ? 1 : 0.75)};
`;
const Lanyard = styled.div`
  display: flex;
  justify-content: center;
  padding-top: 0.75rem;
`;
const Slit = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 0.75rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.line};
  > div {
    width: 2rem;
    height: 0.25rem;
    border-radius: 999px;
    background: ${({ theme }) => theme.colors.board};
  }
`;
const TrackBar = styled.div`
  margin-top: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 1.5rem;
  color: #0b0b0f;
  background-color: ${({ $color }) => $color};
  span {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  span:first-child {
    font-weight: 600;
  }
  span:last-child {
    font-weight: 500;
    opacity: 0.75;
  }
`;
const Body = styled.div`
  padding: 1.5rem;
`;
const MonoLabel = styled.span`
  ${mono} font-size: 0.875rem;
`;
const TeamName = styled.h2`
  margin: 0.25rem 0 0;
  font-size: calc(1.325rem + 0.9vw);
  font-weight: 700;
  line-height: 1.25;
  overflow-wrap: anywhere;
  ${({ theme }) => theme.media.up('xl')} {
    font-size: 2rem;
  }
`;
const City = styled.div`
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  opacity: 0.75;
  svg {
    color: ${({ theme }) => theme.colors.brand};
  }
`;
const Roster = styled.div`
  margin-top: 1.5rem;
  padding-top: 0.75rem;
  border-top: 1px dashed ${({ theme }) => theme.colors.muted};
`;
const Members = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;
const Member = styled.li`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.875rem;
  > span:first-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
  }
`;
const Role = styled(MonoLabel)`
  flex-shrink: 0;
  font-size: 0.65rem;
`;
const Tags = styled.div`
  margin-top: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;
const Tag = styled.span`
  border: 1px solid ${({ theme }) => theme.colors.muted};
  border-radius: 999px;
  padding: 0.25rem 0.5rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.65rem;
  color: ${({ theme }) => theme.colors.brand};
`;
const Foot = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.muted};
`;
const Official = styled.div`
  ${mono} display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.6rem;
`;
const Serial = styled.span`
  ${mono} letter-spacing: normal;
  text-transform: none;
  font-size: 0.6rem;
`;

export default function TeamBadgePreview({ form }) {
  const currentTrack = HACKATHON_TRACKS.find((t) => t.id === form.track) || HACKATHON_TRACKS[0];

  const hasContent =
    form.teamName.trim().length > 0 || form.members.some((m) => m.name.trim().length > 0);

  return (
    <Badge $active={hasContent} aria-label="Live Team Lanyard Badge Preview">
      <Lanyard aria-hidden="true">
        <Slit>
          <div />
        </Slit>
      </Lanyard>

      <TrackBar $color={currentTrack.color}>
        <span>{currentTrack.name}</span>
        <span>HackHQ 2026</span>
      </TrackBar>

      <Body>
        <div>
          <MonoLabel>HACKATHON TEAM</MonoLabel>
          <TeamName>{form.teamName.trim() || 'Your Team Name'}</TeamName>
        </div>

        {form.contact?.city && (
          <City>
            <MapPin size={13} aria-hidden="true" />
            <span>{form.contact.city}</span>
          </City>
        )}

        <Roster>
          <div style={{ marginBottom: '0.5rem' }}>
            <MonoLabel>ROSTER ({form.members.length}/4)</MonoLabel>
          </div>
          <Members>
            {form.members.map((member, idx) => (
              <Member key={member.id || idx}>
                <span>{member.name.trim() || `Member ${idx + 1}`}</span>
                <Role>{member.role}</Role>
              </Member>
            ))}
          </Members>
        </Roster>

        {form.interests && form.interests.length > 0 && (
          <Tags>
            {form.interests.slice(0, 3).map((tag) => (
              <Tag key={tag}>#{tag.replace(/\s+/g, '')}</Tag>
            ))}
          </Tags>
        )}
      </Body>

      <Foot>
        <Official>
          <Shield size={12} aria-hidden="true" />
          <span>OFFICIAL PARTICIPANT BADGE</span>
        </Official>
        <Serial aria-hidden="true">HHQ-{Math.abs(form.teamName.length * 1337)}</Serial>
      </Foot>
    </Badge>
  );
}
