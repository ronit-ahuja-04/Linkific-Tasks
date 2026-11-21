'use client';

import { MotionConfig, animate, motion } from 'motion/react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import Pip from '@/components/Pip';
import { stageFor, type PipMood } from '@/lib/game';
import type { Reward } from '@/lib/server/quests';

/**
 * The reward moment after publishing a quest: XP counting up, a level-up banner, new badges, and Pip's reaction.
 * Loaded with next/dynamic only when needed. Escape or either button closes it; focus starts on the heading.
 */
const BG: Record<PipMood, string> = { happy: '#FFC12E', proud: '#6C4DF5', worried: '#2F6BF0', sleepy: '#2E3166', fired_up: '#E0502A' };
const CONFETTI = ['#FFD54A', '#FF6FA5', '#59D987', '#8AB4FF', '#FFFFFF', '#FF9B5A'];

export default function RewardOverlay({ reward, handle, onDone }: { reward: Reward; handle: string; onDone: () => void }) {
  const xpRef = useRef<HTMLSpanElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const celebrate = reward.levelUp || reward.newBadges.length > 0;
  const light = reward.pip.mood === 'happy';

  useEffect(() => {
    heading.current?.focus();
    const controls = animate(0, reward.xpGained, { duration: 1.2, ease: [0.16, 1, 0.3, 1], onUpdate: (n) => { if (xpRef.current) xpRef.current.textContent = `+${Math.round(n)}`; } });
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onDone(); };
    window.addEventListener('keydown', onKey);
    return () => { controls.stop(); window.removeEventListener('keydown', onKey); };
  }, [reward.xpGained, onDone]);

  return (
    <MotionConfig reducedMotion="user">
      <motion.div className={`reward ${light ? 'reward-light' : ''}`} role="dialog" aria-modal="true" aria-labelledby="reward-title"
        style={{ backgroundColor: BG[reward.pip.mood] }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {celebrate && (
          <div className="confetti" aria-hidden="true">
            {Array.from({ length: 36 }, (_, i) => (
              <motion.span key={i} style={{ left: `${(i * 97) % 100}%`, background: CONFETTI[i % CONFETTI.length] }}
                initial={{ y: -40, rotate: 0, opacity: 1 }} animate={{ y: '110vh', rotate: 360 + i * 20, opacity: [1, 1, 0] }}
                transition={{ duration: 2.4 + (i % 5) * 0.3, delay: (i % 9) * 0.08, ease: 'easeIn' }} />
            ))}
          </div>
        )}
        <div className="reward-inner">
          <h2 id="reward-title" ref={heading} tabIndex={-1}>Quest complete!</h2>
          <p className="reward-xp"><span ref={xpRef}>+0</span> XP</p>
          {reward.levelUp && (
            <motion.p className="reward-level" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.9 }}>
              Level up! Level {reward.level} · {reward.title}
            </motion.p>
          )}
          {reward.newBadges.length > 0 && (
            <ul className="reward-badges">
              {reward.newBadges.map((b, i) => (
                <motion.li key={b.id} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 14, delay: 1.2 + i * 0.15 }}>
                  <span className="medal" aria-hidden="true">{b.icon}</span> New badge: {b.name}
                </motion.li>
              ))}
            </ul>
          )}
          <div className="reward-pip">
            <motion.p className="corner-bubble" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 20, delay: 0.5 }}>
              {reward.pip.line}
            </motion.p>
            <Pip stage={stageFor(reward.level)} mood={reward.pip.mood} hop={celebrate ? 1 : 0} />
          </div>
          <div className="reward-actions">
            <button type="button" className="big-button" onClick={onDone}>Back to my journal</button>
            <Link href={`/c/${handle}`} className="ghost-button">See my sheet</Link>
          </div>
        </div>
      </motion.div>
    </MotionConfig>
  );
}
