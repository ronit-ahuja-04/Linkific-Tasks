import styled from 'styled-components';
import { useStopwatch } from '../../hooks/useStopwatch.js';
import { formatElapsed } from '../../lib/format.js';
import { Badge, Board, Button, Card, Stack } from '../ui.jsx';
import { LapList } from './LapList.jsx';

const Wrap = styled.div`
  max-width: 48rem;
  margin: 0 auto;
`;
const ClockCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  ${({ theme }) => theme.media.up('sm')} {
    padding: 1.5rem;
  }
`;
const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
`;
const Sub = styled.p`
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.muted};
`;
const Display = styled(Board)`
  border-radius: 1rem;
  padding: 3rem 1rem;
  text-align: center;
`;
const Digits = styled.div`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.brand};
  font-size: clamp(2.75rem, 11vw, 4.5rem);
  font-variant-numeric: tabular-nums;
`;
const Caption = styled.div`
  margin-top: 1rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.75;
`;
const Controls = styled.div`
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
  ${({ theme }) => theme.media.up('sm')} {
    grid-template-columns: 1fr 1fr;
  }
  > .full {
    grid-column: 1 / -1;
  }
`;

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
    <Wrap>
      <ClockCard>
        <Stack $dir="row" $wrap $align="flex-start" $justify="space-between" $gap={3}>
          <div>
            <Title>Hackathon Clock</Title>
            <Sub>Millisecond-precision timer with StrictMode-resilient interval cleanup</Sub>
          </div>
          <Badge $tone={running ? 'good' : elapsed > 0 ? 'warn' : 'neutral'}>
            {running ? '● Running' : elapsed > 0 ? '⏸ Paused' : 'Idle'}
          </Badge>
        </Stack>

        {/* Big Digital Display */}
        <Display>
          <Digits>{formatElapsed(elapsed)}</Digits>
          <Caption>Interval: 100ms • Functional Updates • StrictMode Safe</Caption>
        </Display>

        {/* Action Controls */}
        <Controls>
          {running ? (
            <Button $variant="dark" $size="lg" onClick={pause}>
              Pause ⏸
            </Button>
          ) : (
            <Button $variant="primary" $size="lg" onClick={start}>
              {elapsed > 0 ? 'Resume ▶' : 'Start Clock ▶'}
            </Button>
          )}

          <Button $variant="secondary" $size="lg" onClick={handleLap} disabled={!running}>
            Record Lap ⏱
          </Button>

          <Button
            className="full"
            $variant="ghost"
            $size="lg"
            onClick={reset}
            disabled={elapsed === 0 && !running}
          >
            Reset ↺
          </Button>
        </Controls>

        {/* Laps List */}
        <LapList laps={laps} onClear={onClearLaps} />
      </ClockCard>
    </Wrap>
  );
}
