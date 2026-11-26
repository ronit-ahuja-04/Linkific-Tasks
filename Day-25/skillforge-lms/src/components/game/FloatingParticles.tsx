import { AnimatePresence, m } from 'motion/react';

export interface SparkBurstItem {
  id: string;
  label: string;
  tone?: 'gold' | 'brand' | 'good' | 'danger';
  xOffset?: number;
}

const TONE_CLASSES: Record<NonNullable<SparkBurstItem['tone']>, string> = {
  gold: 'bg-gold text-on-gold border-gold-deep',
  brand: 'bg-brand text-on-brand border-brand-deep',
  good: 'bg-good text-white border-emerald-900',
  danger: 'bg-danger text-white border-red-900',
};

/**
 * Floating "+XP" and "COMBO!" bursts rendered inside a relative container
 * whenever the player lands an action or hits a streak.
 */
export function FloatingParticles({ items }: { items: readonly SparkBurstItem[] }) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center overflow-visible"
      aria-hidden="true"
    >
      <AnimatePresence>
        {items.map((item) => (
          <m.span
            key={item.id}
            initial={{ opacity: 0, y: 12, scale: 0.55, x: item.xOffset ?? 0, rotate: -8 }}
            animate={{ opacity: [0, 1, 1, 0], y: -64, scale: [0.6, 1.18, 1, 0.9], rotate: 4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.95, ease: 'easeOut' }}
            className={`absolute rounded-full border-2 px-3 py-1 font-display text-xs font-extrabold shadow-lg ${
              TONE_CLASSES[item.tone ?? 'gold']
            }`}
          >
            {item.label}
          </m.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
