import { useState, useId } from 'react';
import { Plus, RotateCcw, Ticket } from 'lucide-react';
import SplitFlapBoard from './SplitFlapBoard.jsx';
import StateXray from '../StateXray.jsx';
import PageHeader from '../layout/PageHeader.jsx';
import styled from 'styled-components';
import { Badge, Board, Button, Card, FormGroup, Input } from '../ui.jsx';
import { animateRise } from '../../styles/animations.js';
import {
  calculateCapacityPercentage,
  getCapacityStatus,
  parseCapacityInput,
} from '../../lib/counter.js';

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(4)};
  ${({ theme }) => theme.media.up('lg')} {
    flex-direction: row;
    align-items: flex-start;
  }
`;
const Main = styled.div`
  flex: 1 1 0;
  min-width: 0;
`;
const VisuallyHidden = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
const MainCard = styled(Card)`
  ${animateRise}
  padding: ${({ theme }) => theme.space(3)};
  ${({ theme }) => theme.media.up('sm')} {
    padding: ${({ theme }) => theme.space(4)};
  }
`;
const CardHead = styled.div`
  margin-bottom: ${({ theme }) => theme.space(4)};
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(3)};
`;
const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
`;
const Sub = styled.p`
  margin: 0;
  font-size: 0.875em;
  color: ${({ theme }) => theme.colors.muted};
`;
const IconBox = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.accentSoft};
  color: ${({ theme }) => theme.colors.accent};
`;
const BoardWrap = styled(Board)`
  display: flex;
  justify-content: center;
  overflow-x: auto;
  padding: ${({ theme }) => theme.space(3)};
  border-radius: ${({ theme }) => theme.radii.lg};
  ${({ theme }) => theme.media.up('sm')} {
    padding: ${({ theme }) => theme.space(4)};
  }
`;
const Actions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.space(2)};
  margin-top: ${({ theme }) => theme.space(3)};
  ${({ theme }) => theme.media.up('sm')} {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;
const ResetButton = styled(Button)`
  border-color: ${({ theme }) => theme.colors.line};
`;
const Bottom = styled.div`
  margin-top: ${({ theme }) => theme.space(4)};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(3)};
  border-top: 1px solid ${({ theme }) => theme.colors.line};
  padding-top: ${({ theme }) => theme.space(4)};
  ${({ theme }) => theme.media.up('sm')} {
    flex-direction: row;
    align-items: center;
  }
`;
const CapacityGroup = styled(FormGroup)`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
`;
const CapacityLabel = styled.label`
  font-size: 0.875em;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: ${({ theme }) => theme.colors.muted};
`;
const CapacityInput = styled(Input)`
  font-family: ${({ theme }) => theme.fonts.mono};
  width: 7rem;
`;
const barColor = { danger: 'bad', warning: 'warn', success: 'good' };
const Track = styled.div`
  flex: 1 1 0;
  height: 0.625rem;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: ${({ theme }) => theme.radii.pill};
`;
const Fill = styled.div`
  height: 100%;
  transition: width 0.3s ease;
  width: ${({ $pct }) => $pct}%;
  background: ${({ theme, $variant }) => theme.colors[barColor[$variant]]};
`;
const StatusBadge = styled(Badge)`
  align-self: flex-start;
  ${({ theme }) => theme.media.up('sm')} {
    align-self: auto;
  }
`;
const FieldError = styled.div`
  display: block;
  margin-top: ${({ theme }) => theme.space(2)};
  font-size: 0.875em;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.bad};
