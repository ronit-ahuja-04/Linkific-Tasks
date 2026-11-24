'use client';

import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import Pip from '@/components/Pip';
import type { CharacterView } from '@/lib/view';

/** Pip with a speech bubble; click to hear about another of your recent quests */
export default function PipCorner({ pip }: { pip: CharacterView['pip'] }) {
  // "Reduce motion" turned on: skip entrance animations, show the final state at once
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [hop, setHop] = useState(0);
  const line = pip.lines[index % Math.max(1, pip.lines.length)];
  return (
    <div className="pip-corner">
      <AnimatePresence mode="wait">
        <m.p key={index} className="corner-bubble" role="status" aria-live="polite"
          initial={reduce ? false : { opacity: 0, scale: 0.7, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85 }}
          transition={{ type: 'spring', stiffness: 420, damping: 22 }}>
          {line ? line.line : 'Log your first quest and I will have plenty to say.'}
          {line && <span className="bubble-meta">Day {line.day} · {line.title}</span>}
        </m.p>
      </AnimatePresence>
      <m.button type="button" className="pip-button" whileTap={{ scale: 0.94 }} onClick={() => { setHop((n) => n + 1); setIndex((n) => n + 1); }}
        aria-label="Pip. Click to hear about another quest.">
        <Pip stage={pip.stage} mood={pip.mood} hop={hop} tint={pip.tint} accessory={pip.accessory} />
      </m.button>
    </div>
  );
}
