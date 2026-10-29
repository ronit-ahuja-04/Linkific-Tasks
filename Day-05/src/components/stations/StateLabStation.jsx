import { useState } from 'react';
import StateXray from '../StateXray.jsx';

export default function StateLabStation({ xrayOn, onToggleXray, onNotify: _onNotify }) {
  const [mutateCount, _setMutateCount] = useState(0);
  const [batchCount, _setBatchCount] = useState(0);

  const statePayload = {
    mutateCount,
    batchCount,
  };

  return (
    <div className="station-view station-lab">
      <div className="station-layout">
        <div className="station-workspace">
          <div className="station-header">
            <div className="station-title-group">
              <h1 className="station-title">State lab</h1>
              <span className="station-subtitle">Interactive state mutation & batching experiments</span>
            </div>
          </div>
          <div className="station-body">
            <p className="station-placeholder-text">
              State lab initialized. Ready for Milestone 5 (Mutation demo and batching snapshot demo).
            </p>
          </div>
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
