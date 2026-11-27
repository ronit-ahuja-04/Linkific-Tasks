import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { dismissReward } from '../../features/quest/questSlice';
import { dismissToast } from '../../features/ui/uiSlice';
import { AppErrorBoundary } from '../AppErrorBoundary';
import { RewardOverlay } from '../game/RewardOverlay';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

export function AppShell() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const reduce = useReducedMotion();
  const theme = useAppSelector((state) => state.ui.theme);
  const toasts = useAppSelector((state) => state.ui.toasts);
  const { activeReward } = useAppSelector((state) => state.quest);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-brand focus:px-3 focus:py-2 focus:text-sm focus:font-bold focus:text-on-brand"
      >
        Skip to content
      </a>

      <Navbar />

      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <m.div
          key={location.pathname}
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        >
          <AppErrorBoundary key={location.pathname}>
            <Outlet />
          </AppErrorBoundary>
        </m.div>
      </main>

      <Footer />

      <AnimatePresence>
        {activeReward && (
          <RewardOverlay reward={activeReward} onDone={() => dispatch(dismissReward())} />
        )}
      </AnimatePresence>

      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-4 z-40 flex flex-col gap-2"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <m.div
              key={toast.id}
              initial={reduce ? false : { opacity: 0, y: 16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.9 }}
              className="pointer-events-auto flex items-center gap-3 rounded-xl border-2 border-line bg-surface px-4 py-2.5 text-sm font-bold shadow-md"
            >
              <span>{toast.text}</span>
              <button
                type="button"
                onClick={() => dispatch(dismissToast(toast.id))}
                className="text-xs text-muted hover:text-ink"
              >
                Dismiss
              </button>
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
