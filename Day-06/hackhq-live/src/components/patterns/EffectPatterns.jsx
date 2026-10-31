import { useState, useEffect } from 'react';

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
    <div className="pattern-meta-status">
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
    <div className="live-card">
      <div className="live-card-header">
        <div className="live-card-title-group">
          <h2>useEffect Lifecycle Patterns</h2>
          <p className="live-card-subtitle">
            Interactive catalog showcasing dependency array variations, cleanup triggers, and
            anti-pattern protections.
          </p>
        </div>
        <span className="live-badge-pill">9 Core Patterns</span>
      </div>

      <div className="patterns-grid-container">
        {/* EP-1: Run once ([]) */}
        <div className="pattern-demo-card">
          <div>
            <div className="pattern-card-header">
              <span className="pattern-tag">EP-1</span>
              <span className="pattern-dep-tag">deps: []</span>
            </div>
            <div className="pattern-card-body">
              <h3>Run Once on Mount</h3>
              <p className="pattern-card-desc">
                Executes once after paint and tears down on unmount. React StrictMode simulates this
                cycle twice in dev.
              </p>
            </div>
          </div>
          <div className="pattern-card-footer">
            {ep1Mounted ? (
              <MountLoggerChild />
            ) : (
              <div className="pattern-meta-status" style={{ opacity: 0.6 }}>
                Child unmounted
              </div>
            )}
            <button
              type="button"
              onClick={() => setEp1Mounted((prev) => !prev)}
              className="pattern-action-btn"
            >
              {ep1Mounted ? 'Unmount Child' : 'Mount Child'}
            </button>
          </div>
        </div>

        {/* EP-2: Specific dependencies */}
        <div className="pattern-demo-card">
          <div>
            <div className="pattern-card-header">
              <span className="pattern-tag">EP-2</span>
              <span className="pattern-dep-tag">deps: [ep2Count]</span>
            </div>
            <div className="pattern-card-body">
              <h3>Specific Dependencies</h3>
              <p className="pattern-card-desc">
                Executes only when dependent values change. Here, document.title updates when count
                increments.
              </p>
            </div>
          </div>
          <div className="pattern-card-footer">
            <div className="pattern-meta-status">
              Current Count: <strong>{ep2Count}</strong>
            </div>
            <button
              type="button"
              onClick={() => setEp2Count((c) => c + 1)}
              className="pattern-action-btn"
            >
              Increment Count (+1)
            </button>
          </div>
        </div>

        {/* EP-3: Every render */}
        <div className="pattern-demo-card">
          <div>
            <div className="pattern-card-header">
              <span
                className="pattern-tag"
                style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-tape)' }}
              >
                EP-3
              </span>
              <span className="pattern-dep-tag">deps: none</span>
            </div>
            <div className="pattern-card-body">
              <h3>Every Render Pass</h3>
              <p className="pattern-card-desc">
                Runs after every paint for diagnostics. Calling setState inside this effect would
                cause an infinite loop!
              </p>
            </div>
          </div>
          <div className="pattern-card-footer">
            <div className="pattern-meta-status" style={{ color: 'var(--color-ink-muted)' }}>
              Render passes: <strong>{ep3Ticks}</strong>
            </div>
            <button
              type="button"
              onClick={() => setEp3Ticks((t) => t + 1)}
              className="pattern-action-btn"
            >
              Trigger Re-render
            </button>
          </div>
        </div>

        {/* EP-4: Multiple effects */}
        <div className="pattern-demo-card">
          <div>
            <div className="pattern-card-header">
              <span className="pattern-tag">EP-4</span>
              <span className="pattern-dep-tag">Multiple effects</span>
            </div>
            <div className="pattern-card-body">
              <h3>Multiple Separate Effects</h3>
              <p className="pattern-card-desc">
                Separates independent concerns into distinct effects rather than conflating them
                into a single monolithic callback.
              </p>
            </div>
          </div>
          <div className="pattern-card-footer">
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setEp4User((u) => (u === 'Admin' ? 'Lead' : 'Admin'))}
                className="pattern-action-btn"
              >
                User: {ep4User}
              </button>
              <button
                type="button"
                onClick={() => setEp4Activity((a) => a + 1)}
                className="pattern-action-btn"
              >
                Act: {ep4Activity}
              </button>
            </div>
          </div>
        </div>

        {/* EP-5: Cleanup abort fetch */}
        <div className="pattern-demo-card">
          <div>
            <div className="pattern-card-header">
              <span
                className="pattern-tag"
                style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-mint)' }}
              >
                EP-5
              </span>
              <span className="pattern-dep-tag">Cleanup: Abort</span>
            </div>
            <div className="pattern-card-body">
              <h3>Abort HTTP Requests</h3>
              <p className="pattern-card-desc">
                Invokes AbortController.abort() to cancel in-flight HTTP requests and eliminate race
                conditions.
              </p>
            </div>
          </div>
          <div className="pattern-card-footer">
            <div className="pattern-meta-status" style={{ color: 'var(--color-mint)' }}>
              Verified by: useFetch.js
            </div>
          </div>
        </div>

        {/* EP-6: Cleanup timeout */}
        <div className="pattern-demo-card">
          <div>
            <div className="pattern-card-header">
              <span
                className="pattern-tag"
                style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-mint)' }}
              >
                EP-6
              </span>
              <span className="pattern-dep-tag">Cleanup: Timeout</span>
            </div>
            <div className="pattern-card-body">
              <h3>Clear Timeout</h3>
              <p className="pattern-card-desc">
                Calls clearTimeout on every new input stroke, buffering rapid typing events.
              </p>
            </div>
          </div>
          <div className="pattern-card-footer">
            <div className="pattern-meta-status" style={{ color: 'var(--color-mint)' }}>
              Verified by: useDebounce.js
            </div>
          </div>
        </div>

        {/* EP-7: Cleanup interval */}
        <div className="pattern-demo-card">
          <div>
            <div className="pattern-card-header">
              <span
                className="pattern-tag"
                style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-mint)' }}
              >
                EP-7
              </span>
              <span className="pattern-dep-tag">Cleanup: Interval</span>
            </div>
            <div className="pattern-card-body">
              <h3>Clear Interval</h3>
              <p className="pattern-card-desc">
                Calls clearInterval on pause or unmount, preventing timer duplication under
                StrictMode.
              </p>
            </div>
          </div>
          <div className="pattern-card-footer">
            <div className="pattern-meta-status" style={{ color: 'var(--color-mint)' }}>
              Verified by: useStopwatch.js
            </div>
          </div>
        </div>

        {/* EP-8: Cleanup listener */}
        <div className="pattern-demo-card">
          <div>
            <div className="pattern-card-header">
              <span
                className="pattern-tag"
                style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-mint)' }}
              >
                EP-8
              </span>
              <span className="pattern-dep-tag">Cleanup: Listener</span>
            </div>
            <div className="pattern-card-body">
              <h3>Remove Event Listener</h3>
              <p className="pattern-card-desc">
                Unregisters global event listeners with identical function references to eliminate
                memory leaks.
              </p>
            </div>
          </div>
          <div className="pattern-card-footer">
            <div className="pattern-meta-status" style={{ color: 'var(--color-mint)' }}>
              Verified by: useWindowSize.js
            </div>
          </div>
        </div>

        {/* EP-9: Sync external system */}
        <div className="pattern-demo-card">
          <div>
            <div className="pattern-card-header">
              <span
                className="pattern-tag"
                style={{
                  background: 'rgba(139, 92, 246, 0.15)',
                  color: 'var(--color-purple-hero)',
                }}
              >
                EP-9
              </span>
              <span className="pattern-dep-tag">External Sync</span>
            </div>
            <div className="pattern-card-body">
              <h3>Sync External System</h3>
              <p className="pattern-card-desc">
                Synchronizes in-memory React state with browser localStorage with error-safe
                fallbacks.
              </p>
            </div>
          </div>
          <div className="pattern-card-footer">
            <div className="pattern-meta-status" style={{ color: 'var(--color-purple-hero)' }}>
              Verified by: useLocalStorage.js
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
