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
    <div className="p-2.5 rounded-lg bg-slate-900 border border-white/5 font-mono text-xs text-cyan-300">
      Status: {log}
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
    // Concern A: User identity synchronization
    console.log(`[EP-4] Concern A: User switched to ${ep4User}`);
  }, [ep4User]);
  useEffect(() => {
    // Concern B: Activity metric synchronization
    console.log(`[EP-4] Concern B: Activity updated to ${ep4Activity}`);
  }, [ep4Activity]);

  return (
    <section className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl space-y-6">
      {/* Panel Header */}
      <div className="pb-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-100 tracking-tight">
            useEffect Lifecycle Patterns
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono border border-cyan-500/20">
            9 Core Patterns
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Interactive catalog showcasing dependency array variations, cleanup triggers, and
          anti-pattern protections.
        </p>
      </div>

      {/* Grid of 9 Pattern Demos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* EP-1: Run once ([]) */}
        <div className="p-4 rounded-xl border border-white/5 bg-slate-900/40 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold">
                EP-1
              </span>
              <span className="text-[11px] font-mono text-slate-400">deps: []</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-200 mt-2">Run Once on Mount</h3>
            <p className="text-xs text-slate-400 mt-1">
              Executes once when mounted and tears down on unmount. React StrictMode simulates this
              cycle twice in dev.
            </p>
          </div>
          <div className="space-y-2 pt-2 border-t border-white/5">
            {ep1Mounted ? (
              <MountLoggerChild />
            ) : (
              <p className="text-xs text-slate-500 font-mono">Child unmounted</p>
            )}
            <button
              type="button"
              onClick={() => setEp1Mounted((prev) => !prev)}
              className="w-full py-1.5 px-3 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              {ep1Mounted ? 'Unmount Child' : 'Mount Child'}
            </button>
          </div>
        </div>

        {/* EP-2: Specific dependencies */}
        <div className="p-4 rounded-xl border border-white/5 bg-slate-900/40 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold">
                EP-2
              </span>
              <span className="text-[11px] font-mono text-slate-400">deps: [ep2Count]</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-200 mt-2">Specific Dependencies</h3>
            <p className="text-xs text-slate-400 mt-1">
              Executes only when dependent values change. Here, document.title updates synchronously
              when count increments.
            </p>
          </div>
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="text-xs font-mono text-cyan-300">Current Count: {ep2Count}</div>
            <button
              type="button"
              onClick={() => setEp2Count((c) => c + 1)}
              className="w-full py-1.5 px-3 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              Increment Count (+1)
            </button>
          </div>
        </div>

        {/* EP-3: Every render */}
        <div className="p-4 rounded-xl border border-white/5 bg-slate-900/40 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                EP-3
              </span>
              <span className="text-[11px] font-mono text-slate-400">deps: none</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-200 mt-2">Every Render Pass</h3>
            <p className="text-xs text-slate-400 mt-1">
              Runs after every paint for diagnostics. Calling setState inside this effect would
              cause an infinite loop!
            </p>
          </div>
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="text-xs font-mono text-slate-400">Render triggers: {ep3Ticks}</div>
            <button
              type="button"
              onClick={() => setEp3Ticks((t) => t + 1)}
              className="w-full py-1.5 px-3 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              Trigger Re-render
            </button>
          </div>
        </div>

        {/* EP-4: Multiple effects */}
        <div className="p-4 rounded-xl border border-white/5 bg-slate-900/40 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold">
                EP-4
              </span>
              <span className="text-[11px] font-mono text-slate-400">Multiple effects</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-200 mt-2">Multiple Separate Effects</h3>
            <p className="text-xs text-slate-400 mt-1">
              Separates independent concerns into distinct effects rather than conflating them into
              a single monolithic callback.
            </p>
          </div>
          <div className="flex gap-2 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => setEp4User((u) => (u === 'Admin' ? 'Lead' : 'Admin'))}
              className="flex-1 py-1.5 px-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              User: {ep4User}
            </button>
            <button
              type="button"
              onClick={() => setEp4Activity((a) => a + 1)}
              className="flex-1 py-1.5 px-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              Act: {ep4Activity}
            </button>
          </div>
        </div>

        {/* EP-5: Cleanup abort fetch */}
        <div className="p-4 rounded-xl border border-white/5 bg-slate-900/40 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                EP-5
              </span>
              <span className="text-[11px] font-mono text-slate-400">Cleanup: Abort</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-200 mt-2">Abort HTTP Requests</h3>
            <p className="text-xs text-slate-400 mt-1">
              Invokes AbortController.abort() to cancel in-flight HTTP requests and eliminate race
              conditions.
            </p>
          </div>
          <div className="pt-2 border-t border-white/5">
            <span className="text-xs font-mono text-cyan-400">Verified by: useFetch.js</span>
          </div>
        </div>

        {/* EP-6: Cleanup timeout */}
        <div className="p-4 rounded-xl border border-white/5 bg-slate-900/40 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                EP-6
              </span>
              <span className="text-[11px] font-mono text-slate-400">Cleanup: Timeout</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-200 mt-2">Clear Timeout</h3>
            <p className="text-xs text-slate-400 mt-1">
              Calls clearTimeout on every new input stroke, buffering rapid typing events.
            </p>
          </div>
          <div className="pt-2 border-t border-white/5">
            <span className="text-xs font-mono text-cyan-400">Verified by: useDebounce.js</span>
          </div>
        </div>

        {/* EP-7: Cleanup interval */}
        <div className="p-4 rounded-xl border border-white/5 bg-slate-900/40 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                EP-7
              </span>
              <span className="text-[11px] font-mono text-slate-400">Cleanup: Interval</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-200 mt-2">Clear Interval</h3>
            <p className="text-xs text-slate-400 mt-1">
              Calls clearInterval on pause or unmount, preventing timer duplication under
              StrictMode.
            </p>
          </div>
          <div className="pt-2 border-t border-white/5">
            <span className="text-xs font-mono text-cyan-400">Verified by: useStopwatch.js</span>
          </div>
        </div>

        {/* EP-8: Cleanup listener */}
        <div className="p-4 rounded-xl border border-white/5 bg-slate-900/40 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                EP-8
              </span>
              <span className="text-[11px] font-mono text-slate-400">Cleanup: Listener</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-200 mt-2">Remove Event Listener</h3>
            <p className="text-xs text-slate-400 mt-1">
              Unregisters global event listeners with identical function references to eliminate
              memory leaks.
            </p>
          </div>
          <div className="pt-2 border-t border-white/5">
            <span className="text-xs font-mono text-cyan-400">Verified by: useWindowSize.js</span>
          </div>
        </div>

        {/* EP-9: Sync external system */}
        <div className="p-4 rounded-xl border border-white/5 bg-slate-900/40 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold">
                EP-9
              </span>
              <span className="text-[11px] font-mono text-slate-400">External Sync</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-200 mt-2">Sync External System</h3>
            <p className="text-xs text-slate-400 mt-1">
              Synchronizes in-memory React state with browser localStorage with error-safe
              fallbacks.
            </p>
          </div>
          <div className="pt-2 border-t border-white/5">
            <span className="text-xs font-mono text-cyan-400">Verified by: useLocalStorage.js</span>
          </div>
        </div>
      </div>
    </section>
  );
}
