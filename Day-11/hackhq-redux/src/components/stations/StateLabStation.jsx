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
import styled from 'styled-components';
import StateXray from '../StateXray.jsx';
import PageHeader from '../layout/PageHeader.jsx';
import { Badge, Button, Card, Grid, Stack } from '../ui.jsx';
import { animateRise, animatePop } from '../../styles/animations.js';

const ColumnBox = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(3)};
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme, $wrong }) => ($wrong ? theme.colors.bad : theme.colors.good)};
  background: ${({ theme, $wrong }) => ($wrong ? theme.colors.badSoft : theme.colors.goodSoft)};
  padding: ${({ theme }) => theme.space(3)};
  ${({ theme }) => theme.media.up('sm')} {
    padding: ${({ theme }) => theme.space(4)};
  }
`;
const ColumnTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  font-weight: 600;
  color: ${({ theme, $wrong }) => ($wrong ? theme.colors.bad : theme.colors.good)};
`;
const CodeBox = styled.div`
  overflow-x: auto;
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.space(3)};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.875em;
  background: ${({ theme }) => theme.colors.board};
  color: ${({ theme }) => theme.colors.onBoard};
  pre {
    margin: 0;
  }
  code {
    color: inherit;
  }
`;
const Note = styled.p`
  margin: 0;
  font-size: 0.875em;
  color: ${({ theme }) => theme.colors.muted};
`;
const Inner = styled.div`
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.line};
  background: ${({ theme }) => theme.colors.bg};
  padding: ${({ theme }) => theme.space(3)};
`;
const PreviewHead = styled.div`
  margin-bottom: ${({ theme }) => theme.space(2)};
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875em;
  color: ${({ theme }) => theme.colors.muted};
  strong {
    color: ${({ theme }) => theme.colors.ink};
  }
`;
const PopBadge = styled(Badge)`
  ${animatePop} text-transform: lowercase;
`;
const MeterRow = styled(Inner)`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
const MeterLabel = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.875em;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.colors.muted};
`;
const MeterValue = styled.span`
  font-size: 2rem;
  font-weight: 700;
`;
const LabCardBox = styled(Card)`
  ${animateRise}
`;
const LabHead = styled.div`
  margin-bottom: ${({ theme }) => theme.space(4)};
`;
const LabTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
`;
const LabLead = styled.p`
  margin: ${({ theme }) => theme.space(2)} 0 0;
  max-width: 48rem;
  color: ${({ theme }) => theme.colors.muted};
`;
const LabFooter = styled.div`
  margin-top: ${({ theme }) => theme.space(4)};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(3)};
  border-top: 1px solid ${({ theme }) => theme.colors.line};
  padding-top: ${({ theme }) => theme.space(4)};
  ${({ theme }) => theme.media.up('sm')} {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;
const FooterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(2)};
  ${({ theme }) => theme.media.up('sm')} {
    flex-direction: row;
    align-items: center;
    gap: ${({ theme }) => theme.space(3)};
  }
`;
const Hint = styled.span`
  font-size: 0.875em;
  color: ${({ theme }) => theme.colors.muted};
`;
const NoteRow = styled(Hint)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  svg {
    color: ${({ theme }) => theme.colors.accent};
  }
`;
const ResetButton = styled(Button)`
  align-self: flex-start;
  border-color: ${({ theme }) => theme.colors.line};
  ${({ theme }) => theme.media.up('sm')} {
    align-self: auto;
  }
`;
const StartButton = styled(Button)`
  align-self: flex-start;
`;

// Shared presentation helpers: every lab gets the same card treatment.
function Column({ wrong, title, code, children, note }) {
  const Icon = wrong ? XCircle : CheckCircle;
  return (
    <ColumnBox $wrong={wrong}>
      <ColumnTitle $wrong={wrong}>
        <Icon size={18} aria-hidden="true" />
        <span>{title}</span>
      </ColumnTitle>
      <CodeBox>
        <pre>
          <code>{code}</code>
        </pre>
      </CodeBox>
      {children}
      <Note>{note}</Note>
    </ColumnBox>
  );
}

