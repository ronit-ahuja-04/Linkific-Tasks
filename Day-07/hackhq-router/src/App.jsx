import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import ProductDetail from './pages/swag/ProductDetail.jsx';
import Contact from './pages/Contact.jsx';
import ContactSent from './pages/ContactSent.jsx';
import NavPatterns from './pages/NavPatterns.jsx';
import Login from './pages/Login.jsx';
import OrganizerHome from './pages/organizer/OrganizerHome.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';

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

  // Demo organizer flag (PR-2). Persisted so a refresh keeps you signed in.
  const [isOrganizer, setIsOrganizer] = useLocalStorage('hackhq_organizer', false);
  const login = () => setIsOrganizer(true);
  const logout = () => setIsOrganizer(false);

  // Cart lifted here and persisted: /swag and /swag/:productId both read and update it
  const [cart, setCart] = useLocalStorage('hackhq_cart', []);

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
            isOrganizer={isOrganizer}
            onLogout={logout}
          />
        }
      >
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="directory/:userId?" element={<DirectoryPage />} />
        <Route
          path="clock"
          element={<ClockPage laps={laps} onAddLap={addLap} onClearLaps={clearLaps} />}
        />
        <Route path="patterns" element={<PatternsPage />} />
        <Route path="patterns/navigation" element={<NavPatterns />} />
        <Route path="checklist" element={<ChecklistStation {...stationProps} />} />
        <Route path="teams" element={<TeamsStation {...stationProps} />} />
        <Route path="swag">
          <Route index element={<SwagStation cart={cart} setCart={setCart} {...stationProps} />} />
          <Route
            path=":productId"
            element={<ProductDetail cart={cart} setCart={setCart} onNotify={notify} />}
          />
        </Route>
        <Route path="login" element={<Login isOrganizer={isOrganizer} onLogin={login} />} />
        {/* CONCEPT: Protected routes - one pathless guard wraps the whole /organizer area */}
        <Route element={<ProtectedRoute isAllowed={isOrganizer} />}>
          <Route path="organizer">
            <Route index element={<OrganizerHome onLogout={logout} />} />
            <Route path="checkin" element={<CheckInStation {...stationProps} />} />
            <Route path="lab" element={<StateLabStation {...stationProps} />} />
          </Route>
        </Route>
        <Route path="contact" element={<Contact onNotify={notify} />} />
        <Route path="contact/sent" element={<ContactSent />} />
        {/* CONCEPT: Declarative redirect - legacy URL, replaced so it never stays in history */}
        <Route path="shop" element={<Navigate to="/swag" replace />} />
        <Route path="checkin" element={<Navigate to="/organizer/checkin" replace />} />
        <Route path="lab" element={<Navigate to="/organizer/lab" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
