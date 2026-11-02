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
    <div className="mx-auto max-w-3xl">
      <Card className="flex flex-col gap-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Hackathon Clock</h2>
            <p className="mt-1 text-sm text-muted">
              Millisecond-precision timer with StrictMode-resilient interval cleanup
            </p>
          </div>
          <Badge tone={running ? 'good' : elapsed > 0 ? 'warn' : 'neutral'}>
            {running ? '● Running' : elapsed > 0 ? '⏸ Paused' : 'Idle'}
          </Badge>
        </div>

        {/* Big Digital Display */}
        <div className="rounded-2xl bg-board px-4 py-8 text-center text-on-board sm:py-10">
          <div className="font-mono text-5xl font-bold tracking-tight text-brand tabular-nums sm:text-7xl">
            {formatElapsed(elapsed)}
          </div>
          <div className="mt-3 font-mono text-[0.68rem] tracking-wider text-on-board/60 uppercase">
            Interval: 100ms • Functional Updates • StrictMode Safe
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid gap-3 sm:grid-cols-3">
          {running ? (
            <Button variant="dark" size="lg" onClick={pause}>
              Pause ⏸
            </Button>
          ) : (
            <Button variant="primary" size="lg" onClick={start}>
              {elapsed > 0 ? 'Resume ▶' : 'Start Clock ▶'}
            </Button>
          )}

          <Button variant="secondary" size="lg" onClick={handleLap} disabled={!running}>
            Record Lap ⏱
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onClick={reset}
            disabled={elapsed === 0 && !running}
            className="sm:col-span-3"
          >
            Reset ↺
          </Button>
        </div>

        {/* Laps List */}
        <LapList laps={laps} onClear={onClearLaps} />
      </Card>
    </div>
  );
}
