import { useWindowSize } from '../../hooks/useWindowSize.js';

/**
 * Viewport dimensions badge displaying live screen width, height,
 * and derived responsive breakpoint.
 * Complies with requirement VP-1.
 */
export function ViewportBadge() {
  const { width, height } = useWindowSize();

  // Breakpoint is derived purely during render rather than stored in redundant state
  const breakpoint =
    width < 768 ? 'Mobile (<768px)' : width < 1024 ? 'Tablet (768-1023px)' : 'Desktop (≥1024px)';

  const badgeColor =
    width < 768
      ? 'border-amber-500/40 text-amber-300 bg-amber-950/60'
      : width < 1024
        ? 'border-cyan-500/40 text-cyan-300 bg-cyan-950/60'
        : 'border-emerald-500/40 text-emerald-300 bg-emerald-950/60';

  return (
    <aside
      aria-label="Responsive viewport diagnostics"
      className="fixed bottom-4 right-4 z-40 flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border shadow-xl backdrop-blur-md font-mono text-xs select-none transition-all duration-200 bg-slate-950/80"
    >
      <span className="text-slate-400">Viewport:</span>
      <span className="font-semibold text-slate-100">
        {width} × {height}
      </span>
      <span
        className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider ${badgeColor}`}
      >
        {breakpoint}
      </span>
    </aside>
  );
}
