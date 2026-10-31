import { Outlet } from 'react-router-dom';
import Header from '../Header.jsx';
import Navigation from '../Navigation.jsx';
import ToastContainer from '../ToastContainer.jsx';
import { ViewportBadge } from './ViewportBadge.jsx';

/**
 * CONCEPT: Layout route - a parent route with no path of its own.
 * Header and sidebar stay mounted; the matched child page renders into <Outlet />.
 */
export default function AppLayout({
  theme,
  onToggleTheme,
  xrayOn,
  onToggleXray,
  toasts,
  onDismissToast,
}) {
  return (
    <div className={`hackhq-app ${theme}`}>
      <Header
        theme={theme}
        onToggleTheme={onToggleTheme}
        xrayOn={xrayOn}
        onToggleXray={onToggleXray}
      />

      <div className="hackhq-body">
        <Navigation />

        <main className="hackhq-main">
          <Outlet />
        </main>
      </div>

      <ToastContainer toasts={toasts} onDismiss={onDismissToast} />
      <ViewportBadge />
    </div>
  );
}
