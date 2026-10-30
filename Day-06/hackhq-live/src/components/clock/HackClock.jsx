import { useStopwatch } from '../../hooks/useStopwatch.js';
import { formatElapsed } from '../../lib/format.js';
import { LapList } from './LapList.jsx';

/**
 * Hackathon Clock component managing start, pause, reset, and lap logging.
 * Complies with requirements CK-1, CK-2, and CK-3.
 *
 * @param {{
 *   laps: Array<{ id: string|number, ms: number }>,
 *   onAddLap: (lap: { id: string|number, ms: number }) => void,
 *   onClearLaps: () => void
 * }} props
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
    <section className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl space-y-6">
      {/* Clock Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-100 tracking-tight">Hackathon Clock</h2>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-mono border ${
                running
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border-white/5'
              }`}
            >
              {running ? 'Running' : elapsed > 0 ? 'Paused' : 'Idle'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Millisecond-precision timer with StrictMode-resilient interval cleanup
          </p>
        </div>
      </div>

      {/* Big Digital Display */}
      <div className="p-8 rounded-2xl bg-slate-950/80 border border-white/5 text-center shadow-inner relative overflow-hidden">
        <div className="text-6xl sm:text-7xl font-mono font-bold tracking-wider text-slate-100 select-none">
          {formatElapsed(elapsed)}
        </div>
        <div className="text-[11px] font-mono text-slate-500 mt-2">
          Interval: 100ms • Functional Updates • StrictMode Safe
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {running ? (
          <button
            type="button"
            onClick={pause}
            className="flex-1 min-w-[120px] py-2.5 px-4 rounded-xl font-semibold text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-lg shadow-amber-500/10"
          >
            Pause ⏸
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            className="flex-1 min-w-[120px] py-2.5 px-4 rounded-xl font-semibold text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-lg shadow-emerald-500/10"
          >
            {elapsed > 0 ? 'Resume ▶' : 'Start Clock ▶'}
          </button>
        )}

        <button
          type="button"
          onClick={handleLap}
          disabled={!running}
          className="py-2.5 px-4 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 border border-white/5 transition-colors"
        >
          Record Lap ⏱
        </button>

        <button
          type="button"
          onClick={reset}
          disabled={elapsed === 0 && !running}
          className="py-2.5 px-4 rounded-xl font-semibold text-sm bg-slate-800/60 hover:bg-rose-950/40 hover:text-rose-300 disabled:opacity-40 disabled:pointer-events-none text-slate-400 border border-white/5 transition-colors"
        >
          Reset ↺
        </button>
      </div>

      {/* Laps Section */}
      <div className="pt-2">
        <LapList laps={laps} onClear={onClearLaps} />
      </div>
    </section>
  );
}

