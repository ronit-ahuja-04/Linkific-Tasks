'use client';

import { useState } from 'react';
import Pip from '@/components/Pip';

const LINES = [
  'Every day you log is a quest. I will be watching. Encouragingly.',
  'Hard quests give more XP. Boss quests give even more. And I get excited.',
  'Hit a blocker? Write it down. Beat a hard quest in that skill later and you earn a badge.',
  'I start as an egg. Level up and I sprout, grow wings, then wear a crown.',
] as const;

/** The home page's Pip: click for another line */
export default function HeroPip() {
  const [i, setI] = useState(0);
  return (
    <div className="hero-pip">
      <p className="corner-bubble" role="status" aria-live="polite">{LINES[i % LINES.length]}</p>
      <button type="button" className="pip-button" onClick={() => setI((n) => n + 1)} aria-label="Pip. Click for another tip.">
        <Pip stage="sprite" mood="proud" hop={i} />
      </button>
    </div>
  );
}
