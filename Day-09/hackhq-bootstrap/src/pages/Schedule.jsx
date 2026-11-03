import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, ButtonGroup, Col, Form, InputGroup, Row, Tab, Tabs } from 'react-bootstrap';
import { Badge, Button } from '../components/ui.jsx';
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

const DAYS = getDays(SESSIONS);
const BY_DAY = groupByDay(SESSIONS);

const pad = (n) => String(n).padStart(2, '0');
const dayKey = (ms) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * CONCEPT: Preview time - "now" normally follows the real clock, but the event dates are in the
 * past, so a ?at=2026-10-31T10:30 search param (set by the datetime input) replaces it. The pure
 * helpers take `now` as an argument, so the same code serves both.
 */
export default function Schedule({ savedIds, onToggleSaved, onNotify }) {
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
    onToggleSaved(session.id);
    onNotify(
      wasSaved ? `Removed "${session.title}"` : `Added "${session.title}" to your schedule`,
      null,
      wasSaved ? 'info' : 'success'
    );
  };

  const setPreview = (value) => {
    const next = new URLSearchParams(params);
    if (value) next.set('at', value);
    else next.delete('at');
    setParams(next, { replace: true });
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

      <Row className="g-3 align-items-end mb-4">
        <Col xs={12} lg className="overflow-x-auto">
          <ButtonGroup aria-label="Filter by track" className="text-nowrap">
            {['all', ...TRACKS].map((name) => (
              <Button
                key={name}
                variant={track === name ? 'dark' : 'secondary'}
                size="sm"
                aria-pressed={track === name}
                onClick={() => setTrack(name)}
              >
                {name === 'all' ? 'All tracks' : name}
              </Button>
            ))}
          </ButtonGroup>
        </Col>
        <Col xs={12} md={8} lg={6} xl={5}>
          <Form.Label htmlFor="preview-time" className="small text-body-secondary mb-1">
            Preview time (drives Live now and Up next)
          </Form.Label>
          <InputGroup size="sm">
            <Form.Control
              id="preview-time"
              type="datetime-local"
              value={hasPreview ? preview : ''}
              onChange={(event) => setPreview(event.target.value)}
            />
            <Button variant="secondary" disabled={!hasPreview} onClick={() => setPreview('')}>
              Use real time
            </Button>
          </InputGroup>
        </Col>
      </Row>

      {clashes.length > 0 && (
        <Alert variant="warning" role="alert">
          <p className="fw-semibold mb-1">
            {clashes.length === 1 ? 'Two saved sessions overlap' : 'Some saved sessions overlap'}
          </p>
          <ul className="mb-0 ps-3">
            {clashes.map(([a, b]) => (
              <li key={`${a.id}-${b.id}`}>
                {a.title} and {b.title}, {formatDayLabel(a.day)} {formatTimeRange(a)} /{' '}
                {formatTimeRange(b)}
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {/* CONCEPT: Tabs - one pane per day plus a "My schedule" pane; only the active pane is shown */}
      <Tabs
        id="schedule-tabs"
        activeKey={activeTab}
        onSelect={(key) => setActiveTab(key)}
        className="mb-4 flex-nowrap overflow-x-auto overflow-y-hidden text-nowrap"
      >
        {DAYS.map((day) => {
          const sessions = filterByTrack(BY_DAY[day], track);
          return (
            <Tab key={day} eventKey={day} title={formatDayLabel(day)}>
              {sessions.length === 0 ? (
                <Alert variant="secondary" className="text-center">
                  No {track} sessions on this day.
                </Alert>
              ) : (
                <SessionList sessions={sessions} {...listProps} />
              )}
            </Tab>
          );
        })}
        <Tab
          eventKey="mine"
          title={
            <span className="d-inline-flex align-items-center gap-2">
              My schedule
              <Badge tone={saved.length > 0 ? 'accent' : 'neutral'}>{saved.length}</Badge>
            </span>
          }
        >
          {saved.length === 0 ? (
            <Alert variant="secondary" className="text-center">
              Nothing saved yet. Open a session on any day and choose Add to my schedule.
            </Alert>
          ) : (
            DAYS.filter((day) => savedByDay[day]).map((day) => (
              <section key={day} className="mb-4" aria-labelledby={`mine-${day}`}>
                <h2 id={`mine-${day}`} className="fs-5 fw-bold mb-3">
                  {formatDayLabel(day)}
                </h2>
                <SessionList sessions={savedByDay[day]} {...listProps} />
              </section>
            ))
          )}
        </Tab>
      </Tabs>
    </>
  );
}
