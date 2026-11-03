import { useState, useId } from 'react';
import { Plus, RotateCcw, Ticket } from 'lucide-react';
import SplitFlapBoard from './SplitFlapBoard.jsx';
import StateXray from '../StateXray.jsx';
import PageHeader from '../layout/PageHeader.jsx';
import { Badge, Button, Card, cx, errorClass, inputClass } from '../ui.jsx';
import {
  calculateCapacityPercentage,
  getCapacityStatus,
  parseCapacityInput,
} from '../../lib/counter.js';

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

  const barTone =
    status.tone === 'alert' ? 'bg-bad' : status.tone === 'warning' ? 'bg-warn' : 'bg-brand';
  const statusTone = status.tone === 'alert' ? 'bad' : status.tone === 'warning' ? 'warn' : 'good';

  return (
    <div>
      <PageHeader breadcrumb="Checkin" title="Check-in" pill="Live" />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          {/* Screen Reader Polite Live Region (CI-7) */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {count} of {capacity} inside venue. {status.label}.
          </div>

          {/* Unified Primary Card: People inside (Matches v0 Baseline Spec) */}
          <Card className="animate-rise p-5 sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold sm:text-2xl">People inside</h2>
                <p className="mt-1 text-sm text-muted">
                  Keep a live count of everyone in the venue.
                </p>
              </div>
              <div
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent"
                aria-hidden="true"
              >
                <Ticket size={20} />
              </div>
            </div>

            {/* Split-Flap Display */}
            <div className="flex justify-center overflow-x-auto rounded-2xl bg-board p-4 text-on-board sm:p-8">
              <SplitFlapBoard count={count} capacity={capacity} />
            </div>

            {/* Action Buttons Row */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Button
                variant="secondary"
                onClick={handleDecrement}
                disabled={count === 0}
                aria-label="Decrement count by 1"
                title="Decrease people count by 1"
              >
                <span>-1</span>
              </Button>

              <Button
                variant="primary"
                onClick={handleIncrement}
                disabled={count >= capacity}
                aria-label="Increment count by 1"
                title={count >= capacity ? 'Venue is at maximum capacity' : 'Add 1 person'}
              >
                <Plus size={16} aria-hidden="true" />
                <span>1</span>
              </Button>

              <Button
                variant="secondary"
                onClick={handleGroupIncrement}
                disabled={count >= capacity}
                aria-label="Increment count by 5 for a group"
                title="Add group (+5 people)"
              >
                <span>+5 group</span>
              </Button>

              <Button
                variant="ghost"
                className="border border-line"
                onClick={handleReset}
                disabled={count === 0}
                aria-label="Reset count to 0"
                title="Reset attendee counter to zero"
              >
                <RotateCcw size={15} aria-hidden="true" />
                <span>Reset</span>
              </Button>
            </div>

            {/* Bottom Capacity & Meter Row */}
            <div className="mt-6 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <label
                  htmlFor={capacityInputId}
                  className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-muted"
                >
                  Capacity
                </label>
                <input
                  id={capacityInputId}
                  type="number"
                  min={1}
                  max={1000}
                  value={capacityInput}
                  onChange={handleCapacityChange}
                  onBlur={handleCapacityBlur}
                  aria-invalid={!!capacityError}
                  aria-describedby={capacityError ? `${capacityInputId}-err` : undefined}
                  className={cx(inputClass, 'w-28 tabular-nums')}
                />
              </div>

              <div
                className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2"
                role="progressbar"
                aria-valuenow={count}
                aria-valuemin={0}
                aria-valuemax={capacity}
                aria-label="Venue capacity occupancy percentage"
              >
                <div
                  className={cx('h-full rounded-full transition-all duration-500', barTone)}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <Badge tone={statusTone} className="self-start tabular-nums sm:self-auto">
                {status.label}
              </Badge>
            </div>

            {capacityError && (
              <p id={`${capacityInputId}-err`} className={errorClass} role="alert">
                {capacityError}
              </p>
            )}
          </Card>
        </div>

        <StateXray
          isOpen={xrayOn}
          stationName="Check-in"
          statePayload={statePayload}
          onClose={onToggleXray}
        />
      </div>
    </div>
  );
}
