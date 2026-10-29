import { useState } from 'react';
import StateXray from '../StateXray.jsx';

export default function SwagStation({ xrayOn, onToggleXray, onNotify: _onNotify }) {
  const [cart, _setCart] = useState([]);
  const [appliedCoupon, _setAppliedCoupon] = useState(null);

  const statePayload = {
    cartCount: cart.length,
    cart,
    appliedCoupon,
  };

  return (
    <div className="station-view station-swag">
      <div className="station-layout">
        <div className="station-workspace">
          <div className="station-header">
            <div className="station-title-group">
              <h1 className="station-title">Swag shop</h1>
              <span className="station-subtitle">Pop-up merchandise & thermal receipt</span>
            </div>
          </div>
          <div className="station-body">
            <p className="station-placeholder-text">
              Swag shop initialized. Ready for Milestone 4 (Products catalog, cart limits, and receipt).
            </p>
          </div>
        </div>

        <StateXray
          isOpen={xrayOn}
          stationName="Swag shop"
          statePayload={statePayload}
          onClose={onToggleXray}
        />
      </div>
    </div>
  );
}
