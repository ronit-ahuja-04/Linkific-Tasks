import { useState, useId } from 'react';
import { Plus, Minus, Users, RotateCcw, ShieldAlert, CheckCircle } from 'lucide-react';
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
      <div className="station-layout">
        <div className="station-workspace">
          <div className="station-header">
            <div className="station-title-group">
              <h1 className="station-title">Check-in</h1>
              <span className="station-subtitle">People inside the venue</span>
            </div>
            <div className="station-meta-badge">
              <span className={`status-badge tone-${status.tone}`}>
                {status.tone === 'alert' && <ShieldAlert size={14} aria-hidden="true" />}
                {status.tone === 'normal' && <CheckCircle size={14} aria-hidden="true" />}
                {status.label}
              </span>
            </div>
          </div>

          {/* Screen Reader Polite Live Region (CI-7) */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {count} of {capacity} inside venue. {status.label}.
          </div>

          <div className="checkin-board-card">
            <div className="board-label">Venue Occupancy</div>
            <SplitFlapBoard count={count} capacity={capacity} />
          </div>

          {/* Capacity Progress Bar with 80% & 100% Ticks (CI-4) */}
          <div className="capacity-bar-section">
            <div className="capacity-bar-header">
              <span className="capacity-bar-title">Capacity Meter</span>
              <span className="capacity-bar-stats tabular-nums">
                {count} / {capacity} ({percentage}%)
              </span>
            </div>

            <div
              className={`capacity-track tone-${status.tone}`}
              role="progressbar"
              aria-valuenow={count}
              aria-valuemin={0}
              aria-valuemax={capacity}
              aria-label="Venue capacity occupancy percentage"
            >
              <div
                className="capacity-fill"
                style={{ width: `${percentage}%` }}
              />
              <div
                className="capacity-tick tick-warning"
                style={{ left: '80%' }}
                title="80% Warning Threshold"
                aria-hidden="true"
              />
              <div
                className="capacity-tick tick-full"
                style={{ left: '100%' }}
                title="100% Full Capacity"
                aria-hidden="true"
              />
            </div>

            <div className="capacity-scale-labels" aria-hidden="true">
              <span>0% Empty</span>
              <span className="tick-label-80">80% Warning</span>
              <span>100% Max</span>
            </div>
          </div>

          {/* Counter Controls Grid (CI-2) */}
          <div className="counter-controls-panel">
            <div className="controls-group primary-controls">
              <button
                type="button"
                className="btn btn-decrement"
                onClick={handleDecrement}
                disabled={count === 0}
                aria-label="Decrement count by 1"
                title="Decrease people count by 1"
              >
                <Minus size={18} aria-hidden="true" />
                <span>-1</span>
              </button>

              <button
                type="button"
                className="btn btn-increment btn-primary"
                onClick={handleIncrement}
                disabled={count >= capacity}
                aria-label="Increment count by 1"
                title={count >= capacity ? 'Venue is at maximum capacity' : 'Add 1 person'}
              >
                <Plus size={18} aria-hidden="true" />
                <span>+1 Check-in</span>
              </button>

              <button
                type="button"
                className="btn btn-group-add"
                onClick={handleGroupIncrement}
                disabled={count >= capacity}
                aria-label="Increment count by 5 for a group"
                title="Add group (+5 people)"
              >
                <Users size={18} aria-hidden="true" />
                <span>+5 Group</span>
              </button>

              <button
                type="button"
                className="btn btn-reset"
                onClick={handleReset}
                disabled={count === 0}
                aria-label="Reset count to 0"
                title="Reset attendee counter to zero"
              >
                <RotateCcw size={16} aria-hidden="true" />
                <span>Reset</span>
              </button>
            </div>

            {/* Controlled Capacity Input (CI-3) */}
            <div className="capacity-input-row">
              <label htmlFor={capacityInputId} className="capacity-input-label">
                Venue Max Capacity:
              </label>
              <div className="capacity-input-wrap">
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
                  className={`capacity-input tabular-nums ${capacityError ? 'input-error' : ''}`}
                />
                <span className="capacity-unit-tag">people</span>
              </div>
              {capacityError && (
                <p id={`${capacityInputId}-err`} className="capacity-error-message" role="alert">
                  {capacityError}
                </p>
              )}
            </div>
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
