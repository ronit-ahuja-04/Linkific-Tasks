import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import {
  Award,
  CalendarDays,
  CheckCircle2,
  Clock,
  Globe,
  Heart,
  Lock,
  Megaphone,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import PageHeader from '../components/layout/PageHeader.jsx';
import { Badge, Button, Card, Grid, Muted, SectionTitle, Stack } from '../components/ui.jsx';
import { BADGES } from '../lib/badges.js';
import { formatPostDate } from '../lib/announcements.js';
import { badgesReset, selectEarnedBadges } from '../store/slices/badgesSlice.js';
import { activityCleared, selectActivity } from '../store/slices/activitySlice.js';

const ICONS = {
  heart: Heart,
  bag: ShoppingBag,
  check: CheckCircle2,
  calendar: CalendarDays,
  clock: Clock,
  globe: Globe,
  megaphone: Megaphone,
  lock: Lock,
};

const BadgeCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  height: 100%;
  opacity: ${({ $earned }) => ($earned ? 1 : 0.6)};
  border-color: ${({ theme, $earned }) => ($earned ? theme.colors.brand : theme.colors.line)};
  h3 {
    margin: 0;
    font-size: 1rem;
  }
  p {
    margin: 0;
  }
`;
const IconBox = styled.span`
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background: ${({ theme, $earned }) => ($earned ? theme.colors.brand : theme.colors.surface2)};
  color: ${({ theme, $earned }) => ($earned ? theme.colors.onBrand : theme.colors.muted)};
`;
const Feed = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 26rem;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.board};
  color: ${({ theme }) => theme.colors.onBoard};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.8125rem;
`;
const Entry = styled.li`
  display: grid;
  grid-template-columns: 5.5rem minmax(0, 1fr);
  gap: 0.75rem;
  padding: 0.5rem 0.875rem;
  border-bottom: 1px solid rgb(255 255 255 / 0.08);
  &:last-child {
    border-bottom: 0;
  }
  time {
    opacity: 0.6;
  }
  strong {
    color: ${({ theme }) => theme.colors.brand};
    font-weight: 600;
  }
  span {
    opacity: 0.7;
    overflow-wrap: anywhere;
  }
`;
const FeedEmpty = styled.p`
  margin: 0;
  padding: 1.5rem;
  text-align: center;
  opacity: 0.7;
`;

const clock = (at) =>
  new Date(at).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

export default function Activity() {
  // REDUX: badges come from a slice that only the listener middleware writes to; the feed is
  // written by the activityLogger middleware. This page only reads and offers two resets.
  const earned = useSelector(selectEarnedBadges);
  const activity = useSelector(selectActivity);
  const dispatch = useDispatch();
  const earnedCount = BADGES.filter((b) => earned[b.id]).length;

  return (
    <>
      <PageHeader
        breadcrumb="Activity"
        title="Badges and activity"
        pill={`${earnedCount}/${BADGES.length} badges`}
      >
        Badges are awarded automatically by listener middleware. The feed shows every action your
        clicks dispatch to the store, the same stream you see in Redux DevTools.
      </PageHeader>

      <Stack $gap={8}>
        <section aria-labelledby="badges-title">
          <SectionTitle eyebrow="Listener middleware" title="Badges">
            <Button $variant="ghost" $size="sm" onClick={() => dispatch(badgesReset())}>
              Reset badges
            </Button>
          </SectionTitle>
          <span id="badges-title" className="visually-hidden">
            Badges
          </span>
          <Grid
            as="ul"
            $cols={{ base: 1, sm: 2, lg: 4 }}
            $gap={3}
            style={{ listStyle: 'none', padding: 0, margin: 0 }}
          >
            {BADGES.map((badge) => {
              const Icon = ICONS[badge.icon] ?? Award;
              const at = earned[badge.id];
              return (
                <li key={badge.id}>
                  <BadgeCard $earned={Boolean(at)}>
                    <IconBox $earned={Boolean(at)}>
                      <Icon size={20} aria-hidden="true" />
                    </IconBox>
                    <h3>{badge.name}</h3>
                    <Muted as="p">{badge.description}</Muted>
                    {at ? (
                      <Badge $tone="good">Earned {formatPostDate(at)}</Badge>
                    ) : (
                      <Badge $tone="neutral">Locked</Badge>
                    )}
                  </BadgeCard>
                </li>
              );
            })}
          </Grid>
        </section>

        <section aria-labelledby="feed-title">
          <SectionTitle eyebrow="Custom middleware" title="Live action feed">
            <Button $variant="ghost" $size="sm" onClick={() => dispatch(activityCleared())}>
              <Trash2 size={15} aria-hidden="true" />
              Clear feed
            </Button>
          </SectionTitle>
          <span id="feed-title" className="visually-hidden">
            Live action feed
          </span>
          {activity.length === 0 ? (
            <Feed as="div">
              <FeedEmpty>
                Nothing yet. Add a swag item or tick a task and watch this fill up.
              </FeedEmpty>
            </Feed>
          ) : (
            <Feed aria-live="polite">
              {activity.map((entry) => (
                <Entry key={entry.id}>
                  <time dateTime={new Date(entry.at).toISOString()}>{clock(entry.at)}</time>
                  <div>
                    <strong>{entry.type}</strong> {entry.preview && <span>{entry.preview}</span>}
                  </div>
                </Entry>
              ))}
            </Feed>
          )}
        </section>
      </Stack>
    </>
  );
}
