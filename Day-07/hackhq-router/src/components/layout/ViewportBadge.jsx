import { useWindowSize } from '../../hooks/useWindowSize.js';

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
    <aside aria-label="Responsive viewport diagnostics" className="viewport-floating-badge">
      <span className="viewport-badge-label">Viewport:</span>
      <span className="viewport-badge-size">
        {width} × {height}
      </span>
      <span className={`viewport-breakpoint-pill ${breakpoint}`}>{label}</span>
    </aside>
  );
}
