import { Card, ListGroup } from 'react-bootstrap';
import { Button } from '../ui.jsx';
import { formatElapsed } from '../../lib/format.js';

/**
 * Renders the recorded stopwatch laps list.
 * Complies with requirement CK-2.
 */
export function LapList({ laps = [], onClear }) {
  if (laps.length === 0) {
    return (
      <div
        className="rounded-4 border border-2 bg-body-tertiary p-4 text-center"
        style={{ borderStyle: 'dashed' }}
      >
        <div className="small text-body-secondary">
          No laps recorded yet. Click &quot;Record Lap&quot; while the clock is running.
        </div>
      </div>
    );
  }

  return (
    <Card className="rounded-4 overflow-hidden">
      <Card.Header className="d-flex align-items-center justify-content-between gap-3 small font-monospace text-uppercase ls-wide text-body-secondary">
        <span>Recorded Laps ({laps.length})</span>
        <Button variant="danger" size="sm" onClick={onClear}>
          Clear Laps ✕
        </Button>
      </Card.Header>

      <ListGroup variant="flush" className="overflow-y-auto" style={{ maxHeight: '16rem' }}>
        {laps.map((lap, idx) => (
          <ListGroup.Item
            key={lap.id || idx}
            className="d-flex align-items-center justify-content-between font-monospace small"
          >
            <span className="text-body-secondary">
              Lap {String(laps.length - idx).padStart(2, '0')}
            </span>
            <span className="fw-bold">{formatElapsed(lap.ms)}</span>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Card>
  );
}
