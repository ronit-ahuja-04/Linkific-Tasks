import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { Alert, Badge, Button, Input, Label } from '../components/ui.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import SessionList from '../components/schedule/SessionList.jsx';
import { SESSIONS } from '../data/schedule.js';
import {
  TRACKS,
  filterByTrack,
  findClashes,
  findClashingIds,
  formatDayLabel,
  formatTimeRange,
  getDays,
  getNowAndNext,
  getSavedSessions,
  groupByDay,
} from '../lib/schedule.js';
import { selectSavedIds, sessionToggled } from '../store/slices/scheduleSlice.js';
import { notify } from '../store/slices/toastsSlice.js';

const DAYS = getDays(SESSIONS);
const BY_DAY = groupByDay(SESSIONS);

const pad = (n) => String(n).padStart(2, '0');
const dayKey = (ms) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const Toolbar = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(3)};
  margin-bottom: ${({ theme }) => theme.space(4)};
  ${({ theme }) => theme.media.up('lg')} {
    flex-direction: row;
    align-items: flex-end;
  }
`;
const FilterSlot = styled.div`
  min-width: 0;
  overflow-x: auto;
  ${({ theme }) => theme.media.up('lg')} {
    flex: 1 1 0;
  }
`;
const Segmented = styled.div`
  display: inline-flex;
  white-space: nowrap;
  & > button {
    border-radius: 0;
  }
  & > button + button {
    margin-left: -1px;
  }
  & > button:first-child {
    border-radius: ${({ theme }) => theme.radii.md} 0 0 ${({ theme }) => theme.radii.md};
  }
  & > button:last-child {
    border-radius: 0 ${({ theme }) => theme.radii.md} ${({ theme }) => theme.radii.md} 0;
  }
`;
const PreviewSlot = styled.div`
  ${({ theme }) => theme.media.up('md')} {
    flex: 0 0 66.667%;
  }
  ${({ theme }) => theme.media.up('lg')} {
    flex: 0 0 50%;
  }
  ${({ theme }) => theme.media.up('xl')} {
    flex: 0 0 41.667%;
  }
`;
const SmallLabel = styled(Label)`
  display: block;
  font-size: 0.875rem;
  font-weight: 400;
  color: ${({ theme }) => theme.colors.muted};
  margin-bottom: 0.25rem;
`;
const InputRow = styled.div`
  display: flex;
  & > button {
    border-radius: 0 ${({ theme }) => theme.radii.md} ${({ theme }) => theme.radii.md} 0;
    margin-left: -1px;
  }
`;
const PreviewInput = styled(Input)`
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  border-radius: ${({ theme }) => theme.radii.md} 0 0 ${({ theme }) => theme.radii.md};
`;
const ClashTitle = styled.p`
  margin: 0 0 0.25rem;
  font-weight: 600;
`;
const ClashList = styled.ul`
  margin: 0;
  padding-left: 1rem;
`;
const EmptyAlert = styled(Alert)`
  text-align: center;
`;
const TabList = styled.div`
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  margin-bottom: ${({ theme }) => theme.space(4)};
  border-bottom: 1px solid ${({ theme }) => theme.colors.line};
`;
const TabButton = styled.button`
  flex: 0 0 auto;
  padding: 0.5rem 1rem;
  margin-bottom: -1px;
  background: transparent;
  cursor: pointer;
  font-weight: ${({ $active }) => ($active ? 600 : 500)};
  color: ${({ theme, $active }) => ($active ? theme.colors.ink : theme.colors.muted)};
  border: 1px solid transparent;
  border-bottom-color: ${({ theme, $active }) => ($active ? theme.colors.accent : 'transparent')};
  border-bottom-width: 2px;
  transition:
    color 0.15s,
    border-color 0.15s;
  &:hover {
    color: ${({ theme }) => theme.colors.ink};
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: -2px;
  }
