import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header.jsx';
import Navigation from '../Navigation.jsx';
import ToastContainer from '../ToastContainer.jsx';
import { ViewportBadge } from './ViewportBadge.jsx';
import CommandPalette from './CommandPalette.jsx';

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
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Global ⌘K / Ctrl+K shortcut, subscribed once and removed on unmount
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`hackhq-app ${theme}`}>
      <Header
        theme={theme}
        onToggleTheme={onToggleTheme}
        xrayOn={xrayOn}
        onToggleXray={onToggleXray}
        onOpenPalette={() => setPaletteOpen(true)}
      />

      <div className="hackhq-body">
        <Navigation />

        <main className="hackhq-main">
          <Outlet />
        </main>
      </div>

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
      <ToastContainer toasts={toasts} onDismiss={onDismissToast} />
      <ViewportBadge />
    </div>
  );
}
