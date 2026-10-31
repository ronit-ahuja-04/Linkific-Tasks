import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import AppLayout from './components/layout/AppLayout.jsx';
import CheckInStation from './components/stations/CheckInStation.jsx';
import ChecklistStation from './components/stations/ChecklistStation.jsx';
import TeamsStation from './components/stations/TeamsStation.jsx';
import SwagStation from './components/stations/SwagStation.jsx';
import StateLabStation from './components/stations/StateLabStation.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import NotFound from './pages/NotFound.jsx';
import DirectoryPage from './pages/stations/DirectoryPage.jsx';
import ClockPage from './pages/stations/ClockPage.jsx';
import PatternsPage from './pages/stations/PatternsPage.jsx';

export default function App() {
  // Theme state persisted via useLocalStorage (LS-1)
  const [theme, setTheme] = useLocalStorage(
    'hackhq_theme',
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  );

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

  // Props shared by the Day 5 stations
  const stationProps = { xrayOn, onToggleXray: toggleXray, onNotify: notify };

  // CONCEPT: Routes picks the single best-matching Route; only that page is mounted
  return (
    <Routes>
      <Route
        element={
          <AppLayout
            theme={theme}
            onToggleTheme={toggleTheme}
            xrayOn={xrayOn}
            onToggleXray={toggleXray}
            toasts={toasts}
            onDismissToast={dismissToast}
          />
        }
      >
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="directory" element={<DirectoryPage />} />
        <Route
          path="clock"
          element={<ClockPage laps={laps} onAddLap={addLap} onClearLaps={clearLaps} />}
        />
        <Route path="patterns" element={<PatternsPage />} />
        <Route path="checkin" element={<CheckInStation {...stationProps} />} />
        <Route path="checklist" element={<ChecklistStation {...stationProps} />} />
        <Route path="teams" element={<TeamsStation {...stationProps} />} />
        <Route path="swag" element={<SwagStation {...stationProps} />} />
        <Route path="lab" element={<StateLabStation {...stationProps} />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
