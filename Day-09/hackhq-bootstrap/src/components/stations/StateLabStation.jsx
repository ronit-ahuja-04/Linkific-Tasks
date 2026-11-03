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
import { Col, Row } from 'react-bootstrap';
import StateXray from '../StateXray.jsx';
import PageHeader from '../layout/PageHeader.jsx';
import { Badge, Button, Card, cx } from '../ui.jsx';

// Shared presentation helpers: every lab gets the same card treatment.
function Column({ wrong, title, code, children, note }) {
  const Icon = wrong ? XCircle : CheckCircle;
  return (
    <Col md={6}>
      <div
        className={cx(
          'h-100 d-flex flex-column gap-3 rounded-4 border p-3 p-sm-4',
          wrong
            ? 'border-danger-subtle bg-danger-subtle'
            : 'border-success-subtle bg-success-subtle'
        )}
      >
        <div
          className={cx(
            'd-flex align-items-center gap-2 fw-semibold',
            wrong ? 'text-danger-emphasis' : 'text-success-emphasis'
          )}
        >
          <Icon size={18} aria-hidden="true" />
          <span>{title}</span>
        </div>
        <div className="overflow-x-auto rounded-3 p-3 font-monospace small panel-board">
          <pre className="mb-0">
            <code className="text-reset">{code}</code>
          </pre>
        </div>
        {children}
        <p className="mb-0 small text-body-secondary">{note}</p>
      </div>
    </Col>
  );
}

