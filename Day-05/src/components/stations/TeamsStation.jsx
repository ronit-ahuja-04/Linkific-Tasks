import { useState } from 'react';
import StateXray from '../StateXray.jsx';

export default function TeamsStation({ xrayOn, onToggleXray, onNotify: _onNotify }) {
  const [form, _setForm] = useState({
    teamName: '',
    track: 'ai-ml',
    members: [{ id: '1', name: '', role: 'Lead' }],
    contact: { email: '', phone: '', city: '' },
    interests: [],
    agreed: false,
  });
  const [registeredTeams, _setRegisteredTeams] = useState([]);

  const statePayload = {
    form,
    registeredTeamsCount: registeredTeams.length,
    registeredTeams,
  };

  return (
    <div className="station-view station-teams">
      <div className="station-layout">
        <div className="station-workspace">
          <div className="station-header">
            <div className="station-title-group">
              <h1 className="station-title">Teams</h1>
              <span className="station-subtitle">Team registration & badge preview</span>
            </div>
          </div>
          <div className="station-body">
            <p className="station-placeholder-text">
              Teams station initialized. Ready for Milestone 3 (Multi-field form, validation, and live badge preview).
            </p>
          </div>
        </div>

        <StateXray
          isOpen={xrayOn}
          stationName="Teams"
          statePayload={statePayload}
          onClose={onToggleXray}
        />
      </div>
    </div>
  );
}
