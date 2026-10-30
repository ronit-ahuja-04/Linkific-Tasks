import { formatElapsed } from '../../lib/format.js';

/**
 * Renders the recorded stopwatch laps list with split metrics.
 * Complies with requirement CK-2.
 *
 * @param {{
 *   laps: Array<{ id: string|number, ms: number }>,
 *   onClear: () => void
 * }} props
 */
export function LapList({ laps = [], onClear }) {
  if (laps.length === 0) {
    return (
      <div className="p-6 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/20 text-slate-500 text-xs">
        No laps recorded yet. Click &quot;Record Lap&quot; while the clock is running.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-2 border-b border-white/5">
        <span>Recorded Laps ({laps.length})</span>
        <button
          type="button"
          onClick={onClear}
          className="text-rose-400 hover:text-rose-300 transition-colors"
        >
          Clear Laps ✕
        </button>
      </div>

      <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
        {laps.map((lap, idx) => (
          <div
            key={lap.id || idx}
            className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-white/5 font-mono text-xs"
          >
            <span className="text-slate-400">Lap {String(laps.length - idx).padStart(2, '0')}</span>
            <span className="font-semibold text-cyan-300">{formatElapsed(lap.ms)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

