import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { STATIONS } from '../data/stations.js';
import { PulseDot, cx } from './ui.jsx';

/**
 * CONCEPT: NavLink - knows whether its `to` matches the current URL and sets aria-current="page".
 * Desktop: a sticky sidebar. Below `lg`: an off-canvas drawer controlled by AppLayout.
 */
export default function Navigation({ open, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cx(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <nav
        aria-label="Control room stations"
        className={cx(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col gap-1 border-r border-line bg-surface p-4 transition-transform duration-300',
          'lg:sticky lg:top-16 lg:z-10 lg:h-[calc(100dvh-4rem)] lg:w-64 lg:shrink-0 lg:translate-x-0 lg:bg-transparent',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="mb-2 flex items-center justify-between px-2 lg:mb-1">
          <p className="font-mono text-[0.68rem] font-medium tracking-[0.2em] text-muted">
            STATIONS
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-2 lg:hidden"
            aria-label="Close navigation"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <ul className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {STATIONS.map((station) => {
            const Icon = station.icon;

            return (
              <li key={station.id}>
                <NavLink
                  to={station.path}
                  // `end` stops "/" from matching every URL that starts with "/"
                  end={station.path === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cx(
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                      isActive
                        ? 'bg-ink text-bg shadow-sm'
                        : 'text-muted hover:bg-surface-2 hover:text-ink'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cx(
                          'grid size-8 place-items-center rounded-lg transition',
                          isActive
                            ? 'bg-brand text-on-brand'
                            : 'bg-surface-2 group-hover:bg-surface'
                        )}
                        aria-hidden="true"
                      >
                        <Icon size={16} />
                      </span>
                      <span className="truncate">{station.name}</span>
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>

        <div className="mt-2 rounded-2xl border border-line bg-surface-2/60 p-3.5">
          <p className="flex items-center gap-2 text-xs font-semibold">
            <PulseDot />
            Live workspace
          </p>
          <p className="mt-1 font-mono text-[0.68rem] text-muted">Saturday · 31 Oct 2026</p>
        </div>
      </nav>
    </>
  );
}
