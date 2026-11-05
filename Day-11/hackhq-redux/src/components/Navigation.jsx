import { useRef } from 'react';
import { NavLink } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { X } from 'lucide-react';
import { STATIONS } from '../data/stations.js';
import { Badge, Eyebrow, IconButton, PulseDot } from './ui.jsx';
import { useModalBehavior } from './ContentModal.jsx';

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  gap: 0.25rem;
`;
const Link = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  font-weight: 500;
  text-decoration: none;
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.muted};
  transition:
    background-color 0.15s,
    color 0.15s;
  &:hover {
    color: ${({ theme }) => theme.colors.ink};
  }
  &.active {
    color: ${({ theme }) => theme.colors.ink};
    background: ${({ theme }) => theme.colors.surface2};
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 1px;
  }
`;
const IconBox = styled.span`
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme, $active }) => ($active ? theme.colors.brand : theme.colors.surface2)};
  color: ${({ theme, $active }) => ($active ? theme.colors.onBrand : 'inherit')};
`;
const Name = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const Unread = styled(Badge)`
  margin-left: auto;
`;
const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
`;

/**
 * CONCEPT: NavLink - knows whether its `to` matches the current URL and sets aria-current="page".
 * The same station list renders twice: as a sticky sidebar from `lg` up, and inside a
 * drawer below `lg` that AppLayout opens from the header button.
 */
function NavList({ onNavigate, badges = {} }) {
  return (
    <List>
      {STATIONS.map((station) => {
        const Icon = station.icon;

        return (
          <li key={station.id}>
            <Link
              to={station.path}
              // `end` stops "/" from matching every URL that starts with "/"
              end={station.path === '/'}
              onClick={onNavigate}
            >
              {({ isActive }) => (
                <>
                  <IconBox $active={isActive} aria-hidden="true">
                    <Icon size={16} />
                  </IconBox>
                  <Name>{station.name}</Name>
                  {badges[station.id] > 0 && (
                    <Unread $tone="accent">
                      {badges[station.id]}
                      <VisuallyHidden>
                        {' '}
                        {station.id === 'announcements' ? 'unread' : 'saved'}
                      </VisuallyHidden>
                    </Unread>
                  )}
                </>
              )}
            </Link>
          </li>
        );
      })}
    </List>
  );
}

const LiveBox = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.colors.line};
  background: ${({ theme }) => theme.colors.surface2};
  p {
    margin: 0;
  }
`;
const LiveTitle = styled.p`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.25rem !important;
`;
const LiveDate = styled.p`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.68rem;
  color: ${({ theme }) => theme.colors.muted};
`;

function LiveCard() {
  return (
    <LiveBox>
      <LiveTitle>
        <PulseDot />
        Live workspace
      </LiveTitle>
      <LiveDate>Saturday · 31 Oct 2026</LiveDate>
    </LiveBox>
  );
}

const SideNav = styled.nav`
  position: sticky;
  top: ${({ theme }) => theme.headerHeight};
  height: calc(100dvh - ${({ theme }) => theme.headerHeight});
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 1.5rem 0.5rem 1.5rem 0;
  ${Eyebrow} {
    margin-bottom: 0.5rem;
    padding: 0 0.5rem;
  }
`;

/** Desktop sidebar. AppLayout puts it in a column that only shows from `lg` up. */
export function Sidebar({ badges }) {
  return (
    <SideNav aria-label="Control room stations">
      <Eyebrow>Stations</Eyebrow>
      <NavList badges={badges} />
      <LiveCard />
    </SideNav>
  );
}

const slideIn = keyframes`from { transform: translateX(-100%); } to { transform: none; }`;
const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const Scrim = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1045;
  background: ${({ theme }) => theme.colors.overlay};
  animation: ${fadeIn} 0.2s ease-out both;
  ${({ theme }) => theme.media.up('lg')} {
    display: none;
  }
`;
const Drawer = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 18rem;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  outline: none;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.ink};
  border-right: 1px solid ${({ theme }) => theme.colors.line};
  animation: ${slideIn} 0.25s ease-out both;
`;
const DrawerHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  p {
    margin: 0;
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 0.875rem;
    letter-spacing: 0.18em;
  }
`;
const DrawerBody = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 1rem 1rem;
  overflow-y: auto;
  flex: 1;
`;

/** Mobile drawer: plain React handles the backdrop, focus trap and Escape. */
export function NavDrawer({ open, onClose, badges }) {
  if (!open) return null;
  return <DrawerInner onClose={onClose} badges={badges} />;
}

function DrawerInner({ onClose, badges }) {
  const ref = useRef(null);
  useModalBehavior(ref, onClose);

  return (
    <Scrim
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <Drawer
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nav-drawer-title"
        tabIndex={-1}
      >
        <DrawerHead>
          <p id="nav-drawer-title">STATIONS</p>
          <IconButton $variant="ghost" onClick={onClose} aria-label="Close navigation">
            <X size={18} aria-hidden="true" />
          </IconButton>
        </DrawerHead>
        <DrawerBody>
          <nav aria-label="Control room stations">
            <NavList onNavigate={onClose} badges={badges} />
          </nav>
          <LiveCard />
        </DrawerBody>
      </Drawer>
    </Scrim>
  );
}
