import { useState, useId } from 'react';
import { Plus, RotateCcw, Ticket } from 'lucide-react';
import SplitFlapBoard from './SplitFlapBoard.jsx';
import StateXray from '../StateXray.jsx';
import PageHeader from '../layout/PageHeader.jsx';
import { Form, ProgressBar, Row, Col } from 'react-bootstrap';
import { Badge, Button, Card } from '../ui.jsx';
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

  const barVariant =
    status.tone === 'alert' ? 'danger' : status.tone === 'warning' ? 'warning' : 'success';
  const statusTone = status.tone === 'alert' ? 'bad' : status.tone === 'warning' ? 'warn' : 'good';

  return (
    <div>
      <PageHeader breadcrumb="Checkin" title="Check-in" pill="Live" />

      <div className="d-flex flex-column flex-lg-row align-items-lg-start gap-4">
        <div className="flex-grow-1 min-w-0">
          {/* Screen Reader Polite Live Region (CI-7) */}
          <div className="visually-hidden" aria-live="polite" aria-atomic="true">
            {count} of {capacity} inside venue. {status.label}.
          </div>

          {/* Unified Primary Card: People inside (Matches v0 Baseline Spec) */}
          <Card className="animate-rise p-3 p-sm-4">
            <div className="mb-4 d-flex align-items-start justify-content-between gap-3">
              <div>
                <h2 className="fs-4 fw-bold mb-1">People inside</h2>
                <p className="small text-body-secondary mb-0">
                  Keep a live count of everyone in the venue.
                </p>
              </div>
              <div
                className="d-flex flex-shrink-0 align-items-center justify-content-center rounded-3 bg-primary-subtle text-primary-emphasis"
                style={{ width: '2.75rem', height: '2.75rem' }}
                aria-hidden="true"
              >
                <Ticket size={20} />
              </div>
            </div>

            {/* Split-Flap Display */}
            <div className="d-flex justify-content-center overflow-x-auto rounded-4 p-3 p-sm-4 panel-board">
              <SplitFlapBoard count={count} capacity={capacity} />
            </div>

            {/* Action Buttons Row */}
            <Row className="row-cols-2 row-cols-sm-4 g-2 mt-3">
              <Col className="d-grid">
                <Button
                  variant="secondary"
                  onClick={handleDecrement}
                  disabled={count === 0}
                  aria-label="Decrement count by 1"
                  title="Decrease people count by 1"
                >
                  <span>-1</span>
                </Button>
              </Col>

              <Col className="d-grid">
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
              </Col>

              <Col className="d-grid">
                <Button
                  variant="secondary"
                  onClick={handleGroupIncrement}
                  disabled={count >= capacity}
                  aria-label="Increment count by 5 for a group"
                  title="Add group (+5 people)"
                >
                  <span>+5 group</span>
                </Button>
              </Col>

              <Col className="d-grid">
                <Button
                  variant="ghost"
                  className="border"
                  onClick={handleReset}
                  disabled={count === 0}
                  aria-label="Reset count to 0"
                  title="Reset attendee counter to zero"
                >
                  <RotateCcw size={15} aria-hidden="true" />
                  <span>Reset</span>
                </Button>
              </Col>
            </Row>

            {/* Bottom Capacity & Meter Row */}
            <div className="mt-4 d-flex flex-column flex-sm-row align-items-sm-center gap-3 border-top pt-4">
              <Form.Group className="d-flex align-items-center gap-3">
                <Form.Label
                  htmlFor={capacityInputId}
                  className="mb-0 small font-monospace fw-medium text-uppercase ls-wider text-body-secondary"
                >
                  Capacity
                </Form.Label>
                <Form.Control
                  id={capacityInputId}
                  type="number"
                  min={1}
                  max={1000}
                  value={capacityInput}
                  onChange={handleCapacityChange}
                  onBlur={handleCapacityBlur}
                  isInvalid={!!capacityError}
                  aria-invalid={!!capacityError}
                  aria-describedby={capacityError ? `${capacityInputId}-err` : undefined}
                  className="font-monospace"
                  style={{ width: '7rem' }}
                />
              </Form.Group>

              <ProgressBar
                className="flex-grow-1"
                style={{ height: '0.625rem' }}
                variant={barVariant}
                now={count}
                min={0}
                max={capacity}
                aria-label="Venue capacity occupancy percentage"
              />

              <Badge tone={statusTone} className="align-self-start align-self-sm-auto">
                {status.label}
              </Badge>
            </div>

            {capacityError && (
              <Form.Control.Feedback
                type="invalid"
                id={`${capacityInputId}-err`}
                role="alert"
                className="d-block fw-medium mt-2"
              >
                {capacityError}
              </Form.Control.Feedback>
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
