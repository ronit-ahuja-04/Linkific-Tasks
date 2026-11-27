import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  Award,
  Compass,
  Flame,
  Gamepad2,
  Printer,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { CountUpValue } from '../../components/game/CountUpValue';
import { MicroChallengeCard } from '../../components/game/MicroChallengeCard';
import { Pip } from '../../components/pip/Pip';
import { DEMO_REALM_CURRICULA, HOME_ARCADE_CHALLENGES } from '../../lib/demoCurricula';
import { DEMO_GUILD_ENTRIES } from '../../lib/demoData';
import { earnedBadgesFor } from '../../lib/game/badges';
import { CLASS_INFO, GAME_RULES, SKILL_LABELS } from '../../lib/game/catalog';
import { pipLineFor, pipMoodForStats } from '../../lib/game/pip';
import { sfx } from '../../lib/game/sfx';
import { progressFor, stageFor, titleFor } from '../../lib/game/xp';
import { fetchRealms } from '../catalog/catalogSlice';
import { resetCombo, solveArcadeChallenge } from '../quest/questSlice';

export function DashboardPage() {
  const dispatch = useAppDispatch();
  const reduce = useReducedMotion();
  const profile = useAppSelector((state) => state.auth.profile);
  const realms = useAppSelector((state) => state.catalog.realms);
  const {
    enrolledCourseIds,
    completedLessonIds,
    passedQuizCourseIds,
    claimedCertificateIds,
    arcadeSolvedIds,
    sessionEarnedXp,
    comboCount,
  } = useAppSelector((state) => state.quest);

  const [hop, setHop] = useState(0);
  const [certCourseId, setCertCourseId] = useState<string | null>(null);

  useEffect(() => {
    if (realms.length === 0) void dispatch(fetchRealms());
  }, [dispatch, realms.length]);

  const baseEntry =
    DEMO_GUILD_ENTRIES.find((item) => item.userId === profile?.id) ?? DEMO_GUILD_ENTRIES[1];
  const totalXp = (baseEntry?.totalXp ?? 0) + sessionEarnedXp;
  const completedLessons =
    (baseEntry?.completedLessons ?? 0) + Math.max(0, completedLessonIds.length - 1);
  const passedQuizzes = (baseEntry?.passedQuizzes ?? 0) + passedQuizCourseIds.length;
  const certificatesCount = (baseEntry?.certificatesEarned ?? 0) + claimedCertificateIds.length;
  const streakDays = baseEntry?.streakDays ?? 4;

  const progress = progressFor(totalXp, GAME_RULES.characterLevelScale);
  const stage = stageFor(progress.level);
  const mood = pipMoodForStats(completedLessons, passedQuizzes);
  const title = titleFor(progress.level);
  const classInfo =
    CLASS_INFO[profile?.characterClass ?? baseEntry?.characterClass ?? 'frontend_mage'];

  const badges = earnedBadgesFor({
    completedLessons,
    streakDays,
    passedQuizzes,
    distinctSkillsCount: baseEntry?.distinctSkillsCount ?? 3,
    certificatesEarned: certificatesCount,
    reviewsCount: baseEntry?.reviewsCount ?? 1,
  });

  const activeRealms = realms.filter((r) => enrolledCourseIds.includes(r.id));
  const nextDailyChallenge =
    HOME_ARCADE_CHALLENGES.find((c) => !arcadeSolvedIds.includes(c.id)) ??
    HOME_ARCADE_CHALLENGES[0];
  const certRealm = realms.find((r) => r.id === certCourseId);

  return (
    <section className="space-y-8">
      <div className="rpg-card overflow-hidden bg-gradient-to-br from-brand via-brand to-brand-deep p-6 text-on-brand sm:p-8">
        <div className="grid items-center gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-mono text-xs font-bold">
              <Flame className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
              {profile?.fullName ?? 'Adventurer'} · {classInfo.label}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Student Command Center
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/90">
              Level {progress.level} {title} · {streakDays}-day streak · Jump straight into your
              next Quest Node or conquer today&apos;s Brain Sprint.
            </p>

            <div className="mt-5 max-w-md rounded-2xl bg-black/20 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs font-bold">
                <span>
                  Lv. <CountUpValue value={progress.level} duration={600} /> {title}
                </span>
                <span className="font-mono text-gold">
                  <CountUpValue value={totalXp} suffix=" XP" />
                </span>
              </div>
              <div className="mt-2 h-3.5 overflow-hidden rounded-full bg-white/20">
                <m.div
                  initial={reduce ? false : { width: 0 }}
                  animate={{ width: `${Math.round(progress.fraction * 100)}%` }}
                  transition={{ type: 'spring', stiffness: 80, damping: 16 }}
                  className="xp-bar-fill h-full rounded-full bg-gold"
                />
              </div>
              <p className="mt-1.5 text-[11px] font-semibold text-white/80">
                {progress.into} / {progress.span} XP to Level {progress.level + 1}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to={`/courses/${activeRealms[0]?.slug ?? 'react-architecture-design-patterns'}`}
                onClick={() => sfx.tap()}
                className="rpg-btn-gold inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold"
              >
                <Gamepad2 className="h-4 w-4" aria-hidden="true" />
                <span>Resume Quest Map</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/character"
                className="rounded-xl border-2 border-white/35 bg-white/10 px-4 py-2.5 text-sm font-bold hover:bg-white/20"
              >
                Customize Pip
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="max-w-xs rounded-2xl bg-white px-4 py-2.5 text-xs font-bold text-[#2A1E3B] shadow-[0_4px_0_rgba(42,30,59,0.2)]">
              &ldquo;{pipLineFor(mood, profile?.handle ?? 'maya')}&rdquo;
            </div>
            <m.button
              type="button"
              whileTap={reduce ? undefined : { scale: 0.92 }}
              onClick={() => {
                setHop((prev) => prev + 1);
                sfx.hop(hop + 1);
              }}
              aria-label="Tap your Pip companion"
              className="mt-2 cursor-pointer rounded-3xl p-2"
            >
              <Pip
                stage={stage}
                mood={mood}
                hop={hop}
                tint={profile?.pipTint ?? 1}
                accessory={profile?.pipAccessory ?? 4}
                className="h-auto w-44"
              />
            </m.button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Compass className="h-5 w-5 text-brand" aria-hidden="true" />
            <span>Active Quest Realms ({activeRealms.length})</span>
          </h2>

          <div className="grid gap-4">
            {activeRealms.map((realm) => {
              const cur = DEMO_REALM_CURRICULA[realm.id];
              const total = (cur?.nodes.length ?? 0) + 1;
              const cleared =
                cur?.nodes.filter((n) => completedLessonIds.includes(n.id)).length ?? 0;
              const bossDone = passedQuizCourseIds.includes(realm.id);
              const pct =
                total > 0 ? Math.round(((cleared + (bossDone ? 1 : 0)) / total) * 100) : 0;

              return (
                <m.div
                  key={realm.id}
                  whileHover={reduce ? undefined : { y: -3 }}
                  className="rpg-card flex flex-wrap items-center justify-between gap-4 p-5"
                >
                  <div className="min-w-[220px] flex-1">
                    <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-bold text-brand">
                      {SKILL_LABELS[realm.skillTag]}
                    </span>
                    <h3 className="mt-1.5 text-lg font-bold">{realm.title}</h3>
                    <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="xp-bar-fill h-full rounded-full bg-gradient-to-r from-brand to-gold"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs font-semibold text-muted">{pct}% conquered</p>
                  </div>

                  <Link
                    to={`/courses/${realm.slug}`}
                    onClick={() => sfx.tap()}
                    className="rpg-btn-primary rounded-xl px-4 py-2 text-xs font-bold"
                  >
                    Open Map →
                  </Link>
                </m.div>
              );
            })}
          </div>

          {nextDailyChallenge && (
            <div className="space-y-3 pt-2">
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                <Sparkles className="h-5 w-5 text-gold-deep" aria-hidden="true" />
                <span>Daily Brain Sprint</span>
              </h2>
              <MicroChallengeCard
                challenge={nextDailyChallenge}
                combo={comboCount}
                solved={arcadeSolvedIds.includes(nextDailyChallenge.id)}
                onSolved={(xp) =>
                  dispatch(
                    solveArcadeChallenge({ challengeId: nextDailyChallenge.id, xpReward: xp }),
                  )
                }
                onWrong={() => dispatch(resetCombo())}
              />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rpg-card p-5">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Trophy className="h-5 w-5 text-gold-deep" aria-hidden="true" />
              <span>Earned Badges ({badges.length})</span>
            </h2>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {badges.map((b) => (
                <m.li
                  key={b.id}
                  whileHover={reduce ? undefined : { y: -3, rotate: -2 }}
                  className="flex items-start gap-2.5 rounded-xl border border-line bg-surface-2/70 p-3"
                >
                  <span className="text-xl" aria-hidden="true">
                    {b.icon}
                  </span>
                  <div>
                    <p className="font-display text-sm font-bold">{b.name}</p>
                    <p className="text-xs text-muted">{b.description}</p>
                  </div>
                </m.li>
              ))}
            </ul>
          </div>

          <div className="rpg-card p-5">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Award className="h-5 w-5 text-good" aria-hidden="true" />
              <span>Verifiable Certificates ({claimedCertificateIds.length})</span>
            </h2>
            {claimedCertificateIds.length === 0 ? (
              <p className="mt-2 text-sm text-muted">
                Defeat a Realm Boss Battle to mint your first verifiable certificate.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {claimedCertificateIds.map((id) => {
                  const r = realms.find((item) => item.id === id);
                  if (!r) return null;
                  return (
                    <li
                      key={id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-good/40 bg-good/10 p-3"
                    >
                      <div>
                        <p className="font-display text-sm font-bold">{r.title}</p>
                        <p className="font-mono text-[11px] text-muted">
                          ID: SF-{r.slug.slice(0, 6).toUpperCase()}-2026
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCertCourseId(id)}
                        className="rpg-btn-gold rounded-lg px-3 py-1.5 text-xs font-bold"
                      >
                        Inspect
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {certRealm && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          >
            <m.div
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 12 }}
              className="rpg-card relative w-full max-w-lg border-4 border-gold bg-surface p-8 text-center"
            >
              <button
                type="button"
                aria-label="Close certificate preview"
                onClick={() => setCertCourseId(null)}
                className="absolute top-4 right-4 rounded-lg p-1.5 text-muted hover:bg-surface-2"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
              <Award className="mx-auto h-12 w-12 text-gold-deep" aria-hidden="true" />
              <p className="mt-3 font-mono text-xs font-bold uppercase tracking-widest text-brand">
                SkillForge Guild Verification
              </p>
              <h3 className="mt-2 font-display text-2xl font-extrabold">
                Certificate of Realm Mastery
              </h3>
              <p className="mt-2 text-sm text-muted">Awarded to</p>
              <p className="mt-1 font-display text-xl font-bold text-ink">
                {profile?.fullName ?? 'Maya Sharma'} (@{profile?.handle ?? 'maya'})
              </p>
              <p className="mt-3 text-sm text-muted">
                for conquering every quest and Boss Battle in
              </p>
              <p className="mt-1 font-display text-lg font-bold text-brand">{certRealm.title}</p>
              <p className="mt-4 font-mono text-xs text-muted">
                Verification Code: SF-{certRealm.slug.slice(0, 6).toUpperCase()}-2026
              </p>
              <button
                type="button"
                onClick={() => window.print()}
                className="rpg-btn-primary mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold"
              >
                <Printer className="h-4 w-4" aria-hidden="true" />
                <span>Print Certificate</span>
              </button>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </section>
  );
}
