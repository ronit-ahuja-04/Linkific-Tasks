'use client';

import { AnimatePresence, m, useInView, useReducedMotion } from 'motion/react';
import { countUp } from '@/lib/count-up';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { PipMood } from '@/lib/game';
import type { CharacterView } from '@/lib/view';
import Link from 'next/link';
import Pip from './Pip';

/**
 * The character screen, a desktop dashboard: the background takes Pip's mood colour, Pip is the hero with a speech
 * bubble on the left, and white cards hold the stats on the right. Springs everywhere, nothing linear. Click Pip to hear what it thought of
 * each of your last five quests.
 */
interface Theme {
  bg: string;
  text: string;
  accent: string;
}
// every background passes WCAG AA 3:1 for the large headline text drawn on it
const THEMES: Record<PipMood, Theme> = {
  happy: { bg: '#FFC12E', text: '#2A1E3B', accent: '#4A2FC9' },
  proud: { bg: '#6C4DF5', text: '#FFFFFF', accent: '#FFD54A' },
  worried: { bg: '#2F6BF0', text: '#FFFFFF', accent: '#FFD54A' },
  sleepy: { bg: '#2E3166', text: '#FFFFFF', accent: '#B7C0FF' },
  fired_up: { bg: '#E0502A', text: '#FFFFFF', accent: '#FFE39A' },
};
const MOOD_WORD: Record<PipMood, string> = { happy: 'happy', proud: 'proud', worried: 'worried', sleepy: 'sleepy', fired_up: 'fired up' };

const spring = { type: 'spring', stiffness: 260, damping: 24 } as const;

