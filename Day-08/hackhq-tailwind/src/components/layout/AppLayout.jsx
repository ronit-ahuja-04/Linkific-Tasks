import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header.jsx';
import Navigation from '../Navigation.jsx';
import ToastContainer from '../ToastContainer.jsx';
import { ViewportBadge } from './ViewportBadge.jsx';
import CommandPalette from './CommandPalette.jsx';
import Footer from './Footer.jsx';

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
  isOrganizer,
  onLogout,
}) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  // Tailwind's class-based dark mode reads `.dark` on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

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
    <div className="min-h-dvh bg-bg text-ink">
      <Header
        theme={theme}
        onToggleTheme={onToggleTheme}
        xrayOn={xrayOn}
        onToggleXray={onToggleXray}
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenNav={() => setNavOpen(true)}
        isOrganizer={isOrganizer}
        onLogout={onLogout}
      />

      <div className="mx-auto flex max-w-[90rem]">
        <Navigation open={navOpen} onClose={() => setNavOpen(false)} />

        <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:py-10">
          <Outlet />
        </main>
      </div>

      <Footer />

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
      <ToastContainer toasts={toasts} onDismiss={onDismissToast} />
      <ViewportBadge />
    </div>
  );
}
