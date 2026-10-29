import { useState } from 'react';
import StateXray from '../StateXray.jsx';

export default function ChecklistStation({ xrayOn, onToggleXray, onNotify: _onNotify }) {
  const [tasks, _setTasks] = useState([]);
  const [filter, _setFilter] = useState('all');

  const statePayload = {
    tasksCount: tasks.length,
    filter,
    tasks,
  };

  return (
    <div className="station-view station-checklist">
      <div className="station-layout">
        <div className="station-workspace">
          <div className="station-header">
            <div className="station-title-group">
              <h1 className="station-title">Checklist</h1>
              <span className="station-subtitle">Setup tasks for the day</span>
            </div>
          </div>
          <div className="station-body">
            <p className="station-placeholder-text">
              Checklist station initialized. Ready for Milestone 2 (Todo list, filter tabs, undo, and confetti).
            </p>
          </div>
        </div>

        <StateXray
          isOpen={xrayOn}
          stationName="Checklist"
          statePayload={statePayload}
          onClose={onToggleXray}
        />
      </div>
    </div>
  );
}
