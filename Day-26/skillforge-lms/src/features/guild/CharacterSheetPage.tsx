import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { ArrowLeft, Award, Flame, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { CountUpValue } from '../../components/game/CountUpValue';
import { FloatingParticles, type SparkBurstItem } from '../../components/game/FloatingParticles';
import { Pip } from '../../components/pip/Pip';
import { earnedBadgesFor } from '../../lib/game/badges';
import { CLASS_INFO, GAME_RULES, SKILL_LABELS, SKILLS } from '../../lib/game/catalog';
import { pipLineFor, pipMoodForStats } from '../../lib/game/pip';
import { sfx } from '../../lib/game/sfx';
import { progressFor, stageFor, titleFor } from '../../lib/game/xp';
import type { PipMood } from '../../types/lms';
import { fetchGuildLeaderboard } from './guildSlice';

const MOOD_STAGE_THEME: Record<PipMood, { bg: string; text: string; accent: string }> = {
  happy: { bg: '#FFC12E', text: '#2A1E3B', accent: '#4A2FC9' },
  proud: { bg: '#6C4DF5', text: '#FFFFFF', accent: '#FFD54A' },
  worried: { bg: '#2F6BF0', text: '#FFFFFF', accent: '#FFD54A' },
  sleepy: { bg: '#2E3166', text: '#FFFFFF', accent: '#B7C0FF' },
  fired_up: { bg: '#E0502A', text: '#FFFFFF', accent: '#FFE39A' },
};

const SHEET_REACTIONS = [
  'Tap me again! Every quest cleared pushes my evolution closer.',
  'See those glowing Skill Mastery bars? Zero fake XP in here.',
  'Hover the badges — each medal remembers how it was forged!',
] as const;

export function CharacterSheetPage() {
  const { handle } = useParams();
  const dispatch = useAppDispatch();
  const reduce = useReducedMotion();
  const activeProfile = useAppSelector((state) => state.auth.profile);
  const { entries, status } = useAppSelector((state) => state.guild);
  const { sessionEarnedXp, completedLessonIds, passedQuizCourseIds, claimedCertificateIds } =
    useAppSelector((state) => state.quest);
  const [hop, setHop] = useState(0);
  const [sparks, setSparks] = useState<SparkBurstItem[]>([]);

  useEffect(() => {
    if (entries.length === 0) {
      void dispatch(fetchGuildLeaderboard(activeProfile));
    }
  }, [dispatch, entries.length, activeProfile]);

  const rawEntry = entries.find((item) => item.handle === handle);

  if (status === 'loading' && !rawEntry) {
    return (
      <div className="rpg-card p-6 text-sm text-muted" role="status">
        Loading adventurer sheet...
      </div>
    );
  }

  if (!rawEntry) {
    return (
      <section className="rpg-card mx-auto max-w-lg p-8 text-center">
        <h1 className="text-2xl font-bold">Adventurer Not Found</h1>
        <p className="mt-2 text-sm text-muted">
          No character with handle @{handle} was found in the Guild Hall.
        </p>
        <Link
          to="/guild"
          className="rpg-btn-primary mt-5 inline-block rounded-xl px-4 py-2 text-sm font-bold"
        >
          Back to Guild Hall
        </Link>
      </section>
    );
  }

  const isActiveSubject =
    rawEntry.userId === (activeProfile?.id ?? '22222222-2222-4222-8222-222222222222');
  const entry = isActiveSubject
    ? {
        ...rawEntry,
        totalXp: rawEntry.totalXp + sessionEarnedXp,
        completedLessons: rawEntry.completedLessons + Math.max(0, completedLessonIds.length - 1),
        passedQuizzes: rawEntry.passedQuizzes + passedQuizCourseIds.length,
        certificatesEarned: rawEntry.certificatesEarned + claimedCertificateIds.length,
      }
    : rawEntry;

  const levelProgress = progressFor(entry.totalXp, GAME_RULES.characterLevelScale);
  const title = titleFor(levelProgress.level);
  const stage = stageFor(levelProgress.level);
  const mood = pipMoodForStats(entry.completedLessons, entry.passedQuizzes);
  const stageTheme = MOOD_STAGE_THEME[mood];
  const baseSpeech = pipLineFor(mood, entry.handle);
  const speech =
    hop === 0 ? baseSpeech : (SHEET_REACTIONS[(hop - 1) % SHEET_REACTIONS.length] ?? baseSpeech);
  const classInfo = CLASS_INFO[entry.characterClass];
  const badges = earnedBadgesFor({
    completedLessons: entry.completedLessons,
    streakDays: entry.streakDays,
    passedQuizzes: entry.passedQuizzes,
    distinctSkillsCount: entry.distinctSkillsCount,
    certificatesEarned: entry.certificatesEarned,
    reviewsCount: entry.reviewsCount,
  });

  const handleTapPip = () => {
    const next = hop + 1;
    setHop(next);
    sfx.hop(next);
    setSparks((prev) => [
      ...prev.slice(-3),
      { id: `${Date.now()}`, label: 'CHEER!', tone: 'gold', xOffset: (Math.random() - 0.5) * 44 },
    ]);
  };

  return (
    <section className="space-y-6">
      <Link
        to="/guild"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-brand"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span>Back to Guild Hall</span>
      </Link>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <m.div
          style={{ backgroundColor: stageTheme.bg, color: stageTheme.text }}
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          className="rpg-card relative flex flex-col items-center p-6 text-center"
        >
          <FloatingParticles items={sparks} />

          <AnimatePresence mode="wait">
            <m.div
              key={`${entry.handle}-${hop}`}
              initial={reduce ? false : { opacity: 0, scale: 0.7, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 420, damping: 22 }}
              className="relative rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#2A1E3B] shadow-[0_4px_0_rgba(42,30,59,0.2)]"
            >
              &ldquo;{speech}&rdquo;
            </m.div>
          </AnimatePresence>

          <m.button
            type="button"
            whileTap={reduce ? undefined : { scale: 0.92 }}
            onClick={handleTapPip}
            aria-label={`Tap Pip for ${entry.fullName}`}
            className="mt-4 cursor-pointer rounded-3xl p-2 focus-visible:outline-2 focus-visible:outline-white"
          >
            <Pip
              stage={stage}
              mood={mood}
              hop={hop}
              tint={entry.pipTint}
              accessory={entry.pipAccessory}
              className="h-auto w-52"
            />
          </m.button>

          <h1 className="mt-2 text-2xl font-bold">{entry.fullName}</h1>
          <p className="font-mono text-xs opacity-90">
            @{entry.handle} · {classInfo.label}
          </p>
          <p className="mt-2 text-xs font-medium opacity-85">{classInfo.motto}</p>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-sm">
              <Shield className="h-3.5 w-3.5" aria-hidden="true" />
              Stage: <span className="capitalize">{stage}</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-sm">
              <Flame className="h-3.5 w-3.5" aria-hidden="true" />
              {entry.streakDays}d Streak
            </span>
          </div>
        </m.div>

        <div className="space-y-5">
          <div className="rpg-card flex flex-wrap items-center gap-5 p-6">
            <m.div
              whileHover={reduce ? undefined : { rotate: -4, scale: 1.06 }}
              className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-brand text-on-brand shadow-[0_4px_0_var(--brand-deep)]"
            >
              <span className="font-display text-3xl font-bold leading-none">
                <CountUpValue value={levelProgress.level} duration={700} />
              </span>
              <span className="mt-1 text-[10px] font-bold uppercase tracking-wider">Level</span>
            </m.div>

            <div className="min-w-[220px] flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-xl font-bold">{title}</h2>
                <span className="font-mono text-sm font-bold text-brand">
                  <CountUpValue value={entry.totalXp} suffix=" XP" />
                </span>
              </div>
              <div className="mt-2 h-3.5 w-full overflow-hidden rounded-full bg-surface-2">
                <m.div
                  initial={reduce ? false : { width: 0 }}
                  animate={{ width: `${Math.round(levelProgress.fraction * 100)}%` }}
                  transition={{ type: 'spring', stiffness: 70, damping: 16, delay: 0.15 }}
                  className="xp-bar-fill h-full rounded-full bg-gradient-to-r from-brand to-gold"
                />
              </div>
              <p className="mt-2 text-xs font-semibold text-muted">
                {levelProgress.into} / {levelProgress.span} XP to Level {levelProgress.level + 1} ·{' '}
                {entry.completedLessons} quests · {entry.passedQuizzes} bosses ·{' '}
                {entry.certificatesEarned} certs
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rpg-card p-5">
              <h2 className="text-lg font-bold">Skill Mastery</h2>
              <ul className="mt-4 space-y-3">
                {SKILLS.map((skill, idx) => {
                  const skillXp = entry.skillXp[skill] ?? 0;
                  const skillProgress = progressFor(skillXp, GAME_RULES.skillLevelScale);
                  return (
                    <li key={skill} className="grid grid-cols-[90px_1fr_44px] items-center gap-2">
                      <span className="text-xs font-bold">{SKILL_LABELS[skill]}</span>
                      <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
                        <m.div
                          initial={reduce ? false : { scaleX: 0 }}
                          animate={{ scaleX: skillProgress.fraction }}
                          style={{ originX: 0 }}
                          transition={{
                            type: 'spring',
                            stiffness: 90,
                            damping: 18,
                            delay: 0.2 + idx * 0.06,
                          }}
                          className="h-full w-full rounded-full bg-brand"
                        />
                      </div>
                      <span className="text-right font-mono text-xs font-bold text-muted">
                        Lv.{skillProgress.level}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="rpg-card p-5">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Award className="h-5 w-5 text-gold-deep" aria-hidden="true" />
                <span>Earned Badges ({badges.length})</span>
              </h2>
              {badges.length === 0 ? (
                <p className="mt-3 text-sm text-muted">
                  Complete your first lesson quest to unlock your starting badge.
                </p>
              ) : (
                <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {badges.map((badge, idx) => (
                    <m.li
                      key={badge.id}
                      initial={reduce ? false : { scale: 0.7, rotate: -12, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      whileHover={reduce ? undefined : { y: -4, rotate: -3, scale: 1.03 }}
                      transition={{
                        type: 'spring',
                        stiffness: 340,
                        damping: 16,
                        delay: 0.2 + idx * 0.06,
                      }}
                      className="flex cursor-default items-start gap-2.5 rounded-xl border border-line bg-surface-2/70 p-3"
                    >
                      <span className="text-xl" aria-hidden="true">
                        {badge.icon}
                      </span>
                      <div>
                        <p className="font-display text-sm font-bold">{badge.name}</p>
                        <p className="text-xs text-muted">{badge.description}</p>
                      </div>
                    </m.li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
