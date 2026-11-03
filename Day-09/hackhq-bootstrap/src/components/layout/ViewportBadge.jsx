import { useWindowSize } from '../../hooks/useWindowSize.js';
import { cx } from '../ui.jsx';

const TONES = {
  mobile: 'bg-warn-soft text-warn',
  tablet: 'bg-accent-soft text-accent',
  desktop: 'bg-good-soft text-good',
};

/**
 * Viewport dimensions badge displaying live screen width, height,
 * and derived responsive breakpoint.
 * Complies with requirement VP-1.
 */
export function ViewportBadge() {
  const { width, height } = useWindowSize();

  const breakpoint = width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';

  const label =
    width < 768 ? 'Mobile (<768px)' : width < 1024 ? 'Tablet (768-1023px)' : 'Desktop (≥1024px)';

  return (
    <aside
      aria-label="Responsive viewport diagnostics"
      className="fixed bottom-3 left-3 z-30 lg:left-[17rem] hidden items-center gap-2 rounded-full border border-line bg-surface/90 px-3 py-1.5 font-mono text-[0.68rem] text-muted shadow-card backdrop-blur sm:flex"
    >
      <span>Viewport</span>
      <span className="tabular-nums text-ink">
        {width} × {height}
      </span>
      <span className={cx('rounded-full px-2 py-0.5 font-medium', TONES[breakpoint])}>{label}</span>
    </aside>
  );
}
