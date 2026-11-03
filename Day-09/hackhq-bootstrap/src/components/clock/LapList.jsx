import { Button } from '../ui.jsx';
import { formatElapsed } from '../../lib/format.js';

/**
 * Renders the recorded stopwatch laps list.
 * Complies with requirement CK-2.
 */
export function LapList({ laps = [], onClear }) {
  if (laps.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface-2 p-6 text-center">
        <div className="text-sm text-muted">
          No laps recorded yet. Click &quot;Record Lap&quot; while the clock is running.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 font-mono text-xs tracking-wider text-muted uppercase">
        <span>Recorded Laps ({laps.length})</span>
        <Button variant="danger" size="sm" onClick={onClear}>
          Clear Laps ✕
        </Button>
      </div>

      <div className="max-h-64 divide-y divide-line overflow-y-auto">
        {laps.map((lap, idx) => (
          <div
            key={lap.id || idx}
            className="flex items-center justify-between px-4 py-2.5 font-mono text-sm"
          >
            <span className="text-muted">Lap {String(laps.length - idx).padStart(2, '0')}</span>
            <span className="font-bold tabular-nums text-ink">{formatElapsed(lap.ms)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
