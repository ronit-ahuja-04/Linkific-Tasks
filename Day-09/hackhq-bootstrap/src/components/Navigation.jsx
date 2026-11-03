import { NavLink } from 'react-router-dom';
import { Nav, Offcanvas } from 'react-bootstrap';
import { STATIONS } from '../data/stations.js';
import { Eyebrow, PulseDot, cx } from './ui.jsx';

/**
 * CONCEPT: NavLink - knows whether its `to` matches the current URL and sets aria-current="page".
 * The same station list renders twice: as a sticky sidebar from `lg` up, and inside an
 * Offcanvas drawer below `lg` that AppLayout opens from the header button.
 */
function NavList({ onNavigate }) {
  return (
    <Nav as="ul" variant="pills" className="flex-column gap-1 flex-nowrap">
      {STATIONS.map((station) => {
        const Icon = station.icon;

        return (
          <li key={station.id} className="nav-item">
            <NavLink
              to={station.path}
              // `end` stops "/" from matching every URL that starts with "/"
              end={station.path === '/'}
              onClick={onNavigate}
              className={({ isActive }) =>
                cx(
                  'nav-link d-flex align-items-center gap-3 fw-medium',
                  isActive ? 'active' : 'text-body-secondary'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cx('d-grid rounded-2', isActive ? 'bg-brand' : 'bg-body-secondary')}
                    style={{ width: '2rem', height: '2rem', placeItems: 'center' }}
                    aria-hidden="true"
                  >
                    <Icon size={16} />
                  </span>
                  <span className="text-truncate">{station.name}</span>
                </>
              )}
            </NavLink>
          </li>
        );
      })}
    </Nav>
  );
}

function LiveCard() {
  return (
    <div className="mt-3 rounded-4 border bg-body-tertiary p-3">
      <p className="d-flex align-items-center gap-2 small fw-semibold mb-1">
        <PulseDot />
        Live workspace
      </p>
      <p className="mb-0 font-monospace text-body-secondary" style={{ fontSize: '0.68rem' }}>
        Saturday · 31 Oct 2026
      </p>
    </div>
  );
}

/** Desktop sidebar. AppLayout puts it in a column that only shows from `lg` up. */
export function Sidebar() {
  return (
    <nav
      aria-label="Control room stations"
      className="app-sidebar sticky-top d-flex flex-column overflow-y-auto py-4 pe-3"
    >
      <Eyebrow className="mb-2 px-2">Stations</Eyebrow>
      <NavList />
      <LiveCard />
    </nav>
  );
}

/** Mobile drawer: React Bootstrap's Offcanvas handles the backdrop, focus trap and Escape. */
export function NavDrawer({ open, onClose }) {
  return (
    <Offcanvas
      show={open}
      onHide={onClose}
      placement="start"
      className="app-drawer d-lg-none"
      aria-labelledby="nav-drawer-title"
    >
      <Offcanvas.Header closeButton closeLabel="Close navigation">
        <Offcanvas.Title as="p" id="nav-drawer-title" className="small font-monospace ls-wider">
          STATIONS
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body className="d-flex flex-column pt-0">
        <nav aria-label="Control room stations">
          <NavList onNavigate={onClose} />
        </nav>
        <LiveCard />
      </Offcanvas.Body>
    </Offcanvas>
  );
}
