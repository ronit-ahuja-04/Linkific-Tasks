import { useState } from 'react';
import {
  FlaskConical,
  XCircle,
  CheckCircle,
  RotateCcw,
  RefreshCw,
  Plus,
  Zap,
  Code2,
} from 'lucide-react';
import StateXray from '../StateXray.jsx';

export default function StateLabStation({ xrayOn, onToggleXray, onNotify }) {
  // Experiment 1: State Mutation vs Immutability (LB-2)
  const [wrongItems, setWrongItems] = useState(['Badge 001', 'Badge 002']);
  const [rightItems, setRightItems] = useState(['Badge 001', 'Badge 002']);
  const [unrelatedTick, setUnrelatedTick] = useState(0);

  // Experiment 2: State Batching (+3 Snapshot vs Functional) (LB-3)
  const [directBatchCount, setDirectBatchCount] = useState(0);
  const [functionalBatchCount, setFunctionalBatchCount] = useState(0);

  // --- Experiment 1 Handlers ---
  const handleMutateDirectly = () => {
    // INTENTIONALLY WRONG: mutate array in-place and pass same reference (LB-2)
    const nextId = (wrongItems.length + 1).toString().padStart(3, '0');
    wrongItems.push(`Badge ${nextId} (Stale)`);
    setWrongItems(wrongItems); // React sees Object.is(prev, next) === true and skips re-render!
    onNotify(
      'Mutated array in-place with .push() — notice the screen did NOT update!',
      null,
      'warning'
    );
  };

  const handleImmutableAdd = () => {
    // RIGHT WAY: create a new array reference with spread (LB-2)
    const nextId = (rightItems.length + 1).toString().padStart(3, '0');
    setRightItems((prev) => [...prev, `Badge ${nextId} (Live)`]);
    onNotify(
      'Created new array reference with spread — screen re-rendered immediately!',
      null,
      'success'
    );
  };

  const handleForceRerender = () => {
    setUnrelatedTick((t) => t + 1);
    onNotify(
      'Forced a re-render from unrelated state — watch the hidden mutated items appear!',
      null,
      'info'
    );
  };

  const handleResetMutationDemo = () => {
    setWrongItems(['Badge 001', 'Badge 002']);
    setRightItems(['Badge 001', 'Badge 002']);
    setUnrelatedTick(0);
    onNotify('Reset immutability experiment', null, 'info');
  };

  // --- Experiment 2 Handlers ---
  const handleAddThreeDirect = () => {
    // WRONG WAY: calling setCount(count + 1) three times in one event (LB-3)
    setDirectBatchCount(directBatchCount + 1);
    setDirectBatchCount(directBatchCount + 1);
    setDirectBatchCount(directBatchCount + 1);
    onNotify(
      'Executed 3 direct updates — count only increased by +1 due to stale snapshot capture!',
      null,
      'warning'
    );
  };

  const handleAddThreeFunctional = () => {
    // RIGHT WAY: calling setCount(prev => prev + 1) three times (LB-3)
    setFunctionalBatchCount((prev) => prev + 1);
    setFunctionalBatchCount((prev) => prev + 1);
    setFunctionalBatchCount((prev) => prev + 1);
    onNotify(
      'Executed 3 functional updates — count increased by +3 as pending states queued!',
      null,
      'success'
    );
  };

  const handleResetBatchDemo = () => {
    setDirectBatchCount(0);
    setFunctionalBatchCount(0);
    onNotify('Reset batching experiment', null, 'info');
  };

  const statePayload = {
    experiment1: {
      wrongItemsLengthInMemory: wrongItems.length,
      wrongItemsVisibleCount: wrongItems.length,
      rightItemsCount: rightItems.length,
      unrelatedTick,
    },
    experiment2: {
      directBatchCount,
      functionalBatchCount,
    },
  };

  return (
    <div className="station-view station-lab">
      <div className="station-breadcrumb">LEARNING LAYER / STATE LAB</div>

      <div className="station-header">
        <div className="station-title-row">
          <h1 className="station-title">State lab</h1>
          <span className="live-status-pill">
            <span className="pulse-dot" aria-hidden="true" />
            <span>Live</span>
          </span>
        </div>
        <div className="station-header-actions">
          <div className="lab-tag-pill">
            <FlaskConical size={16} aria-hidden="true" />
            <span>Learning Layer</span>
          </div>
        </div>
      </div>

      <div className="station-layout lab-station-layout">
        <div className="station-workspace">
          {/* Experiment 1: Immutability & Reference Equality (LB-2) */}
          <section className="lab-experiment-card" aria-labelledby="exp1-heading">
            <div className="experiment-card-header">
              <div className="exp-num-badge">EXPERIMENT 01</div>
              <h2 id="exp1-heading" className="experiment-heading">
                State Immutability: In-Place Mutation vs New Array Reference
              </h2>
              <p className="experiment-lead">
                React triggers re-renders by testing object reference equality with{' '}
                <code>Object.is()</code>. Mutating state objects directly leads to stale, frozen
                UIs.
              </p>
            </div>

            <div className="lab-comparison-grid">
              {/* The Wrong Way: Mutation */}
              <div className="comparison-column wrong-column">
                <div className="column-status-banner tone-wrong">
                  <XCircle size={18} aria-hidden="true" />
                  <span className="status-banner-title">Wrong Way: Direct Mutation</span>
                </div>

                <div className="code-snippet-box">
                  <pre>
                    <code>
                      {`// Mutates existing memory array
items.push('New Badge');
setItems(items);`}
                    </code>
                  </pre>
                </div>

                <div className="lab-action-row">
                  <button
                    type="button"
                    className="btn btn-lab-action wrong"
                    onClick={handleMutateDirectly}
                    title="Push directly into array and setState(sameArray)"
                  >
                    <Plus size={16} aria-hidden="true" />
                    <span>Push item (.push)</span>
                  </button>
                </div>

                <div className="demo-render-preview">
                  <div className="preview-label-row">
                    <span>Rendered in DOM:</span>
                    <strong className="tabular-nums">{wrongItems.length} items</strong>
                  </div>
                  <div className="chips-container">
                    {wrongItems.map((item, idx) => (
                      <span key={idx} className="lab-item-chip stale">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="explanation-callout">
                  <p>
                    React compares references with <code>Object.is(prev, next)</code>. Because
                    mutating in-place preserves the same memory pointer, React skips re-rendering.
                  </p>
                </div>
              </div>

              {/* The Right Way: Immutable Spread */}
              <div className="comparison-column right-column">
                <div className="column-status-banner tone-right">
                  <CheckCircle size={18} aria-hidden="true" />
                  <span className="status-banner-title">Right Way: Immutable Spread</span>
                </div>

                <div className="code-snippet-box">
                  <pre>
                    <code>
                      {`// Creates fresh array instance
setItems(prev => [
  ...prev,
  'New Badge'
]);`}
                    </code>
                  </pre>
                </div>

                <div className="lab-action-row">
                  <button
                    type="button"
                    className="btn btn-lab-action right"
                    onClick={handleImmutableAdd}
                    title="Add item via array spread copy"
                  >
                    <Plus size={16} aria-hidden="true" />
                    <span>Add item ([...prev])</span>
                  </button>
                </div>

                <div className="demo-render-preview">
                  <div className="preview-label-row">
                    <span>Rendered in DOM:</span>
                    <strong className="tabular-nums">{rightItems.length} items</strong>
                  </div>
                  <div className="chips-container">
                    {rightItems.map((item, idx) => (
                      <span key={idx} className="lab-item-chip fresh">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="explanation-callout">
                  <p>
                    Creating a new array instance provides a brand-new object reference. React
                    detects the difference immediately and schedules a component re-render.
                  </p>
                </div>
              </div>
            </div>

            <div className="experiment-footer-bar">
              <div className="footer-left">
                <button
                  type="button"
                  className="btn btn-force-render"
                  onClick={handleForceRerender}
                  title="Update an unrelated state variable to force a re-render"
                >
                  <RefreshCw size={15} aria-hidden="true" />
                  <span>Trigger unrelated re-render (Tick: {unrelatedTick})</span>
                </button>
                <span className="force-tip">
                  (Notice how the mutated items suddenly appear when another state updates!)
                </span>
              </div>
              <button
                type="button"
                className="btn btn-reset-demo"
                onClick={handleResetMutationDemo}
                title="Reset experiment data"
              >
                <RotateCcw size={15} aria-hidden="true" />
                <span>Reset</span>
              </button>
            </div>
          </section>

          {/* Experiment 2: State Batching & Functional Updates (LB-3) */}
          <section className="lab-experiment-card" aria-labelledby="exp2-heading">
            <div className="experiment-card-header">
              <div className="exp-num-badge">EXPERIMENT 02</div>
              <h2 id="exp2-heading" className="experiment-heading">
                State Batching: Value Snapshots vs Functional Updaters (+3 Demo)
              </h2>
              <p className="experiment-lead">
                State in React acts like a snapshot for a given render. Calling an updater multiple
                times with direct values captures the exact same baseline number.
              </p>
            </div>

            <div className="lab-comparison-grid">
              {/* Direct Value Updates */}
              <div className="comparison-column wrong-column">
                <div className="column-status-banner tone-wrong">
                  <XCircle size={18} aria-hidden="true" />
                  <span className="status-banner-title">Direct Value (+1 x 3 = +1)</span>
                </div>

                <div className="code-snippet-box">
                  <pre>
                    <code>
                      {`// All 3 read identical count snapshot
setCount(count + 1);
setCount(count + 1);
setCount(count + 1);`}
                    </code>
                  </pre>
                </div>

                <div className="lab-action-row">
                  <button
                    type="button"
                    className="btn btn-lab-action wrong"
                    onClick={handleAddThreeDirect}
                    title="Execute 3 direct state updates"
                  >
                    <Zap size={16} aria-hidden="true" />
                    <span>Run +3 (Direct Value)</span>
                  </button>
                </div>

                <div className="counter-meter-box">
                  <span className="meter-label">Value in Rendered State</span>
                  <span className="meter-number tabular-nums">{directBatchCount}</span>
                </div>

                <div className="explanation-callout">
                  <p>
                    Each call reads the same stale snapshot of <code>count</code> captured during
                    render. All three updates overwrite each other with the exact same evaluated
                    value.
                  </p>
                </div>
              </div>

              {/* Functional Updates */}
              <div className="comparison-column right-column">
                <div className="column-status-banner tone-right">
                  <CheckCircle size={18} aria-hidden="true" />
                  <span className="status-banner-title">Functional Updater (+1 x 3 = +3)</span>
                </div>

                <div className="code-snippet-box">
                  <pre>
                    <code>
                      {`// Each receives pending state in queue
setCount(prev => prev + 1);
setCount(prev => prev + 1);
setCount(prev => prev + 1);`}
                    </code>
                  </pre>
                </div>

                <div className="lab-action-row">
                  <button
                    type="button"
                    className="btn btn-lab-action right"
                    onClick={handleAddThreeFunctional}
                    title="Execute 3 functional state updates"
                  >
                    <Zap size={16} aria-hidden="true" />
                    <span>Run +3 (Functional)</span>
                  </button>
                </div>

                <div className="counter-meter-box">
                  <span className="meter-label">Value in Rendered State</span>
                  <span className="meter-number tabular-nums">{functionalBatchCount}</span>
                </div>

                <div className="explanation-callout">
                  <p>
                    Functional updaters are queued in React&apos;s dispatcher. Each updater receives
                    the fresh pending state calculated by the previous one.
                  </p>
                </div>
              </div>
            </div>

            <div className="experiment-footer-bar">
              <div className="footer-left">
                <Code2 size={16} className="text-lanyard" aria-hidden="true" />
                <span>Notice the +1 vs +3 divergence when clicked!</span>
              </div>
              <button
                type="button"
                className="btn btn-reset-demo"
                onClick={handleResetBatchDemo}
                title="Reset batching counters"
              >
                <RotateCcw size={15} aria-hidden="true" />
                <span>Reset</span>
              </button>
            </div>
          </section>
        </div>

        <StateXray
          isOpen={xrayOn}
          stationName="State lab"
          statePayload={statePayload}
          onClose={onToggleXray}
        />
      </div>
    </div>
  );
}
