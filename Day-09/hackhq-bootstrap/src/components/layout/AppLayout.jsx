import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header.jsx';
import { Container, Row, Col } from 'react-bootstrap';
import { Sidebar, NavDrawer } from '../Navigation.jsx';
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
  unreadAnnouncements = 0,
}) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  // Bootstrap 5.3 colour modes read `data-bs-theme` on <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
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

  const badges = { announcements: unreadAnnouncements };

  return (
    <div className="min-vh-100 d-flex flex-column">
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

      <NavDrawer open={navOpen} onClose={() => setNavOpen(false)} badges={badges} />

      {/* CONCEPT: Grid - the sidebar takes 3 of 12 columns at lg, 2 at xl; main takes the rest. */}
      <Container fluid className="app-shell flex-grow-1 px-sm-3">
        <Row>
          <Col lg={3} xl={3} xxl={2} className="d-none d-lg-block">
            <Sidebar badges={badges} />
          </Col>
          <Col as="main" lg={9} xl={9} xxl={10} className="px-3 px-sm-4 py-4 py-lg-5">
            <Outlet />
          </Col>
        </Row>
      </Container>

      <Footer />

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
      <ToastContainer toasts={toasts} onDismiss={onDismissToast} />
      <ViewportBadge />
    </div>
  );
}
