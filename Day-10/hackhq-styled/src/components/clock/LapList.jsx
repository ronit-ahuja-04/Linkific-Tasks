import styled from 'styled-components';
import { Button, Muted } from '../ui.jsx';
import { formatElapsed } from '../../lib/format.js';

const Empty = styled.div`
  border: 2px dashed ${({ theme }) => theme.colors.line};
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.muted};
`;
const Panel = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: 1rem;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface};
`;
const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.colors.muted};
  background: ${({ theme }) => theme.colors.surface2};
  border-bottom: 1px solid ${({ theme }) => theme.colors.line};
`;
const Items = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 16rem;
  overflow-y: auto;
  > li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 0.875rem;
  }
  > li + li {
    border-top: 1px solid ${({ theme }) => theme.colors.line};
  }
`;

/**
 * Renders the recorded stopwatch laps list.
 * Complies with requirement CK-2.
 */
export function LapList({ laps = [], onClear }) {
  if (laps.length === 0) {
    return (
      <Empty>No laps recorded yet. Click &quot;Record Lap&quot; while the clock is running.</Empty>
    );
  }

  return (
    <Panel>
      <Head>
        <span>Recorded Laps ({laps.length})</span>
        <Button $variant="danger" $size="sm" onClick={onClear}>
          Clear Laps ✕
        </Button>
      </Head>

      <Items>
        {laps.map((lap, idx) => (
          <li key={lap.id || idx}>
            <Muted>Lap {String(laps.length - idx).padStart(2, '0')}</Muted>
            <strong>{formatElapsed(lap.ms)}</strong>
          </li>
        ))}
      </Items>
    </Panel>
  );
}
