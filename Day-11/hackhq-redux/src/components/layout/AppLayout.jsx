import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header.jsx';
import styled from 'styled-components';
import { Sidebar, NavDrawer } from '../Navigation.jsx';
import ToastContainer from '../ToastContainer.jsx';
import { ViewportBadge } from './ViewportBadge.jsx';
import CommandPalette from './CommandPalette.jsx';
import Footer from './Footer.jsx';

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;
const Shell = styled.div`
  flex-grow: 1;
  width: 100%;
  max-width: 90rem;
  margin: 0 auto;
  padding: 0 0.75rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  ${({ theme }) => theme.media.up('sm')} {
    padding: 0 0.75rem;
  }
  ${({ theme }) => theme.media.up('lg')} {
    grid-template-columns: 25% minmax(0, 1fr);
    padding: 0 1rem;
  }
  ${({ theme }) => theme.media.up('xl')} {
    grid-template-columns: 25% minmax(0, 1fr);
  }
  ${({ theme }) => theme.media.up('xxl')} {
    grid-template-columns: 16.6667% minmax(0, 1fr);
  }
`;
const SideCol = styled.div`
  display: none;
  min-width: 0;
  ${({ theme }) => theme.media.up('lg')} {
    display: block;
    padding: 0 0.75rem;
  }
`;
const Main = styled.main`
  min-width: 0;
  padding: 1.5rem 1rem;
  ${({ theme }) => theme.media.up('sm')} {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
  ${({ theme }) => theme.media.up('lg')} {
    padding-top: 3rem;
    padding-bottom: 3rem;
  }
`;

/**
 * CONCEPT: Layout route - a parent route with no path of its own.
 * Header and sidebar stay mounted; the matched child page renders into <Outlet />.
 */
export default function AppLayout({
  theme,
  onToggleTheme,
  xrayOn,
  onToggleXray,
  isOrganizer,
  onLogout,
  unreadAnnouncements = 0,
}) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  // Keep a data-theme attribute on <html> for the pre-paint script in index.html
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
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
    <Page>
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

      {/* CONCEPT: Grid - the sidebar takes a fixed share at lg and up; main takes the rest. */}
      <Shell>
        <SideCol>
          <Sidebar badges={badges} />
        </SideCol>
        <Main>
          <Outlet />
        </Main>
      </Shell>

      <Footer />

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
      <ToastContainer />
      <ViewportBadge />
    </Page>
  );
}
