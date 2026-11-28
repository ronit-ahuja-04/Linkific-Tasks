import { Compass, Map, UserRound } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

const TABS = [
  { to: '/map', label: 'Map', icon: Map },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/me', label: 'Wisp & me', icon: UserRound },
];

/** The learner app: the page, then a bottom tab bar (a side rail on wide screens). */
export function LearnerShell() {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row-reverse">
      <main id="main" className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t-2 border-line bg-white md:static md:flex md:w-56 md:flex-col md:gap-1 md:border-t-0 md:border-r-2 md:p-4"
      >
        <span className="hidden px-3 pb-4 font-display text-3xl font-bold text-glow-deep md:block">
          lumo
        </span>
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-extrabold no-underline md:min-h-12 md:flex-row md:justify-start md:gap-3 md:rounded-2xl md:px-3 md:text-base',
                isActive ? 'text-violet-ink md:bg-violet-soft' : 'text-dusk hover:text-ink',
              ].join(' ')
            }
          >
            <Icon aria-hidden="true" className="h-6 w-6" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