`;
const TabInner = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
`;
const DaySection = styled.section`
  margin-bottom: ${({ theme }) => theme.space(4)};
`;
const DayTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 ${({ theme }) => theme.space(3)};
`;

/**
 * CONCEPT: Preview time - "now" normally follows the real clock, but the event dates are in the
 * past, so a ?at=2026-10-31T10:30 search param (set by the datetime input) replaces it. The pure
 * helpers take `now` as an argument, so the same code serves both.
 */
export default function Schedule() {
  // REDUX: saved sessions live in scheduleSlice; notifications go through the notify thunk
  const dispatch = useDispatch();
  const savedIds = useSelector(selectSavedIds);
  const [params, setParams] = useSearchParams();
  const preview = params.get('at');
  const previewMs = preview ? new Date(preview).getTime() : NaN;
  const hasPreview = Number.isFinite(previewMs);

  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setClock(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);
  const now = hasPreview ? previewMs : clock;

  const [track, setTrack] = useState('all');
  const [activeTab, setActiveTab] = useState(() => {
    const today = dayKey(Date.now());
    return DAYS.includes(today) ? today : DAYS[0];
  });

  const { now: liveSessions, next: nextSessions } = getNowAndNext(SESSIONS, now);
  const nowIds = new Set(liveSessions.map((session) => session.id));
  const nextIds = new Set(nextSessions.map((session) => session.id));

  const saved = getSavedSessions(SESSIONS, savedIds);
  const clashes = findClashes(saved);
  const clashingIds = findClashingIds(saved);
  const savedByDay = groupByDay(saved);

  const handleToggle = (session) => {
    const wasSaved = savedIds.includes(session.id);
    dispatch(sessionToggled(session.id));
    dispatch(
      notify(
        wasSaved ? `Removed "${session.title}"` : `Added "${session.title}" to your schedule`,
        null,
        wasSaved ? 'info' : 'success'
      )
    );
  };

  const setPreview = (value) => {
    const next = new URLSearchParams(params);
    if (value) next.set('at', value);
    else next.delete('at');
    setParams(next, { replace: true });
  };

  // CONCEPT: Keyboard support - arrow keys move between tabs; Home and End jump to
  // the first and last tab, as the WAI-ARIA tabs pattern recommends.
  const tabKeys = [...DAYS, 'mine'];
  const handleTabsKeyDown = (event) => {
    if (event.target.getAttribute('role') !== 'tab') return;
    const index = tabKeys.indexOf(activeTab);
    let key = null;
    if (event.key === 'Home') key = tabKeys[0];
    else if (event.key === 'End') key = tabKeys[tabKeys.length - 1];
    else if (event.key === 'ArrowRight') key = tabKeys[(index + 1) % tabKeys.length];
    else if (event.key === 'ArrowLeft')
      key = tabKeys[(index - 1 + tabKeys.length) % tabKeys.length];
    if (!key) return;

    event.preventDefault();
    setActiveTab(key);
    requestAnimationFrame(() => document.getElementById(`schedule-tabs-tab-${key}`)?.focus());
  };

  const listProps = { savedIds, clashingIds, nowIds, nextIds, onToggleSaved: handleToggle };

  return (
    <>
      <PageHeader
        breadcrumb="Schedule"
        title="Schedule"
        pill={liveSessions.length > 0 ? `${liveSessions.length} live now` : `${DAYS.length} days`}
      >
        Three days of keynotes, workshops, talks and meals. Save sessions to build your own plan.
      </PageHeader>

      <Toolbar>
        <FilterSlot>
          <Segmented role="group" aria-label="Filter by track">
            {['all', ...TRACKS].map((name) => (
              <Button
                key={name}
                $variant={track === name ? 'dark' : 'secondary'}
                $size="sm"
                aria-pressed={track === name}
                onClick={() => setTrack(name)}
              >
                {name === 'all' ? 'All tracks' : name}
              </Button>
            ))}
          </Segmented>
        </FilterSlot>
        <PreviewSlot>
          <SmallLabel htmlFor="preview-time">Preview time (drives Live now and Up next)</SmallLabel>
          <InputRow>
            <PreviewInput
              id="preview-time"
              type="datetime-local"
              value={hasPreview ? preview : ''}
              onChange={(event) => setPreview(event.target.value)}
            />
            <Button
              $variant="secondary"
              $size="sm"
              disabled={!hasPreview}
              onClick={() => setPreview('')}
            >
              Use real time
            </Button>
          </InputRow>
        </PreviewSlot>
      </Toolbar>

      {clashes.length > 0 && (
        <Alert $tone="warn" role="alert" style={{ marginBottom: '1rem' }}>
          <ClashTitle>
            {clashes.length === 1 ? 'Two saved sessions overlap' : 'Some saved sessions overlap'}
          </ClashTitle>
          <ClashList>
            {clashes.map(([a, b]) => (
              <li key={`${a.id}-${b.id}`}>
                {a.title} and {b.title}, {formatDayLabel(a.day)} {formatTimeRange(a)} /{' '}
                {formatTimeRange(b)}
              </li>
            ))}
          </ClashList>
        </Alert>
      )}

      {/* CONCEPT: Tabs - one pane per day plus a "My schedule" pane; only the active pane is shown */}
      <div onKeyDown={handleTabsKeyDown}>
        <TabList role="tablist" aria-label="Schedule days">
          {tabKeys.map((key) => {
            const selected = key === activeTab;
            return (
              <TabButton
                key={key}
                type="button"
                role="tab"
                id={`schedule-tabs-tab-${key}`}
                aria-selected={selected}
                aria-controls={`schedule-tabs-tabpane-${key}`}
                tabIndex={selected ? 0 : -1}
                $active={selected}
                onClick={() => setActiveTab(key)}
              >
                {key === 'mine' ? (
                  <TabInner>
                    My schedule
                    <Badge $tone={saved.length > 0 ? 'accent' : 'neutral'}>{saved.length}</Badge>
                  </TabInner>
                ) : (
                  formatDayLabel(key)
                )}
              </TabButton>
            );
          })}
        </TabList>

        <div
          role="tabpanel"
          id={`schedule-tabs-tabpane-${activeTab}`}
          aria-labelledby={`schedule-tabs-tab-${activeTab}`}
        >
          {activeTab === 'mine' ? (
            saved.length === 0 ? (
              <EmptyAlert $tone="neutral">
                Nothing saved yet. Open a session on any day and choose Add to my schedule.
              </EmptyAlert>
            ) : (
              DAYS.filter((day) => savedByDay[day]).map((day) => (
                <DaySection key={day} aria-labelledby={`mine-${day}`}>
                  <DayTitle id={`mine-${day}`}>{formatDayLabel(day)}</DayTitle>
                  <SessionList sessions={savedByDay[day]} {...listProps} />
                </DaySection>
              ))
            )
          ) : (
            (() => {
              const sessions = filterByTrack(BY_DAY[activeTab] ?? [], track);
              return sessions.length === 0 ? (
                <EmptyAlert $tone="neutral">No {track} sessions on this day.</EmptyAlert>
              ) : (
                <SessionList sessions={sessions} {...listProps} />
              );
            })()
          )}
        </div>
      </div>
    </>
  );
}
