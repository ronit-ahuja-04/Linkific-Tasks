import { m, useReducedMotion } from 'motion/react';
import { Award, Flame, Sparkles, Trophy } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { countUp } from '../../lib/count-up';
import { stageFor } from '../../lib/game/xp';
import { sfx } from '../../lib/game/sfx';
import type { PipMood } from '../../types/lms';
import { Pip } from '../pip/Pip';

export interface UnlockedBadgePreview {
  id: string;
  name: string;
  icon: string;
}

export interface RewardCelebration {
  headline: string;
  subtitle: string;
  xpGained: number;
  newTotalXp: number;
  newLevel: number;
  levelTitle: string;
  leveledUp: boolean;
  mood: PipMood;
  pipTint: number;
  pipAccessory: number;
  pipLine: string;
  unlockedBadges: readonly UnlockedBadgePreview[];
  ctaLabel?: string;
}

const MOOD_BG: Record<PipMood, string> = {
  happy: '#FFC12E',
  proud: '#6C4DF5',
  worried: '#2F6BF0',
  sleepy: '#2E3166',
  fired_up: '#E0502A',
};

const CONFETTI_COLORS = ['#FFD54A', '#FF6FA5', '#59D987', '#8AB4FF', '#FFFFFF', '#FF9B5A'];

export function RewardOverlay({
  reward,
  onDone,
}: {
  reward: RewardCelebration;
  onDone: () => void;
}) {
  const reduce = useReducedMotion();
  const xpRef = useRef<HTMLSpanElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const lightTheme = reward.mood === 'happy';
  const stage = stageFor(reward.newLevel);

  useEffect(() => {
    headingRef.current?.focus();
    sfx.levelUp();

    const stop = xpRef.current
      ? countUp(xpRef.current, reward.xpGained, {
          duration: 1100,
          format: (n) => `+${Math.round(n).toLocaleString('en-US')}`,
        })
      : () => {};

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDone();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      stop();
      window.removeEventListener('keydown', handleKey);
    };
  }, [reward.xpGained, onDone]);

  return (
    <m.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reward-modal-heading"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ backgroundColor: MOOD_BG[reward.mood] }}
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-8 ${
        lightTheme ? 'text-[#2A1E3B]' : 'text-white'
      }`}
    >
      {!reduce && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
          {Array.from({ length: 40 }, (_, i) => (
            <m.span
              key={i}
              style={{
                left: `${(i * 97) % 100}%`,
                backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              }}
              initial={{ y: -40, rotate: 0, opacity: 1 }}
              animate={{ y: '110vh', rotate: 360 + i * 24, opacity: [1, 1, 0] }}
              transition={{
                duration: 2.3 + (i % 5) * 0.3,
                delay: (i % 8) * 0.07,
                ease: 'easeIn',
              }}
              className="absolute top-0 h-3.5 w-2.5 rounded-sm"
            />
          ))}
        </div>
      )}

      <m.div
        initial={reduce ? false : { scale: 0.86, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        className="relative z-10 flex w-full max-w-xl flex-col items-center text-center"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/15 px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Quest Reward Unlocked
        </span>

        <h2
          id="reward-modal-heading"
          ref={headingRef}
          tabIndex={-1}
          className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl focus:outline-none"
        >
          {reward.headline}
        </h2>
        <p className="mt-2 text-base font-medium opacity-90">{reward.subtitle}</p>

        <m.p
          initial={reduce ? false : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 360, damping: 16, delay: 0.15 }}
          className="mt-5 font-display text-6xl font-black tracking-tight"
        >
          <span ref={xpRef}>+{reward.xpGained}</span> XP
        </m.p>

        {reward.leveledUp && (
          <m.div
            initial={reduce ? false : { scale: 0.4, opacity: 0, rotate: -6 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 14, delay: 0.55 }}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl border-2 border-current/25 bg-white px-5 py-2.5 font-display text-base font-extrabold text-[#2A1E3B] shadow-[0_6px_0_rgba(42,30,59,0.28)]"
          >
            <Trophy className="h-5 w-5 text-[#D99B06]" aria-hidden="true" />
            <span>
              LEVEL UP! Level {reward.newLevel} · {reward.levelTitle}
            </span>
          </m.div>
        )}

        {reward.unlockedBadges.length > 0 && (
          <ul className="mt-4 flex flex-wrap justify-center gap-2.5">
            {reward.unlockedBadges.map((badge, idx) => (
              <m.li
                key={badge.id}
                initial={reduce ? false : { scale: 0, rotate: -25 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 380,
                  damping: 14,
                  delay: 0.75 + idx * 0.12,
                }}
                className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-1.5 text-sm font-bold text-[#2A1E3B] shadow-md"
              >
                <span aria-hidden="true">{badge.icon}</span>
                <Award className="h-4 w-4 text-[#6C4DF5]" aria-hidden="true" />
                <span>{badge.name}</span>
              </m.li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex flex-col items-center">
          <m.p
            initial={reduce ? false : { opacity: 0, scale: 0.7, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.35 }}
            className="max-w-sm rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-[#2A1E3B] shadow-[0_4px_0_rgba(42,30,59,0.22)]"
          >
            &ldquo;{reward.pipLine}&rdquo;
          </m.p>
          <Pip
            stage={stage}
            mood={reward.mood}
            hop={2}
            tint={reward.pipTint}
            accessory={reward.pipAccessory}
            className="mt-2 w-44"
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onDone}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#2A1E3B] px-7 py-3.5 font-display text-base font-bold text-white shadow-[0_5px_0_rgba(0,0,0,0.35)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
          >
            <Flame className="h-4 w-4 text-[#FFC12E]" aria-hidden="true" />
            <span>{reward.ctaLabel ?? 'Continue Adventure'}</span>
          </button>
        </div>
      </m.div>
    </m.div>
  );
}
