import { BookOpen, LogOut, Map, ShieldCheck } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { signOut } from '../../features/auth/authSlice';

/** Instructor and admin web tools: a sidebar (stacks above the page on a phone) and the page. */
export function StaffShell() {
  const profile = useAppSelector((s) => s.auth.profile);
  const dispatch = useAppDispatch();
  const links = [
    ...(profile?.role === 'instructor' || profile?.role === 'admin'
      ? [{ to: '/studio', label: 'Course studio', icon: BookOpen }]
      : []),
    ...(profile?.role === 'admin' ? [{ to: '/admin', label: 'Admin', icon: ShieldCheck }] : []),
    { to: '/map', label: 'Learner view', icon: Map },
  ];
  return (
    <div className="flex min-h-dvh flex-wrap bg-[#f6f4fd]">
      <aside className="flex grow basis-56 flex-col gap-6 bg-night p-4 text-white md:max-w-64">
        <span className="px-2 font-display text-3xl font-bold text-glow">
          lumo{' '}
          <span className="text-sm font-extrabold text-moon">
            {profile?.role === 'admin' ? 'admin' : 'studio'}
          </span>
        </span>
        <nav aria-label="Staff" className="flex flex-col gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex min-h-11 items-center gap-3 rounded-xl px-3 font-extrabold no-underline',
                  isActive ? 'bg-night-3 text-white' : 'text-moon hover:text-white',
                ].join(' ')
              }
            >
              <Icon aria-hidden="true" className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex items-center justify-between gap-2 rounded-2xl bg-night-2 p-3">
          <span className="flex flex-col">
            <b className="text-sm">{profile?.display_name}</b>
            <span className="text-xs capitalize text-moon">{profile?.role}</span>
          </span>
          <button
            type="button"
            aria-label="Sign out"
            onClick={() => void dispatch(signOut())}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-moon hover:bg-night-3 hover:text-white"
          >
            <LogOut aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
      </aside>
      <main id="main" className="min-w-0 grow-[999] basis-[560px] p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