function Preview({ items, stale }) {
  return (
    <div className="rounded-3 border bg-body p-3">
      <div className="mb-2 d-flex align-items-center justify-content-between small text-body-secondary">
        <span>Rendered in DOM:</span>
        <strong className="text-body">{items.length} items</strong>
      </div>
      <div className="d-flex flex-wrap gap-2">
        {items.map((item, idx) => (
          <Badge key={idx} tone={stale ? 'bad' : 'good'} className="animate-pop text-lowercase">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function Meter({ value }) {
  return (
    <div className="d-flex align-items-center justify-content-between rounded-3 border bg-body p-3">
      <span className="font-monospace small text-uppercase ls-wide text-body-secondary">
        Value in Rendered State
      </span>
      <span className="fs-2 fw-bold">{value}</span>
    </div>
  );
}

function LabCard({ num, id, title, lead, footer, children }) {
  return (
    <Card as="section" aria-labelledby={id} className="animate-rise">
      <div className="mb-4">
        <Badge tone="accent" className="mb-3">
          {num}
        </Badge>
        <h2 id={id} className="fs-4 fw-bold">
          {title}
        </h2>
        <p className="mt-2 mb-0 text-body-secondary" style={{ maxWidth: '48rem' }}>
          {lead}
        </p>
      </div>
      <Row className="g-3">{children}</Row>
      <div className="mt-4 d-flex flex-column flex-sm-row gap-3 align-items-sm-center justify-content-sm-between border-top pt-4">
        {footer}
      </div>
    </Card>
  );
}

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
    <div>
      <PageHeader breadcrumb="Learning layer / State lab" title="State lab" pill="Live">
        <Badge tone="accent">
          <FlaskConical size={14} aria-hidden="true" />
          <span>Learning Layer</span>
        </Badge>
      </PageHeader>

      <div className="d-flex flex-column gap-4">
        <div className="d-flex flex-column gap-4">
          {/* Experiment 1: Immutability & Reference Equality (LB-2) */}
          <LabCard
            num="EXPERIMENT 01"
            id="exp1-heading"
            title="State Immutability: In-Place Mutation vs New Array Reference"
            lead={
              <>
                React triggers re-renders by testing object reference equality with{' '}
                <code>Object.is()</code>. Mutating state objects directly leads to stale, frozen
                UIs.
              </>
            }
            footer={
              <>
                <div className="d-flex flex-column flex-sm-row gap-2 gap-sm-3 align-items-sm-center">
                  <Button
                    variant="dark"
                    size="sm"
                    onClick={handleForceRerender}
                    title="Update an unrelated state variable to force a re-render"
                  >
                    <RefreshCw size={15} aria-hidden="true" />
                    <span>Trigger unrelated re-render (Tick: {unrelatedTick})</span>
                  </Button>
                  <span className="small text-body-secondary">
                    (Notice how the mutated items suddenly appear when another state updates!)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="align-self-start align-self-sm-auto border"
                  onClick={handleResetMutationDemo}
                  title="Reset experiment data"
                >
                  <RotateCcw size={15} aria-hidden="true" />
                  <span>Reset</span>
                </Button>
              </>
            }
          >
            <Column
              wrong
              title="Wrong Way: Direct Mutation"
              code={`// Mutates existing memory array
items.push('New Badge');
setItems(items);`}
              note={
                <>
                  React compares references with <code>Object.is(prev, next)</code>. Because
                  mutating in-place preserves the same memory pointer, React skips re-rendering.
                </>
              }
            >
              <Button
                variant="danger"
                className="align-self-start"
                onClick={handleMutateDirectly}
                title="Push directly into array and setState(sameArray)"
              >
                <Plus size={16} aria-hidden="true" />
                <span>Push item (.push)</span>
              </Button>
              <Preview items={wrongItems} stale />
            </Column>

            <Column
              title="Right Way: Immutable Spread"
              code={`// Creates fresh array instance
setItems(prev => [
  ...prev,
  'New Badge'
]);`}
              note="Creating a new array instance provides a brand-new object reference. React detects the difference immediately and schedules a component re-render."
            >
              <Button
                variant="primary"
                className="align-self-start"
                onClick={handleImmutableAdd}
                title="Add item via array spread copy"
              >
                <Plus size={16} aria-hidden="true" />
                <span>Add item ([...prev])</span>
              </Button>
              <Preview items={rightItems} />
            </Column>
          </LabCard>

          {/* Experiment 2: State Batching & Functional Updates (LB-3) */}
          <LabCard
            num="EXPERIMENT 02"
            id="exp2-heading"
            title="State Batching: Value Snapshots vs Functional Updaters (+3 Demo)"
            lead="State in React acts like a snapshot for a given render. Calling an updater multiple times with direct values captures the exact same baseline number."
            footer={
              <>
                <div className="d-flex align-items-center gap-2 small text-body-secondary">
                  <Code2 size={16} className="text-primary" aria-hidden="true" />
                  <span>Notice the +1 vs +3 divergence when clicked!</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="align-self-start align-self-sm-auto border"
                  onClick={handleResetBatchDemo}
                  title="Reset batching counters"
                >
                  <RotateCcw size={15} aria-hidden="true" />
                  <span>Reset</span>
                </Button>
              </>
            }
          >
            <Column
              wrong
              title="Direct Value (+1 x 3 = +1)"
              code={`// All 3 read identical count snapshot
setCount(count + 1);
setCount(count + 1);
setCount(count + 1);`}
              note={
                <>
                  Each call reads the same stale snapshot of <code>count</code> captured during
                  render. All three updates overwrite each other with the exact same evaluated
                  value.
                </>
              }
            >
              <Button
                variant="danger"
                className="align-self-start"
                onClick={handleAddThreeDirect}
                title="Execute 3 direct state updates"
              >
                <Zap size={16} aria-hidden="true" />
                <span>Run +3 (Direct Value)</span>
              </Button>
              <Meter value={directBatchCount} />
            </Column>

            <Column
              title="Functional Updater (+1 x 3 = +3)"
              code={`// Each receives pending state in queue
setCount(prev => prev + 1);
setCount(prev => prev + 1);
setCount(prev => prev + 1);`}
              note="Functional updaters are queued in React's dispatcher. Each updater receives the fresh pending state calculated by the previous one."
            >
              <Button
                variant="primary"
                className="align-self-start"
                onClick={handleAddThreeFunctional}
                title="Execute 3 functional state updates"
              >
                <Zap size={16} aria-hidden="true" />
                <span>Run +3 (Functional)</span>
              </Button>
              <Meter value={functionalBatchCount} />
            </Column>
          </LabCard>
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
