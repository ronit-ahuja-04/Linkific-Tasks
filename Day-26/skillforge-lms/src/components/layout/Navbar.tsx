import { m, useReducedMotion } from 'motion/react';
import {
  BookOpen,
  Flame,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Moon,
  ShieldAlert,
  Sparkles,
  Sun,
  Trophy,
  Volume2,
  VolumeX,
  Wrench,
} from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { signOutUser } from '../../features/auth/authSlice';
import { pushToast, toggleSound, toggleTheme } from '../../features/ui/uiSlice';
import { DEMO_GUILD_ENTRIES } from '../../lib/demoData';
import { GAME_RULES } from '../../lib/game/catalog';
import { sfx } from '../../lib/game/sfx';
import { progressFor } from '../../lib/game/xp';
import { isSupabaseConfigured } from '../../lib/supabase';
import { CountUpValue } from '../game/CountUpValue';
import { buttonClasses } from '../ui';

interface NavTabItem {
  to: string;
  label: string;
  icon: typeof BookOpen;
}

export function Navbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const theme = useAppSelector((state) => state.ui.theme);
  const soundEnabled = useAppSelector((state) => state.ui.soundEnabled);
  const { profile, userId } = useAppSelector((state) => state.auth);
  const { sessionEarnedXp } = useAppSelector((state) => state.quest);
  const liveSupabase = isSupabaseConfigured();

  const baseEntry = profile
    ? DEMO_GUILD_ENTRIES.find((item) => item.userId === profile.id)
    : undefined;
  const activeXp = (baseEntry?.totalXp ?? 0) + sessionEarnedXp;
  const activeProgress = progressFor(activeXp, GAME_RULES.characterLevelScale);

  const tabs: NavTabItem[] = [
    { to: '/courses', label: 'Catalog', icon: BookOpen },
    { to: '/guild', label: 'Guild Hall', icon: Trophy },
    { to: '/dashboard', label: 'My Learning', icon: LayoutDashboard },
  ];

  if (profile?.role === 'instructor' || profile?.role === 'admin') {
    tabs.push({ to: '/instructor', label: 'Studio', icon: Wrench });
  }
  if (profile?.role === 'admin') {
    tabs.push({ to: '/admin', label: 'Admin', icon: ShieldAlert });
  }

  async function handleSignOut() {
    sfx.tap();
    const res = await dispatch(signOutUser());
    if (signOutUser.fulfilled.match(res)) {
      dispatch(
        pushToast({
          id: `signout-${Date.now()}`,
          kind: 'info',
          text: 'Signed out cleanly. See you on your next quest!',
        }),
      );
      navigate('/', { replace: true });
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b-2 border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            onClick={() => sfx.tap()}
            className="group inline-flex items-center gap-2 font-display text-xl font-bold tracking-tight"
          >
            <m.span
              whileHover={reduce ? undefined : { rotate: -12, scale: 1.12 }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-on-brand shadow-[0_3px_0_var(--brand-deep)]"
            >
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </m.span>
            <span>SkillForge</span>
          </Link>
          <span
            className={`hidden rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold sm:inline-block ${
              liveSupabase ? 'bg-good/15 text-good' : 'bg-gold/30 text-ink dark:text-gold'
            }`}
          >
            {liveSupabase ? 'Supabase Live' : 'Demo Mode'}
          </span>
        </div>

        <nav aria-label="Primary navigation" className="flex flex-wrap items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                onClick={() => sfx.tap()}
                className={({ isActive }) =>
                  `relative inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold transition-colors ${
                    isActive ? 'text-on-brand' : 'text-muted hover:bg-surface-2 hover:text-ink'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <m.span
                        layoutId="primary-nav-pill"
                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                        className="absolute inset-0 rounded-xl bg-brand shadow-[0_3px_0_var(--brand-deep)]"
                      />
                    )}
                    <Icon className="relative z-10 h-4 w-4" aria-hidden="true" />
                    <span className="relative z-10">{tab.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {(userId || sessionEarnedXp > 0) && (
            <div className="hidden items-center gap-2 rounded-xl border-2 border-line bg-surface-2/80 px-2.5 py-1 text-xs font-bold md:flex">
              <span className="rounded-lg bg-brand px-1.5 py-0.5 font-mono text-[11px] text-on-brand">
                Lv.{activeProgress.level}
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-ink dark:text-gold">
                <Sparkles className="h-3 w-3 text-gold-deep dark:text-gold" aria-hidden="true" />
                <CountUpValue value={activeXp} suffix=" XP" duration={600} />
              </span>
              {(baseEntry?.streakDays ?? 0) > 0 && (
                <span className="inline-flex items-center gap-0.5 text-warn">
                  <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                  {baseEntry?.streakDays}d
                </span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => dispatch(toggleSound())}
            aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            className="inline-flex items-center justify-center rounded-xl border-2 border-line bg-surface p-2 text-ink transition-transform hover:bg-surface-2 active:translate-y-0.5"
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 text-brand" aria-hidden="true" />
            ) : (
              <VolumeX className="h-4 w-4 text-muted" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={() => dispatch(toggleTheme())}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="inline-flex items-center justify-center rounded-xl border-2 border-line bg-surface p-2 text-ink transition-transform hover:bg-surface-2 active:translate-y-0.5"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          {userId && profile ? (
            <div className="flex items-center gap-2">
              <Link
                to="/character"
                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-line bg-surface-2 px-3 py-1.5 text-xs font-bold hover:border-brand"
              >
                <Sparkles className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
                <span>@{profile.handle}</span>
              </Link>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                aria-label="Sign out"
                className="inline-flex items-center justify-center rounded-xl border-2 border-line bg-surface p-2 text-muted hover:text-danger"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className={buttonClasses({
                variant: 'primary',
                size: 'sm',
                className: 'rounded-xl px-3.5 py-1.5 text-sm',
              })}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
