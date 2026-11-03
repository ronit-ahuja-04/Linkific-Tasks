import { useWindowSize } from '../../hooks/useWindowSize.js';
import { cx } from '../ui.jsx';

// Bootstrap's six grid breakpoints, widest first, with the colour used for each group
const BREAKPOINTS = [
  { name: 'xxl', min: 1400, tone: 'bg-success-subtle text-success-emphasis' },
  { name: 'xl', min: 1200, tone: 'bg-success-subtle text-success-emphasis' },
  { name: 'lg', min: 992, tone: 'bg-success-subtle text-success-emphasis' },
  { name: 'md', min: 768, tone: 'bg-primary-subtle text-primary-emphasis' },
  { name: 'sm', min: 576, tone: 'bg-warning-subtle text-warning-emphasis' },
  { name: 'xs', min: 0, tone: 'bg-warning-subtle text-warning-emphasis' },
];

/**
 * Viewport dimensions badge displaying live screen width, height,
 * and the Bootstrap grid breakpoint currently in effect.
 * Complies with requirement VP-1.
 */
export function ViewportBadge() {
  const { width, height } = useWindowSize();

  const breakpoint = BREAKPOINTS.find((bp) => width >= bp.min);

  return (
    <aside
      aria-label="Responsive viewport diagnostics"
      className="viewport-badge position-fixed d-none d-sm-flex align-items-center gap-2 rounded-pill border bg-body px-3 py-1 font-monospace text-body-secondary shadow-sm"
      style={{ fontSize: '0.68rem' }}
    >
      <span>Viewport</span>
      <span className="text-body">
        {width} × {height}
      </span>
      <span className={cx('rounded-pill px-2 py-1 fw-medium', breakpoint.tone)}>
        {breakpoint.name} (≥{breakpoint.min}px)
      </span>
    </aside>
  );
}
