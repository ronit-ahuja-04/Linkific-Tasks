import { useSyncExternalStore } from 'react';

/**
 * Recharts animations (bars growing, lines drawing, pie sweeping) are on by default. People who
 * ask their system for reduced motion get none. Spread the result onto any Recharts series:
 *
 *   const motion = useChartMotion();
 *   <Bar dataKey="revenue" {...motion} />
 */
const QUERY = '(prefers-reduced-motion: reduce)';
const subscribe = (callback) => {
  const media = window.matchMedia?.(QUERY);
  media?.addEventListener?.('change', callback);
  return () => media?.removeEventListener?.('change', callback);
};
const getSnapshot = () => window.matchMedia?.(QUERY).matches ?? false;

export function useChartMotion(duration = 700) {
  const reduced = useSyncExternalStore(subscribe, getSnapshot, () => false);
  return { isAnimationActive: !reduced, animationDuration: duration, animationEasing: 'ease-out' };
}
