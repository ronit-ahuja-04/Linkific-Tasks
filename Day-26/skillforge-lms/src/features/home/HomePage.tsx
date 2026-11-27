import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  Award,
  Compass,
  Flame,
  Gamepad2,
  Layers,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { CountUpValue } from '../../components/game/CountUpValue';
import { FloatingParticles, type SparkBurstItem } from '../../components/game/FloatingParticles';
import { MicroChallengeCard } from '../../components/game/MicroChallengeCard';
import { Pip } from '../../components/pip/Pip';
import { HOME_ARCADE_CHALLENGES } from '../../lib/demoCurricula';
import { CLASS_INFO, GAME_RULES, SKILL_LABELS } from '../../lib/game/catalog';
import { sfx } from '../../lib/game/sfx';
import { progressFor, stageFor, titleFor } from '../../lib/game/xp';
import type { PipMood } from '../../types/lms';
import { fetchRealms } from '../catalog/catalogSlice';
import { fetchGuildLeaderboard } from '../guild/guildSlice';
import { resetCombo, solveArcadeChallenge } from '../quest/questSlice';

const HERO_PIP_LINES = [
  'Tap me to charge Combo Energy! Every quest you clear evolves me.',
  'React hooks, RLS shields, Boss Battles — no boring slides here!',
  'Keep a combo streak alive for bonus spark particles and fanfare.',
  'Start as an Egg, sprout wings at Sprite, wear the Crown at Guardian!',
] as const;

const cardSpring = { type: 'spring', stiffness: 320, damping: 22 } as const;

