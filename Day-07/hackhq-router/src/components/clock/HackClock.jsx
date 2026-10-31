import { useStopwatch } from '../../hooks/useStopwatch.js';
import { formatElapsed } from '../../lib/format.js';
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
    <div className="clock-station-container">
      <div className="live-card">
        <div className="live-card-header">
          <div className="live-card-title-group">
            <h2>Hackathon Clock</h2>
            <p className="live-card-subtitle">
              Millisecond-precision timer with StrictMode-resilient interval cleanup
            </p>
          </div>
          <span
            className="live-badge-pill"
            style={{
              color: running
                ? 'var(--color-mint)'
                : elapsed > 0
                  ? 'var(--color-tape)'
                  : 'var(--color-ink-muted)',
              borderColor: running ? 'var(--color-mint)' : 'var(--color-rule)',
            }}
          >
            {running ? '● Running' : elapsed > 0 ? '⏸ Paused' : 'Idle'}
          </span>
        </div>

        {/* Big Digital Display */}
        <div className="clock-display-card">
          <div className="clock-digits-text">{formatElapsed(elapsed)}</div>
          <div className="clock-meta-text">
            Interval: 100ms • Functional Updates • StrictMode Safe
          </div>
        </div>

        {/* Action Controls */}
        <div className="clock-actions-row">
          {running ? (
            <button type="button" onClick={pause} className="btn-clock-primary btn-clock-pause">
              Pause ⏸
            </button>
          ) : (
            <button type="button" onClick={start} className="btn-clock-primary btn-clock-start">
              {elapsed > 0 ? 'Resume ▶' : 'Start Clock ▶'}
            </button>
          )}

          <button type="button" onClick={handleLap} disabled={!running} className="btn-clock-lap">
            Record Lap ⏱
          </button>

          <button
            type="button"
            onClick={reset}
            disabled={elapsed === 0 && !running}
            className="btn-clock-reset"
          >
            Reset ↺
          </button>
        </div>

        {/* Laps List */}
        <LapList laps={laps} onClear={onClearLaps} />
      </div>
    </div>
  );
}
