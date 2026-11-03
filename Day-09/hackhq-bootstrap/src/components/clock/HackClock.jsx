import { Col, Row } from 'react-bootstrap';
import { useStopwatch } from '../../hooks/useStopwatch.js';
import { formatElapsed } from '../../lib/format.js';
import { Badge, Button, Card } from '../ui.jsx';
import { LapList } from './LapList.jsx';

/**
 * Hackathon Clock component managing start, pause, reset, and lap logging.
 * Complies with requirements CK-1, CK-2, and CK-3.
 */
export function HackClock({ laps = [], onAddLap, onClearLaps }) {
  const { elapsed, running, start, pause, reset } = useStopwatch();

  const handleLap = () => {
    if (!running || !onAddLap) return;
    onAddLap({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ms: elapsed,
    });
  };

  return (
    <div className="mx-auto" style={{ maxWidth: '48rem' }}>
      <Card className="d-flex flex-column gap-4 p-3 p-sm-4">
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
          <div>
            <h2 className="fs-4 fw-bold mb-0">Hackathon Clock</h2>
            <p className="mt-1 mb-0 small text-body-secondary">
              Millisecond-precision timer with StrictMode-resilient interval cleanup
            </p>
          </div>
          <Badge tone={running ? 'good' : elapsed > 0 ? 'warn' : 'neutral'}>
            {running ? '● Running' : elapsed > 0 ? '⏸ Paused' : 'Idle'}
          </Badge>
        </div>

        {/* Big Digital Display */}
        <div
          className="rounded-4 px-3 py-5 text-center"
          style={{ background: 'var(--board)', color: 'var(--on-board)' }}
        >
          <div
            className="font-monospace fw-bold text-brand"
            style={{ fontSize: 'clamp(2.75rem, 11vw, 4.5rem)', fontVariantNumeric: 'tabular-nums' }}
          >
            {formatElapsed(elapsed)}
          </div>
          <div className="mt-3 font-monospace small text-uppercase ls-wide opacity-75">
            Interval: 100ms • Functional Updates • StrictMode Safe
          </div>
        </div>

        {/* Action Controls */}
        <Row className="g-3">
          <Col xs={12} sm={6} className="d-grid">
            {running ? (
              <Button variant="dark" size="lg" onClick={pause}>
                Pause ⏸
              </Button>
            ) : (
              <Button variant="primary" size="lg" onClick={start}>
                {elapsed > 0 ? 'Resume ▶' : 'Start Clock ▶'}
              </Button>
            )}
          </Col>

          <Col xs={12} sm={6} className="d-grid">
            <Button variant="secondary" size="lg" onClick={handleLap} disabled={!running}>
              Record Lap ⏱
            </Button>
          </Col>

          <Col xs={12} className="d-grid">
            <Button variant="ghost" size="lg" onClick={reset} disabled={elapsed === 0 && !running}>
              Reset ↺
            </Button>
          </Col>
        </Row>

        {/* Laps List */}
        <LapList laps={laps} onClear={onClearLaps} />
      </Card>
    </div>
  );
}
