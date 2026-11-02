import { useState, useEffect } from 'react';
import { Badge, Button, Card } from '../ui.jsx';

const STATUS = 'font-mono text-xs text-muted [&_strong]:text-ink';
const DEMO_CARD =
  'flex flex-col justify-between rounded-2xl border border-line bg-surface-2/50 p-5 transition hover:border-accent/40 hover:bg-surface-2';

/**
 * Child component for EP-1 to demonstrate mount and unmount lifecycles.
 */
function MountLoggerChild() {
  const [log, setLog] = useState('Mounted');

  useEffect(() => {
    // CONCEPT: EP-1 - Run once effect ([])
    console.log(
      '[EP-1] MountLoggerChild mounted (runs once). In StrictMode, runs mount -> cleanup -> mount.'
    );
    setLog('Active (Mount effect ran)');

    return () => {
      console.log('[EP-1] MountLoggerChild unmounted (cleanup ran).');
    };
  }, []);

  return (
    <div className={STATUS}>
      Status: <strong>{log}</strong>
    </div>
  );
}

/**
 * 9-Pattern Effect Reference Panel.
 * Demonstrates all primary useEffect lifecycle signatures and cleanup mechanics.
 * Complies with requirements EP-1 through EP-9.
 */
export function EffectPatterns() {
  // EP-1 state: toggle child to demonstrate mount/cleanup cycles
  const [ep1Mounted, setEp1Mounted] = useState(true);

  // EP-2 state: counter driving document.title
  const [ep2Count, setEp2Count] = useState(0);
  useEffect(() => {
    // CONCEPT: EP-2 - Specific dependencies ([ep2Count])
    document.title = `HackHQ Live: Count ${ep2Count}`;
  }, [ep2Count]);

  // EP-3 state: render trigger counter (logs every render, no setState inside)
  const [ep3Ticks, setEp3Ticks] = useState(0);
  useEffect(() => {
    // CONCEPT: EP-3 - Every render effect (no dependency array)
    console.log(`[EP-3] Effect executed after render pass. Ticks: ${ep3Ticks}`);
  });

  // EP-4 state: multiple effects for independent concerns
  const [ep4User, setEp4User] = useState('Admin');
  const [ep4Activity, setEp4Activity] = useState(0);
  useEffect(() => {
    console.log(`[EP-4] Concern A: User switched to ${ep4User}`);
  }, [ep4User]);
  useEffect(() => {
    console.log(`[EP-4] Concern B: Activity updated to ${ep4Activity}`);
  }, [ep4Activity]);

  return (
    <Card className="flex flex-col gap-6 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">useEffect Lifecycle Patterns</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Interactive catalog showcasing dependency array variations, cleanup triggers, and
            anti-pattern protections.
          </p>
        </div>
        <Badge tone="accent">9 Core Patterns</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {/* EP-1: Run once ([]) */}
        <div className={DEMO_CARD}>
          <div>
            <div className="flex items-center justify-between gap-2">
              <Badge tone="brand">EP-1</Badge>
              <span className="font-mono text-[0.68rem] text-muted">deps: []</span>
            </div>
            <div className="mt-4">
              <h3 className="font-display text-base font-semibold">Run Once on Mount</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Executes once after paint and tears down on unmount. React StrictMode simulates this
                cycle twice in dev.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4">
            {ep1Mounted ? (
              <MountLoggerChild />
            ) : (
              <div className={STATUS + ' opacity-60'}>Child unmounted</div>
            )}
            <Button variant="secondary" size="sm" onClick={() => setEp1Mounted((prev) => !prev)}>
              {ep1Mounted ? 'Unmount Child' : 'Mount Child'}
            </Button>
          </div>
        </div>

        {/* EP-2: Specific dependencies */}
        <div className={DEMO_CARD}>
          <div>
            <div className="flex items-center justify-between gap-2">
              <Badge tone="brand">EP-2</Badge>
              <span className="font-mono text-[0.68rem] text-muted">deps: [ep2Count]</span>
            </div>
            <div className="mt-4">
              <h3 className="font-display text-base font-semibold">Specific Dependencies</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Executes only when dependent values change. Here, document.title updates when count
                increments.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4">
            <div className={STATUS}>
              Current Count: <strong>{ep2Count}</strong>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setEp2Count((c) => c + 1)}>
              Increment Count (+1)
            </Button>
          </div>
        </div>

        {/* EP-3: Every render */}
        <div className={DEMO_CARD}>
          <div>
            <div className="flex items-center justify-between gap-2">
              <Badge tone="warn">EP-3</Badge>
              <span className="font-mono text-[0.68rem] text-muted">deps: none</span>
            </div>
            <div className="mt-4">
              <h3 className="font-display text-base font-semibold">Every Render Pass</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Runs after every paint for diagnostics. Calling setState inside this effect would
                cause an infinite loop!
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4">
            <div className={STATUS}>
              Render passes: <strong>{ep3Ticks}</strong>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setEp3Ticks((t) => t + 1)}>
              Trigger Re-render
            </Button>
          </div>
        </div>

        {/* EP-4: Multiple effects */}
        <div className={DEMO_CARD}>
          <div>
            <div className="flex items-center justify-between gap-2">
              <Badge tone="brand">EP-4</Badge>
              <span className="font-mono text-[0.68rem] text-muted">Multiple effects</span>
            </div>
            <div className="mt-4">
              <h3 className="font-display text-base font-semibold">Multiple Separate Effects</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Separates independent concerns into distinct effects rather than conflating them
                into a single monolithic callback.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEp4User((u) => (u === 'Admin' ? 'Lead' : 'Admin'))}
              >
                User: {ep4User}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setEp4Activity((a) => a + 1)}>
                Act: {ep4Activity}
              </Button>
            </div>
          </div>
        </div>

        {/* EP-5: Cleanup abort fetch */}
        <div className={DEMO_CARD}>
          <div>
            <div className="flex items-center justify-between gap-2">
              <Badge tone="good">EP-5</Badge>
              <span className="font-mono text-[0.68rem] text-muted">Cleanup: Abort</span>
            </div>
            <div className="mt-4">
              <h3 className="font-display text-base font-semibold">Abort HTTP Requests</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Invokes AbortController.abort() to cancel in-flight HTTP requests and eliminate race
                conditions.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4">
            <div className={STATUS + ' !text-good'}>Verified by: useFetch.js</div>
          </div>
        </div>

        {/* EP-6: Cleanup timeout */}
        <div className={DEMO_CARD}>
          <div>
            <div className="flex items-center justify-between gap-2">
              <Badge tone="good">EP-6</Badge>
              <span className="font-mono text-[0.68rem] text-muted">Cleanup: Timeout</span>
            </div>
            <div className="mt-4">
              <h3 className="font-display text-base font-semibold">Clear Timeout</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Calls clearTimeout on every new input stroke, buffering rapid typing events.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4">
            <div className={STATUS + ' !text-good'}>Verified by: useDebounce.js</div>
          </div>
        </div>

        {/* EP-7: Cleanup interval */}
        <div className={DEMO_CARD}>
          <div>
            <div className="flex items-center justify-between gap-2">
              <Badge tone="good">EP-7</Badge>
              <span className="font-mono text-[0.68rem] text-muted">Cleanup: Interval</span>
            </div>
            <div className="mt-4">
              <h3 className="font-display text-base font-semibold">Clear Interval</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Calls clearInterval on pause or unmount, preventing timer duplication under
                StrictMode.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4">
            <div className={STATUS + ' !text-good'}>Verified by: useStopwatch.js</div>
          </div>
        </div>

        {/* EP-8: Cleanup listener */}
        <div className={DEMO_CARD}>
          <div>
            <div className="flex items-center justify-between gap-2">
              <Badge tone="good">EP-8</Badge>
              <span className="font-mono text-[0.68rem] text-muted">Cleanup: Listener</span>
            </div>
            <div className="mt-4">
              <h3 className="font-display text-base font-semibold">Remove Event Listener</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Unregisters global event listeners with identical function references to eliminate
                memory leaks.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4">
            <div className={STATUS + ' !text-good'}>Verified by: useWindowSize.js</div>
          </div>
        </div>

        {/* EP-9: Sync external system */}
        <div className={DEMO_CARD}>
          <div>
            <div className="flex items-center justify-between gap-2">
              <Badge tone="accent">EP-9</Badge>
              <span className="font-mono text-[0.68rem] text-muted">External Sync</span>
            </div>
            <div className="mt-4">
              <h3 className="font-display text-base font-semibold">Sync External System</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Synchronizes in-memory React state with browser localStorage with error-safe
                fallbacks.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4">
            <div className={STATUS + ' !text-accent'}>Verified by: useLocalStorage.js</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
