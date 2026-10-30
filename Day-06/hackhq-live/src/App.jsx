import { useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import Header from './components/Header.jsx';
import Navigation from './components/Navigation.jsx';
import ToastContainer from './components/ToastContainer.jsx';
import { Directory } from './components/directory/Directory.jsx';
import { UserPosts } from './components/directory/UserPosts.jsx';
import { HackClock } from './components/clock/HackClock.jsx';
import { EffectPatterns } from './components/patterns/EffectPatterns.jsx';
import { ViewportBadge } from './components/layout/ViewportBadge.jsx';
import CheckInStation from './components/stations/CheckInStation.jsx';
import ChecklistStation from './components/stations/ChecklistStation.jsx';
import TeamsStation from './components/stations/TeamsStation.jsx';
import SwagStation from './components/stations/SwagStation.jsx';
import StateLabStation from './components/stations/StateLabStation.jsx';
import { STATION_NAMES } from './data/stations.js';

export default function App() {
  // Theme state persisted via useLocalStorage (LS-1)
  const [theme, setTheme] = useLocalStorage(
    'hackhq_theme',
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  );

  // Active station navigation state (SH-1) - defaults to 'directory' for Day 6
  const [activeStation, setActiveStation] = useState('directory');

  // Selected participant ID for live user-posts refetching (UP-1)
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Stopwatch laps persisted via useLocalStorage (LS-1, CK-2)
  const [laps, setLaps] = useLocalStorage('hackhq_laps', []);

  const addLap = (lap) => {
    setLaps((prev) => [lap, ...prev]);
  };

  const clearLaps = () => {
    setLaps([]);
  };

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
          {/* Directory & Posts Station (Day 6 - M1) */}
          <section
            id="panel-directory"
            role="tabpanel"
            aria-labelledby="tab-directory"
            hidden={activeStation !== 'directory'}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7">
                <Directory selectedUserId={selectedUserId} onSelectUser={setSelectedUserId} />
              </div>
              <div className="lg:col-span-5">
                <UserPosts userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
              </div>
            </div>
          </section>

          {/* Hack Clock Station (Day 6 - M3) */}
          <section
            id="panel-clock"
            role="tabpanel"
            aria-labelledby="tab-clock"
            hidden={activeStation !== 'clock'}
          >
            <div className="max-w-2xl mx-auto">
              <HackClock laps={laps} onAddLap={addLap} onClearLaps={clearLaps} />
            </div>
          </section>

          {/* Effect Patterns Station (Day 6 - M5) */}
          <section
            id="panel-patterns"
            role="tabpanel"
            aria-labelledby="tab-patterns"
            hidden={activeStation !== 'patterns'}
          >
            <EffectPatterns />
          </section>

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
      <ViewportBadge />
    </div>
  );
}