function Preview({ items, stale }) {
  return (
    <Inner>
      <PreviewHead>
        <span>Rendered in DOM:</span>
        <strong>{items.length} items</strong>
      </PreviewHead>
      <Stack $dir="row" $gap={2} $wrap>
        {items.map((item, idx) => (
          <PopBadge key={idx} $$tone={stale ? 'bad' : 'good'}>
            {item}
          </PopBadge>
        ))}
      </Stack>
    </Inner>
  );
}

function Meter({ value }) {
  return (
    <MeterRow>
      <MeterLabel>Value in Rendered State</MeterLabel>
      <MeterValue>{value}</MeterValue>
    </MeterRow>
  );
}

function LabCard({ num, id, title, lead, footer, children }) {
  return (
    <LabCardBox as="section" aria-labelledby={id}>
      <LabHead>
        <Badge $$tone="accent" style={{ marginBottom: '0.75rem' }}>
          {num}
        </Badge>
        <LabTitle id={id}>{title}</LabTitle>
        <LabLead>{lead}</LabLead>
      </LabHead>
      <Grid $cols={{ base: 1, md: 2 }} $gap={3}>
        {children}
      </Grid>
      <LabFooter>{footer}</LabFooter>
    </LabCardBox>
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
        <Badge $tone="accent">
          <FlaskConical size={14} aria-hidden="true" />
          <span>Learning Layer</span>
        </Badge>
      </PageHeader>

      <Stack $gap={4}>
        <Stack $gap={4}>
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
                <FooterGroup>
                  <Button
                    $variant="dark"
                    $size="sm"
                    onClick={handleForceRerender}
                    title="Update an unrelated state variable to force a re-render"
                  >
                    <RefreshCw size={15} aria-hidden="true" />
                    <span>Trigger unrelated re-render (Tick: {unrelatedTick})</span>
                  </Button>
                  <Hint>
                    (Notice how the mutated items suddenly appear when another state updates!)
                  </Hint>
                </FooterGroup>
                <ResetButton
                  $variant="ghost"
                  $size="sm"
                  onClick={handleResetMutationDemo}
                  title="Reset experiment data"
                >
                  <RotateCcw size={15} aria-hidden="true" />
                  <span>Reset</span>
                </ResetButton>
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
              <StartButton
                $variant="danger"
                onClick={handleMutateDirectly}
                title="Push directly into array and setState(sameArray)"
              >
                <Plus size={16} aria-hidden="true" />
                <span>Push item (.push)</span>
              </StartButton>
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
              <StartButton
                $variant="primary"
                onClick={handleImmutableAdd}
                title="Add item via array spread copy"
              >
                <Plus size={16} aria-hidden="true" />
                <span>Add item ([...prev])</span>
              </StartButton>
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
                <NoteRow>
                  <Code2 size={16} aria-hidden="true" />
                  <span>Notice the +1 vs +3 divergence when clicked!</span>
                </NoteRow>
                <ResetButton
                  $variant="ghost"
                  $size="sm"
                  onClick={handleResetBatchDemo}
                  title="Reset batching counters"
                >
                  <RotateCcw size={15} aria-hidden="true" />
                  <span>Reset</span>
                </ResetButton>
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
              <StartButton
                $variant="danger"
                onClick={handleAddThreeDirect}
                title="Execute 3 direct state updates"
              >
                <Zap size={16} aria-hidden="true" />
                <span>Run +3 (Direct Value)</span>
              </StartButton>
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
              <StartButton
                $variant="primary"
                onClick={handleAddThreeFunctional}
                title="Execute 3 functional state updates"
              >
                <Zap size={16} aria-hidden="true" />
                <span>Run +3 (Functional)</span>
              </StartButton>
              <Meter value={functionalBatchCount} />
            </Column>
          </LabCard>
        </Stack>

        <StateXray
          isOpen={xrayOn}
          stationName="State lab"
          statePayload={statePayload}
          onClose={onToggleXray}
        />
      </Stack>
    </div>
  );
}
