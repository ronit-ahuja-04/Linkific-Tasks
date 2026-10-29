import { useState, useId } from 'react';
import { Plus, RotateCcw, Ticket } from 'lucide-react';
import SplitFlapBoard from './SplitFlapBoard.jsx';
import StateXray from '../StateXray.jsx';
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

  return (
    <div className="station-view station-checkin">
      <div className="station-breadcrumb">CONTROL ROOM / CHECKIN</div>

      <div className="station-header">
        <div className="station-title-row">
          <h1 className="station-title">Check-in</h1>
          <span className="live-status-pill">
            <span className="pulse-dot" aria-hidden="true" />
            <span>Live</span>
          </span>
        </div>
      </div>

      <div className="station-layout">
        <div className="station-workspace">
          {/* Screen Reader Polite Live Region (CI-7) */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {count} of {capacity} inside venue. {status.label}.
          </div>

          {/* Unified Primary Card: People inside (Matches v0 Baseline Spec) */}
          <div className="station-primary-card">
            <div className="card-top-bar">
              <div className="card-heading-group">
                <h2 className="card-title">People inside</h2>
                <p className="card-subtitle">Keep a live count of everyone in the venue.</p>
              </div>
              <div className="card-icon-badge" aria-hidden="true">
                <Ticket size={20} />
              </div>
            </div>

            {/* Split-Flap Display */}
            <div className="counter-board-wrap">
              <SplitFlapBoard count={count} capacity={capacity} />
            </div>

            {/* Action Buttons Row */}
            <div className="counter-buttons-row">
              <button
                type="button"
                className="btn btn-pill-action"
                onClick={handleDecrement}
                disabled={count === 0}
                aria-label="Decrement count by 1"
                title="Decrease people count by 1"
              >
                <span>-1</span>
              </button>

              <button
                type="button"
                className="btn btn-pill-action btn-hero-increment"
                onClick={handleIncrement}
                disabled={count >= capacity}
                aria-label="Increment count by 1"
                title={count >= capacity ? 'Venue is at maximum capacity' : 'Add 1 person'}
              >
                <Plus size={16} aria-hidden="true" />
                <span>1</span>
              </button>

              <button
                type="button"
                className="btn btn-pill-action"
                onClick={handleGroupIncrement}
                disabled={count >= capacity}
                aria-label="Increment count by 5 for a group"
                title="Add group (+5 people)"
              >
                <span>+5 group</span>
              </button>

              <button
                type="button"
                className="btn btn-pill-action"
                onClick={handleReset}
                disabled={count === 0}
                aria-label="Reset count to 0"
                title="Reset attendee counter to zero"
              >
                <RotateCcw size={15} aria-hidden="true" />
                <span>Reset</span>
              </button>
            </div>

            {/* Bottom Capacity & Meter Row */}
            <div className="counter-meter-row">
              <div className="capacity-input-group">
                <label htmlFor={capacityInputId} className="capacity-label">Capacity</label>
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
                  className={`capacity-pill-input ${capacityError ? 'input-error' : ''}`}
                />
              </div>

              <div
                className={`capacity-pill-bar tone-${status.tone}`}
                role="progressbar"
                aria-valuenow={count}
                aria-valuemin={0}
                aria-valuemax={capacity}
                aria-label="Venue capacity occupancy percentage"
              >
                <div
                  className="capacity-pill-fill"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <span className="capacity-status-text tabular-nums">
                {status.label}
              </span>
            </div>

            {capacityError && (
              <p id={`${capacityInputId}-err`} className="capacity-error-message" role="alert">
                {capacityError}
              </p>
            )}
          </div>
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
