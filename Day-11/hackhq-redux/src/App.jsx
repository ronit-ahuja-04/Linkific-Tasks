import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { selectThemeMode, toggleTheme } from './store/slices/themeSlice.js';
import { login, logout, selectIsOrganizer } from './store/slices/authSlice.js';
import { selectUnreadCount } from './store/slices/announcementsSlice.js';
import { notify } from './store/slices/toastsSlice.js';
import { selectXrayOn, toggleXray } from './store/slices/uiSlice.js';
import { themes } from './styles/theme.js';
import { GlobalStyle } from './styles/GlobalStyle.js';
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
import Sponsors from './pages/Sponsors.jsx';
import Contact from './pages/Contact.jsx';
import ContactSent from './pages/ContactSent.jsx';
import NavPatterns from './pages/NavPatterns.jsx';
import Login from './pages/Login.jsx';
import OrganizerHome from './pages/organizer/OrganizerHome.jsx';
import Announcements from './pages/Announcements.jsx';
import Schedule from './pages/Schedule.jsx';
import UiKit from './pages/UiKit.jsx';
import Wishlist from './pages/Wishlist.jsx';
import Activity from './pages/Activity.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';

export default function App() {
  // REDUX: useSelector subscribes this component to one slice of the store; it re-renders only
  // when that value changes. useDispatch returns the function that sends actions to the store.
  const dispatch = useDispatch();
  const theme = useSelector(selectThemeMode);
  const isOrganizer = useSelector(selectIsOrganizer);
  const unreadAnnouncements = useSelector(selectUnreadCount);
  const xrayOn = useSelector(selectXrayOn);

  // Props still passed to the stations that have not moved to hooks yet
  const stationProps = {
    xrayOn,
    onToggleXray: () => dispatch(toggleXray()),
    onNotify: (message, action, type) => dispatch(notify(message, action, type)),
  };
  const onNotify = stationProps.onNotify;

  // CONCEPT: Routes picks the single best-matching Route; only that page is mounted
  return (
    <ThemeProvider theme={themes[theme] ?? themes.light}>
      <GlobalStyle />
      <Routes>
        <Route
          element={
            <AppLayout
              theme={theme}
              onToggleTheme={() => dispatch(toggleTheme())}
              xrayOn={xrayOn}
              onToggleXray={stationProps.onToggleXray}
              isOrganizer={isOrganizer}
              onLogout={() => dispatch(logout())}
              unreadAnnouncements={unreadAnnouncements}
            />
          }
        >
          <Route index element={<Home />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="kit" element={<UiKit />} />
          <Route path="about" element={<About />} />
          <Route path="directory/:userId?" element={<DirectoryPage />} />
          <Route path="clock" element={<ClockPage />} />
          <Route path="patterns" element={<PatternsPage />} />
          <Route path="patterns/navigation" element={<NavPatterns />} />
          <Route path="checklist" element={<ChecklistStation />} />
          <Route path="teams" element={<TeamsStation {...stationProps} />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="activity" element={<Activity />} />
          <Route path="swag">
            <Route index element={<SwagStation />} />
            <Route path=":productId" element={<ProductDetail />} />
          </Route>
          <Route
            path="login"
            element={<Login isOrganizer={isOrganizer} onLogin={() => dispatch(login())} />}
          />
          {/* CONCEPT: Protected routes - one pathless guard wraps the whole /organizer area */}
          <Route element={<ProtectedRoute isAllowed={isOrganizer} />}>
            <Route path="organizer">
              <Route index element={<OrganizerHome onLogout={() => dispatch(logout())} />} />
              <Route path="checkin" element={<CheckInStation {...stationProps} />} />
              <Route path="lab" element={<StateLabStation {...stationProps} />} />
            </Route>
          </Route>
          <Route path="sponsors" element={<Sponsors />} />
          <Route path="contact" element={<Contact onNotify={onNotify} />} />
          <Route path="contact/sent" element={<ContactSent />} />
          {/* CONCEPT: Declarative redirect - legacy URL, replaced so it never stays in history */}
          <Route path="shop" element={<Navigate to="/swag" replace />} />
          <Route path="checkin" element={<Navigate to="/organizer/checkin" replace />} />
          <Route path="lab" element={<Navigate to="/organizer/lab" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}
