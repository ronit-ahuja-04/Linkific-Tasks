import { useSyncExternalStore } from 'react';

/**
 * Recharts animations (bars growing, lines drawing, pie sweeping) are on by default. People who
 * ask their system for reduced motion get none. Spread the result onto any Recharts series:
 *
 *   const motion = useChartMotion();
 *   <Bar dataKey="revenue" {...motion} />
 */
const QUERY = '(prefers-reduced-motion: reduce)';
const subscribe = (callback: () => void) => {
  const media = window.matchMedia?.(QUERY);
  media?.addEventListener?.('change', callback);
  return () => media?.removeEventListener?.('change', callback);
};
const getSnapshot = () => window.matchMedia?.(QUERY).matches ?? false;

/** The three animation props every Recharts series accepts */
export interface ChartMotion {
  isAnimationActive: boolean;
  animationDuration: number;
  animationEasing: 'ease-out';
}

export function useChartMotion(duration = 700): ChartMotion {
  const reduced = useSyncExternalStore(subscribe, getSnapshot, () => false);
  return { isAnimationActive: !reduced, animationDuration: duration, animationEasing: 'ease-out' };
}
