import { useState } from 'react';
import Header from './components/Header.jsx';
import Navigation from './components/Navigation.jsx';
import ToastContainer from './components/ToastContainer.jsx';
import CheckInStation from './components/stations/CheckInStation.jsx';
import ChecklistStation from './components/stations/ChecklistStation.jsx';
import TeamsStation from './components/stations/TeamsStation.jsx';
import SwagStation from './components/stations/SwagStation.jsx';
import StateLabStation from './components/stations/StateLabStation.jsx';
import { STATION_NAMES } from './data/stations.js';

export default function App() {
  // Theme state with lazy initializer reading OS preference (TH-2)
  const [theme, setTheme] = useState(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
    return 'light';
  });

  // Active station navigation state (SH-1)
  const [activeStation, setActiveStation] = useState('checkin');

  // State X-ray live inspector toggle (LB-1)
  const [xrayOn, setXrayOn] = useState(false);

  // Toasts array state (SH-3) - max 3 visible, auto-dismiss via setTimeout in handler
  const [toasts, setToasts] = useState([]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const toggleXray = () => {
    setXrayOn((prev) => !prev);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  /**
   * onNotify callback passed down to all stations (SH-3)
   * Handled purely via event callback with setTimeout; zero lifecycle effects.
   */
  const notify = (message, action = null, type = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    const newToast = { id, message, action, type };

    setToasts((prev) => {
      // Keep at most 3 visible; prepend newest
      const updated = [newToast, ...prev];
      return updated.slice(0, 3);
    });

    // Auto-dismiss after 4.5 seconds
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  return (
    <div className={`hackhq-app ${theme}`}>
      <Header
        activeStation={activeStation}
        stationNames={STATION_NAMES}
        theme={theme}
        onToggleTheme={toggleTheme}
        xrayOn={xrayOn}
        onToggleXray={toggleXray}
      />

      <div className="hackhq-body">
        <Navigation activeStation={activeStation} onSelectStation={setActiveStation} />

        <main className="hackhq-main">
          {/* Check-in Station (SH-1: hidden preserves state) */}
          <section
            id="panel-checkin"
            role="tabpanel"
            aria-labelledby="tab-checkin"
            hidden={activeStation !== 'checkin'}
          >
            <CheckInStation xrayOn={xrayOn} onToggleXray={toggleXray} onNotify={notify} />
          </section>

          {/* Checklist Station */}
          <section
            id="panel-checklist"
            role="tabpanel"
            aria-labelledby="tab-checklist"
            hidden={activeStation !== 'checklist'}
          >
            <ChecklistStation xrayOn={xrayOn} onToggleXray={toggleXray} onNotify={notify} />
          </section>

          {/* Teams Station */}
          <section
            id="panel-teams"
            role="tabpanel"
            aria-labelledby="tab-teams"
            hidden={activeStation !== 'teams'}
          >
            <TeamsStation xrayOn={xrayOn} onToggleXray={toggleXray} onNotify={notify} />
          </section>

          {/* Swag Shop Station */}
          <section
            id="panel-swag"
            role="tabpanel"
            aria-labelledby="tab-swag"
            hidden={activeStation !== 'swag'}
          >
            <SwagStation xrayOn={xrayOn} onToggleXray={toggleXray} onNotify={notify} />
          </section>

          {/* State Lab Station */}
          <section
            id="panel-lab"
            role="tabpanel"
            aria-labelledby="tab-lab"
            hidden={activeStation !== 'lab'}
          >
            <StateLabStation xrayOn={xrayOn} onToggleXray={toggleXray} onNotify={notify} />
          </section>
        </main>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
