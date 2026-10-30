import { formatElapsed } from '../../lib/format.js';

/**
 * Renders the recorded stopwatch laps list.
 * Complies with requirement CK-2.
 */
export function LapList({ laps = [], onClear }) {
  if (laps.length === 0) {
    return (
      <div className="live-empty-box" style={{ padding: '24px' }}>
        <div className="live-empty-desc">
          No laps recorded yet. Click &quot;Record Lap&quot; while the clock is running.
        </div>
      </div>
    );
  }

  return (
    <div className="laps-panel">
      <div className="laps-header-row">
        <span>Recorded Laps ({laps.length})</span>
        <button
          type="button"
          onClick={onClear}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-signal)',
            cursor: 'pointer',
          }}
        >
          Clear Laps ✕
        </button>
      </div>

      <div className="laps-scroll-list">
        {laps.map((lap, idx) => (
          <div key={lap.id || idx} className="lap-list-item">
            <span style={{ color: 'var(--color-ink-muted)' }}>
              Lap {String(laps.length - idx).padStart(2, '0')}
            </span>
            <span style={{ fontWeight: 700, color: 'var(--color-lanyard)' }}>
              {formatElapsed(lap.ms)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
