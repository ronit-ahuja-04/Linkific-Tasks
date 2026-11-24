'use client';

import { LazyMotion, MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * LAZY-LOADED ANIMATION. Components use `m.div` (a thin shell) instead of `motion.div`; the animation engine itself
 * (`domMax`) is fetched in a separate chunk after the page is interactive, so it is not part of any page's first
 * download. `strict` makes a stray `motion.` component an error, so the saving can not silently disappear.
 * `reducedMotion="user"` honours the visitor's "reduce motion" setting everywhere.
 */
const loadFeatures = () => import('./motion-features').then((module) => module.default);

export default function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
