import { useState } from 'react';
import StateXray from '../StateXray.jsx';

export default function CheckInStation({ xrayOn, onToggleXray, onNotify: _onNotify }) {
  const [count, _setCount] = useState(0);
  const [capacity, _setCapacity] = useState(200);

  const percentage = Math.round((count / capacity) * 100);
  const status =
    count >= capacity
      ? 'Full'
      : count >= Math.round(capacity * 0.8)
      ? 'Nearly full'
      : 'Plenty of room';

  const statePayload = {
    count,
    capacity,
    percentage: isNaN(percentage) ? 0 : percentage,
    status,
  };

  return (
    <div className="station-view station-checkin">
      <div className="station-layout">
        <div className="station-workspace">
          <div className="station-header">
            <div className="station-title-group">
              <h1 className="station-title">Check-in</h1>
              <span className="station-subtitle">People inside venue</span>
            </div>
          </div>
          <div className="station-body">
            <p className="station-placeholder-text">
              Check-in station initialized. Ready for Milestone 1 (Split-flap board and capacity controls).
            </p>
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