export function HomePage() {
  const dispatch = useAppDispatch();
  const reduce = useReducedMotion();
  const [hop, setHop] = useState(0);
  const [pipCombo, setPipCombo] = useState(0);
  const [heroSparks, setHeroSparks] = useState<SparkBurstItem[]>([]);
  const [arcadeIndex, setArcadeIndex] = useState(0);

  const realms = useAppSelector((state) => state.catalog.realms);
  const entries = useAppSelector((state) => state.guild.entries);
  const { arcadeSolvedIds, comboCount, sessionEarnedXp } = useAppSelector((state) => state.quest);

  useEffect(() => {
    if (realms.length === 0) void dispatch(fetchRealms());
    if (entries.length === 0) void dispatch(fetchGuildLeaderboard());
  }, [dispatch, realms.length, entries.length]);

  const featured = realms.slice(0, 3);
  const topGuild = entries.slice(0, 3);
  const activeChallenge = HOME_ARCADE_CHALLENGES[arcadeIndex % HOME_ARCADE_CHALLENGES.length];

  const heroMood: PipMood = pipCombo >= 4 ? 'fired_up' : pipCombo >= 1 ? 'happy' : 'proud';
  const heroLine = HERO_PIP_LINES[pipCombo % HERO_PIP_LINES.length] ?? HERO_PIP_LINES[0];

  const handleTapPip = () => {
    const nextCombo = pipCombo + 1;
    setHop((prev) => prev + 1);
    setPipCombo(nextCombo);
    sfx.hop(nextCombo);

    const sparkLabel = nextCombo >= 3 ? `JOY x${nextCombo}!` : '+SPARK!';
    const id = `${Date.now()}-${nextCombo}`;
    setHeroSparks((prev) => [
      ...prev.slice(-4),
      {
        id,
        label: sparkLabel,
        tone: nextCombo >= 4 ? 'brand' : 'gold',
        xOffset: (Math.random() - 0.5) * 60,
      },
    ]);
  };

  return (
    <div className="space-y-12">
      <section className="rpg-card relative overflow-hidden bg-gradient-to-br from-brand via-brand to-brand-deep p-6 text-on-brand sm:p-10">
        {!reduce && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <m.div
              animate={{ y: [0, -14, 0], x: [0, 8, 0], rotate: [0, 6, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-10 -right-10 h-56 w-56 rounded-full bg-gold/20 blur-2xl"
            />
            <m.div
              animate={{ y: [0, 12, 0], x: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-12 left-1/3 h-44 w-44 rounded-full bg-white/15 blur-2xl"
            />
          </div>
        )}

        <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1.25fr_0.9fr]">
          <div>
            <m.p
              initial={reduce ? false : { opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={cardSpring}
              className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 font-mono text-xs font-bold backdrop-blur-sm"
            >
              <Flame className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
              SkillForge LMS · Interactive Learning RPG
            </m.p>

            <m.h1
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...cardSpring, delay: 0.06 }}
              className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl"
            >
              Turn every course into a{' '}
              <span className="text-gold">Quest Realm you actually finish.</span>
            </m.h1>

            <m.p
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...cardSpring, delay: 0.12 }}
              className="mt-4 max-w-xl text-base text-white/90"
            >
              Play interactive coding challenges, defeat Boss Battles on a winding overworld map,
              unlock Guild badges, and evolve Pip from an Egg to a Guardian.
            </m.p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <m.div
                whileHover={reduce ? undefined : { y: -2, scale: 1.02 }}
                whileTap={reduce ? undefined : { scale: 0.97 }}
              >
                <Link
                  to="/courses/react-architecture-design-patterns"
                  onClick={() => sfx.tap()}
                  className="rpg-btn-gold inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold"
                >
                  <Gamepad2 className="h-4 w-4" aria-hidden="true" />
                  <span>Play First Quest</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </m.div>

              <Link
                to="/courses"
                onClick={() => sfx.tap()}
                className="rounded-xl border-2 border-white/40 bg-white/10 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/20"
              >
                Explore All Realms
              </Link>

              <Link
                to="/c/maya"
                onClick={() => sfx.tap()}
                className="rounded-xl border-2 border-white/25 px-4 py-3 text-sm font-bold text-white/95 transition-colors hover:bg-white/10"
              >
                See @maya&apos;s Sheet
              </Link>
            </div>
          </div>

          <div className="relative flex flex-col items-center justify-center">
            <FloatingParticles items={heroSparks} />

            <AnimatePresence mode="wait">
              <m.div
                key={pipCombo}
                initial={reduce ? false : { opacity: 0, scale: 0.8, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                className="max-w-xs rounded-2xl bg-white px-4 py-2.5 text-center text-sm font-bold text-[#2A1E3B] shadow-[0_4px_0_rgba(42,30,59,0.22)]"
              >
                &ldquo;{heroLine}&rdquo;
              </m.div>
            </AnimatePresence>

            <m.button
              type="button"
              whileHover={reduce ? undefined : { scale: 1.05 }}
              whileTap={reduce ? undefined : { scale: 0.9 }}
              onClick={handleTapPip}
              aria-label="Tap Pip companion on landing page"
              className="mt-3 cursor-pointer rounded-3xl p-2 focus-visible:outline-2 focus-visible:outline-white"
            >
              <Pip
                stage="sprite"
                mood={heroMood}
                hop={hop}
                tint={1}
                accessory={4}
                className="w-56"
              />
            </m.button>

            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-mono text-xs font-bold">
              <Zap className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
              {pipCombo > 0
                ? `Pip Joy Combo x${pipCombo}! Keep tapping`
                : 'Tap Pip to test springs & audio'}
            </span>
          </div>
        </div>
      </section>

      {activeChallenge && (
        <section aria-label="Interactive quick challenge arena" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-brand">
                <Gamepad2 className="h-4 w-4" aria-hidden="true" />
                Play Before You Sign Up
              </p>
              <h2 className="mt-1 text-2xl font-bold">Instant Micro-Quest Arena</h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {sessionEarnedXp > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gold/30 px-3 py-1 font-mono text-xs font-extrabold text-ink dark:text-gold">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Session Loot: +<CountUpValue value={sessionEarnedXp} duration={500} /> XP
                </span>
              )}
              {HOME_ARCADE_CHALLENGES.map((item, idx) => {
                const done = arcadeSolvedIds.includes(item.id);
                const selected = idx === arcadeIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      sfx.tap();
                      setArcadeIndex(idx);
                    }}
                    className={`rounded-xl border-2 px-3 py-1.5 font-mono text-xs font-bold transition-colors ${
                      selected
                        ? 'border-brand bg-brand text-on-brand'
                        : done
                          ? 'border-good/40 bg-good/10 text-good'
                          : 'border-line bg-surface hover:bg-surface-2'
                    }`}
                  >
                    Quest {idx + 1} {done ? '✓' : ''}
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <m.div
              key={activeChallenge.id}
              initial={reduce ? false : { opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            >
              <MicroChallengeCard
                challenge={activeChallenge}
                combo={comboCount}
                solved={arcadeSolvedIds.includes(activeChallenge.id)}
                onSolved={(xp) =>
                  dispatch(solveArcadeChallenge({ challengeId: activeChallenge.id, xpReward: xp }))
                }
                onWrong={() => dispatch(resetCombo())}
              />
            </m.div>
          </AnimatePresence>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3" aria-label="How SkillForge works">
        {[
          {
            step: '1',
            bg: 'bg-brand text-on-brand',
            title: 'Pick a Realm & Class',
            desc: 'Choose Frontend Mage, Backend Knight, Full-stack Ranger, or Design Bard and earn +10% home-skill XP.',
          },
          {
            step: '2',
            bg: 'bg-gold text-on-gold',
            title: 'Clear Interactive Maps & Bosses',
            desc: 'Progress down a winding quest path, squash code bugs live, and battle Realm Bosses with instant feedback.',
          },
          {
            step: '3',
            bg: 'bg-accent text-white',
            title: 'Climb Guild Hall & Claim Certs',
            desc: 'Evolve Pip from Egg to Guardian, unlock bouncy badges, and mint verifiable course certificates.',
          },
        ].map((card, i) => (
          <m.article
            key={card.step}
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            whileHover={reduce ? undefined : { y: -5 }}
            transition={{ ...cardSpring, delay: i * 0.06 }}
            className="rpg-card p-5"
          >
            <span
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full font-display text-sm font-bold ${card.bg}`}
            >
              {card.step}
            </span>
            <h2 className="mt-3 text-lg font-bold">{card.title}</h2>
            <p className="mt-1 text-sm text-muted">{card.desc}</p>
          </m.article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.9fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <Compass className="h-5 w-5 text-brand" aria-hidden="true" />
              <span>Featured Realms</span>
            </h2>
            <Link to="/courses" className="text-sm font-bold text-brand hover:underline">
              All Realms →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {featured.map((realm, idx) => (
              <m.div
                key={realm.id}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                whileHover={reduce ? undefined : { y: -5, scale: 1.015 }}
                transition={{ ...cardSpring, delay: idx * 0.05 }}
              >
                <Link
                  to={`/courses/${realm.slug}`}
                  onClick={() => sfx.tap()}
                  className="rpg-card flex h-full flex-col justify-between p-4 transition-colors hover:border-brand"
                >
                  <div>
                    <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-bold text-brand">
                      {SKILL_LABELS[realm.skillTag]} · +{realm.xpReward} XP
                    </span>
                    <h3 className="mt-2 text-base font-bold">{realm.title}</h3>
                    <p className="mt-1 text-xs text-muted">{realm.subtitle}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs font-bold">
                    <span className="text-muted">
                      {realm.lessonsCount} quests · {realm.estimatedMinutes}m
                    </span>
                    <span className="text-brand">Enter Map →</span>
                  </div>
                </Link>
              </m.div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <Trophy className="h-5 w-5 text-gold-deep" aria-hidden="true" />
              <span>Guild Leaders</span>
            </h2>
            <Link to="/guild" className="text-sm font-bold text-brand hover:underline">
              Full Board →
            </Link>
          </div>
          <div className="rpg-card divide-y divide-line overflow-hidden">
            {topGuild.map((entry, idx) => {
              const prog = progressFor(entry.totalXp, GAME_RULES.characterLevelScale);
              return (
                <m.div
                  key={entry.userId}
                  whileHover={reduce ? undefined : { x: 4 }}
                  transition={{ duration: 0.15 }}
                >
                  <Link
                    to={`/c/${entry.handle}`}
                    onClick={() => sfx.tap()}
                    className="flex items-center justify-between gap-3 p-4 hover:bg-surface-2/60"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg font-display text-xs font-extrabold ${
                          idx === 0 ? 'bg-gold text-on-gold' : 'bg-surface-2 text-muted'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <Pip
                        stage={stageFor(prog.level)}
                        mood="happy"
                        tint={entry.pipTint}
                        accessory={entry.pipAccessory}
                        className="h-auto w-10"
                      />
                      <div>
                        <p className="text-sm font-bold">{entry.fullName}</p>
                        <p className="text-xs text-muted">
                          Lv.{prog.level} {titleFor(prog.level)} ·{' '}
                          {CLASS_INFO[entry.characterClass].label}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-brand">
                      <CountUpValue value={entry.totalXp} suffix=" XP" />
                    </span>
                  </Link>
                </m.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rpg-card flex items-center gap-3 p-4">
          <Layers className="h-5 w-5 text-brand" aria-hidden="true" />
          <span className="text-sm font-semibold">Redux Toolkit + Strict TypeScript</span>
        </div>
        <div className="rpg-card flex items-center gap-3 p-4">
          <ShieldCheck className="h-5 w-5 text-good" aria-hidden="true" />
          <span className="text-sm font-semibold">Postgres RLS + Server Quiz Grading</span>
        </div>
        <div className="rpg-card flex items-center gap-3 p-4">
          <Award className="h-5 w-5 text-gold-deep" aria-hidden="true" />
          <span className="text-sm font-semibold">Verifiable Certificates &amp; Badges</span>
        </div>
      </section>
    </div>
  );
}
