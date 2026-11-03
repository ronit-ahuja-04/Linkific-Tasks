import { Accordion } from 'react-bootstrap';
import { CalendarCheck, CalendarPlus, MapPin, User } from 'lucide-react';
import { Badge, Button, PulseDot } from '../ui.jsx';
import { TRACK_TONES, formatTimeRange } from '../../lib/schedule.js';

/**
 * CONCEPT: Accordion - one collapsible item per session. The header keeps the scannable facts
 * (time, title, badges); the body holds the details and the save button, so the header stays a
 * single button and never nests another one.
 */
export default function SessionList({
  sessions,
  savedIds,
  clashingIds,
  nowIds,
  nextIds,
  onToggleSaved,
}) {
  return (
    <Accordion>
      {sessions.map((session) => {
        const saved = savedIds.includes(session.id);

        return (
          <Accordion.Item key={session.id} eventKey={session.id}>
            <Accordion.Header>
              <span className="d-flex flex-column flex-md-row align-items-md-center gap-1 gap-md-3 w-100 me-3">
                <span className="font-monospace small text-body-secondary text-nowrap">
                  {formatTimeRange(session)}
                </span>
                <span className="fw-semibold flex-grow-1">{session.title}</span>
                <span className="d-flex flex-wrap align-items-center gap-2">
                  {nowIds.has(session.id) && (
                    <Badge tone="good">
                      <PulseDot />
                      Live now
                    </Badge>
                  )}
                  {nextIds.has(session.id) && <Badge tone="accent">Up next</Badge>}
                  {saved && clashingIds.has(session.id) && <Badge tone="warn">Clash</Badge>}
                  {saved && <Badge tone="neutral">Saved</Badge>}
                  <Badge tone={TRACK_TONES[session.track]}>{session.track}</Badge>
                </span>
              </span>
            </Accordion.Header>
            <Accordion.Body>
              <p className="text-body-secondary">{session.description}</p>
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                <ul className="list-unstyled d-flex flex-wrap column-gap-4 row-gap-1 small mb-0">
                  <li className="d-flex align-items-center gap-2">
                    <User size={14} aria-hidden="true" />
                    <span className="visually-hidden">Speaker: </span>
                    {session.speaker}
                  </li>
                  <li className="d-flex align-items-center gap-2">
                    <MapPin size={14} aria-hidden="true" />
                    <span className="visually-hidden">Room: </span>
                    {session.room}
                  </li>
                </ul>
                <Button
                  variant={saved ? 'secondary' : 'primary'}
                  size="sm"
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
              </div>
            </Accordion.Body>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
}