`;

export default function CheckInStation({ xrayOn, onToggleXray, onNotify }) {
  // Separate state variables demonstrating multi-variable state architecture (CI-5)
  const [count, setCount] = useState(0);
  const [capacity, setCapacity] = useState(200);
  const [capacityInput, setCapacityInput] = useState('200');
  const [capacityError, setCapacityError] = useState('');

  const capacityInputId = useId();

  // Derived state computed purely during render (CI-4, zero duplicate state)
  const percentage = calculateCapacityPercentage(count, capacity);
  const status = getCapacityStatus(count, capacity);

  // Handlers with functional state updates (prev => ...)
  const handleIncrement = () => {
    setCount((prev) => {
      const next = prev + 1;
      return next <= capacity ? next : prev;
    });
  };

  const handleDecrement = () => {
    setCount((prev) => Math.max(0, prev - 1));
  };

  const handleGroupIncrement = () => {
    setCount((prev) => Math.min(capacity, prev + 5));
  };

  const handleReset = () => {
    setCount(0);
    onNotify('Count reset to 0', null, 'info');
  };

  const handleCapacityChange = (e) => {
    const rawVal = e.target.value;
    setCapacityInput(rawVal);

    if (rawVal === '') {
      setCapacityError('Capacity cannot be empty.');
      return;
    }

    const { value: parsedVal, isValid, message } = parseCapacityInput(rawVal, capacity);

    if (!isValid) {
      setCapacityError(message || 'Invalid capacity');
      return;
    }

    setCapacityError('');
    setCapacity(parsedVal);

    // If new capacity is lower than current count, clamp count and notify (CI-3)
    if (count > parsedVal) {
      setCount(parsedVal);
      onNotify(`Capacity reduced: people count adjusted to ${parsedVal}`, null, 'warning');
    }
  };

  const handleCapacityBlur = () => {
    const { value: parsedVal } = parseCapacityInput(capacityInput, capacity);
    setCapacity(parsedVal);
    setCapacityInput(parsedVal.toString());
    setCapacityError('');

    if (count > parsedVal) {
      setCount(parsedVal);
      onNotify(`Capacity reduced: people count adjusted to ${parsedVal}`, null, 'warning');
    }
  };

  const statePayload = {
    count,
    capacity,
    percentage,
    status: status.label,
    statusTone: status.tone,
    isAtCapacity: count >= capacity,
    isAtZero: count === 0,
  };

  const barVariant =
    status.tone === 'alert' ? 'danger' : status.tone === 'warning' ? 'warning' : 'success';
  const statusTone = status.tone === 'alert' ? 'bad' : status.tone === 'warning' ? 'warn' : 'good';

  return (
    <div>
      <PageHeader breadcrumb="Checkin" title="Check-in" pill="Live" />

      <Layout>
        <Main>
          {/* Screen Reader Polite Live Region (CI-7) */}
          <VisuallyHidden aria-live="polite" aria-atomic="true">
            {count} of {capacity} inside venue. {status.label}.
          </VisuallyHidden>

          {/* Unified Primary Card: People inside (Matches v0 Baseline Spec) */}
          <MainCard>
            <CardHead>
              <div>
                <Title>People inside</Title>
                <Sub>Keep a live count of everyone in the venue.</Sub>
              </div>
              <IconBox aria-hidden="true">
                <Ticket size={20} />
              </IconBox>
            </CardHead>

            {/* Split-Flap Display */}
            <BoardWrap>
              <SplitFlapBoard count={count} capacity={capacity} />
            </BoardWrap>

            {/* Action Buttons Row */}
            <Actions>
              <Button
                $variant="secondary"
                onClick={handleDecrement}
                disabled={count === 0}
                aria-label="Decrement count by 1"
                title="Decrease people count by 1"
              >
                <span>-1</span>
              </Button>

              <Button
                $variant="primary"
                onClick={handleIncrement}
                disabled={count >= capacity}
                aria-label="Increment count by 1"
                title={count >= capacity ? 'Venue is at maximum capacity' : 'Add 1 person'}
              >
                <Plus size={16} aria-hidden="true" />
                <span>1</span>
              </Button>

              <Button
                $variant="secondary"
                onClick={handleGroupIncrement}
                disabled={count >= capacity}
                aria-label="Increment count by 5 for a group"
                title="Add group (+5 people)"
              >
                <span>+5 group</span>
              </Button>

              <ResetButton
                $variant="ghost"
                onClick={handleReset}
                disabled={count === 0}
                aria-label="Reset count to 0"
                title="Reset attendee counter to zero"
              >
                <RotateCcw size={15} aria-hidden="true" />
                <span>Reset</span>
              </ResetButton>
            </Actions>

            {/* Bottom Capacity & Meter Row */}
            <Bottom>
              <CapacityGroup>
                <CapacityLabel htmlFor={capacityInputId}>Capacity</CapacityLabel>
                <CapacityInput
                  id={capacityInputId}
                  type="number"
                  min={1}
                  max={1000}
                  value={capacityInput}
                  onChange={handleCapacityChange}
                  onBlur={handleCapacityBlur}
                  $invalid={!!capacityError}
                  aria-invalid={!!capacityError}
                  aria-describedby={capacityError ? `${capacityInputId}-err` : undefined}
                />
              </CapacityGroup>

              <Track
                role="progressbar"
                aria-valuenow={count}
                aria-valuemin={0}
                aria-valuemax={capacity}
                aria-label="Venue capacity occupancy percentage"
              >
                <Fill
                  $variant={barVariant}
                  $pct={Math.min(100, Math.max(0, (count / capacity) * 100))}
                />
              </Track>

              <StatusBadge $tone={statusTone}>{status.label}</StatusBadge>
            </Bottom>

            {capacityError && (
              <FieldError id={`${capacityInputId}-err`} role="alert">
                {capacityError}
              </FieldError>
            )}
          </MainCard>
        </Main>

        <StateXray
          isOpen={xrayOn}
          stationName="Check-in"
          statePayload={statePayload}
          onClose={onToggleXray}
        />
      </Layout>
    </div>
  );
}