export default function QuestApp({ characters, account }: { characters: CharacterView[]; account?: ReactNode }) {
  // "Reduce motion" turned on: skip entrance animations, show the final state at once
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [hop, setHop] = useState(0);
  const character = characters[active];
  if (!character) return null;
  const theme = THEMES[character.pip.mood];
  const line = character.pip.lines[lineIndex % Math.max(1, character.pip.lines.length)];

  const choose = (index: number) => {
    setActive(index);
    setLineIndex(0);
  };
  const poke = () => {
    setHop((n) => n + 1);
    setLineIndex((n) => n + 1);
  };

  // the colours are set directly too: the animation engine loads a moment later (LazyMotion), and the page must
  // never render without its background in the meantime
  return (
      <m.div className="screen" style={{ backgroundColor: theme.bg, color: theme.text }} initial={false} animate={{ backgroundColor: theme.bg, color: theme.text }} transition={{ duration: 0.6, ease: 'easeInOut' }}>
        <header className="topbar">
          <Link href="/" className="wordmark">Intern Quest</Link>
          {characters.length > 1 ? <nav className="switcher" aria-label="Choose a character">
            {characters.map((c, i) => (
              <button key={c.handle} type="button" onClick={() => choose(i)} aria-pressed={i === active}>
                {i === active && <m.span layoutId="switcher-pill" className="switcher-pill" transition={spring} />}
                <span className="switcher-label">{c.name}</span>
              </button>
            ))}
          </nav> : <span />}
          <div className="pills">
            <span className="pill" title="Total XP">⚡ <CountUp value={character.totalXp} /> XP</span>
            <span className="pill" title="Longest streak">🔥 {character.streak} days</span>
            {account}
          </div>
        </header>

        <div className="board">
          <AnimatePresence mode="wait">
            <m.section key={character.handle} className="hero"
              initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={spring}>
              <h1>
                {character.name} is a <span style={{ color: theme.accent }}>level {character.level} {character.title}.</span>
              </h1>
              <p className="sub">{character.classLabel} · {character.motto}</p>

              <div className="stage">
                <div className="pip-column">
                  <m.button type="button" className="pip-button" onClick={poke} whileTap={{ scale: 0.94 }}
                    aria-label={`Pip is ${MOOD_WORD[character.pip.mood]}. Click to hear about another quest.`}>
                    <Pip stage={character.pip.stage} mood={character.pip.mood} hop={hop} tint={character.pip.tint} accessory={character.pip.accessory} />
                  </m.button>
                  <p className="hint">Pip is {MOOD_WORD[character.pip.mood]} · click Pip to hear about another quest</p>
                </div>
                <AnimatePresence mode="wait">
                  {line && (
                    <m.div key={`${character.handle}-${lineIndex}`} className="bubble" role="status" aria-live="polite"
                      initial={reduce ? false : { opacity: 0, scale: 0.6, x: -16 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 22 }}>
                      {line.line}
                      <span className="bubble-meta">Day {line.day} · {line.title}</span>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            </m.section>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <m.div key={character.handle} className="cards" initial={reduce ? false : { opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={spring}>
              <Sheet character={character} />
            </m.div>
          </AnimatePresence>
        </div>
      </m.div>
  );
}

function Sheet({ character }: { character: CharacterView }) {
  // "Reduce motion" turned on: skip entrance animations, show the final state at once
  const reduce = useReducedMotion();
  return (
    <>
      <section className="card level-card">
        <div className="level-badge">
          <span className="level-num"><CountUp value={character.level} /></span>
          <span className="level-cap">level</span>
        </div>
        <div className="level-text">
          <div className="level-head">
            <strong>{character.title}</strong>
            <span className="muted">{character.into.toLocaleString('en-US')} / {character.span.toLocaleString('en-US')} XP to level {character.level + 1}</span>
          </div>
          <div className="xpbar" role="progressbar" aria-valuemin={0} aria-valuemax={character.span} aria-valuenow={character.into} aria-label="XP to the next level">
            <m.div className="xpfill" initial={reduce ? false : { width: 0 }} animate={{ width: `${Math.round(character.fraction * 100)}%` }} transition={{ type: 'spring', stiffness: 60, damping: 16, delay: 0.25 }} />
          </div>
          <div className="level-facts">
            <span><b><CountUp value={character.totalXp} /></b> XP total</span>
            <span><b>{character.questCount}</b> {character.questCount === 1 ? 'quest' : 'quests'}</span>
            <span><b>{character.badges.length}</b> {character.badges.length === 1 ? 'badge' : 'badges'}</span>
          </div>
        </div>
      </section>

      <section className="card skills-card">
        <h2>Skills</h2>
        <ul className="skills">
          {character.skills.map((s, i) => (
            <li key={s.label}>
              <span className="skill-name">{s.label}</span>
              <span className="skill-track">
                <m.span className="skill-fill" initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: s.fraction }} transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.3 + i * 0.07 }} />
              </span>
              <span className="skill-lv">Lv {s.level}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card badges-card">
        <h2>Badges <span className="count">{character.badges.length}</span></h2>
        <ul className="badges">
          {character.badges.map((b, i) => (
            <m.li key={b.name} className={b.mentor ? 'mentor' : ''} title={`${b.name}: ${b.description}`}
              initial={reduce ? false : { scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} whileHover={{ y: -4, rotate: -4 }}
              transition={{ type: 'spring', stiffness: 380, damping: 16, delay: 0.4 + i * 0.06 }}>
              <span className="medal" aria-hidden="true">{b.icon}</span>
              <span className="badge-name">{b.name}</span>
              <span className="badge-day">{b.mentor ? 'mentor' : `day ${b.day}`}</span>
            </m.li>
          ))}
        </ul>
      </section>

      <section className="card quests-card">
        <h2>Quest log <span className="count">{character.questCount}</span></h2>
        <div className="quests-scroll" tabIndex={0} aria-label="Quest log">
          <table className="quests">
            <thead>
              <tr><th scope="col">Day</th><th scope="col">Quest</th><th scope="col">Difficulty</th><th scope="col" className="num">XP</th></tr>
            </thead>
            <tbody>
              {character.quests.map((q, i) => (
                <m.tr key={q.day} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.35 + Math.min(i, 8) * 0.04 }}>
                  <td className="q-day">{q.day}</td>
                  <td className="q-title">{q.title}{q.blockers && <span className="q-blocker" title={q.blockers}> · blocked</span>}</td>
                  <td><span className={`q-diff ${q.difficulty}`}>{q.difficulty}</span></td>
                  <td className="q-xp num">+{q.xp}</td>
                </m.tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

/** A number that counts up with a spring when it first appears or changes */
function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const shown = useRef(0);
  useEffect(() => {
    if (!inView || !ref.current) return;
    const stop = countUp(ref.current, value, { from: shown.current });
    shown.current = value;
    return stop;
  }, [value, inView]);
  return <span ref={ref}>{value.toLocaleString('en-US')}</span>;
}
