import { m, useReducedMotion } from 'motion/react';
import { Award, Crown, Flame, Trophy } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { CountUpValue } from '../../components/game/CountUpValue';
import { PageHeader } from '../../components/layout';
import { Pip } from '../../components/pip/Pip';
import { Card, ErrorState, LoadingState, buttonClasses } from '../../components/ui';
import { CLASS_INFO, GAME_RULES } from '../../lib/game/catalog';
import { sfx } from '../../lib/game/sfx';
import { progressFor, stageFor, titleFor } from '../../lib/game/xp';
import { fetchGuildLeaderboard } from './guildSlice';

export function GuildPage() {
  const dispatch = useAppDispatch();
  const reduce = useReducedMotion();
  const profile = useAppSelector((state) => state.auth.profile);
  const { entries, status, error } = useAppSelector((state) => state.guild);
  const { sessionEarnedXp, completedLessonIds, passedQuizCourseIds, claimedCertificateIds } =
    useAppSelector((state) => state.quest);

  useEffect(() => {
    void dispatch(fetchGuildLeaderboard(profile));
  }, [dispatch, profile]);

  const rankedEntries = useMemo(() => {
    const activeId = profile?.id ?? '22222222-2222-4222-8222-222222222222';
    return entries
      .map((entry) => {
        if (entry.userId !== activeId && sessionEarnedXp === 0) return entry;
        if (entry.userId !== activeId) return entry;
        return {
          ...entry,
          totalXp: entry.totalXp + sessionEarnedXp,
          completedLessons: entry.completedLessons + Math.max(0, completedLessonIds.length - 1),
          passedQuizzes: entry.passedQuizzes + passedQuizCourseIds.length,
          certificatesEarned: entry.certificatesEarned + claimedCertificateIds.length,
        };
      })
      .sort((a, b) => b.totalXp - a.totalXp);
  }, [
    entries,
    profile?.id,
    sessionEarnedXp,
    completedLessonIds.length,
    passedQuizCourseIds.length,
    claimedCertificateIds.length,
  ]);

  const podium = [rankedEntries[1], rankedEntries[0], rankedEntries[2]];

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="The Guild Hall"
        eyebrowIcon={<Crown className="h-3.5 w-3.5 text-gold-deep" />}
        title="Adventurer Leaderboard"
        description="Ranked by anti-farmed XP across completed quest maps and Boss Battles."
        actions={
          <Link
            to="/courses"
            onClick={() => sfx.tap()}
            className={buttonClasses({ variant: 'gold', size: 'md' })}
          >
            Earn More XP
          </Link>
        }
      />

      {error && (
        <ErrorState
          code={error.code}
          message={error.message}
          onRetry={() => void dispatch(fetchGuildLeaderboard(profile))}
        />
      )}

      {status === 'loading' ? (
        <LoadingState variant="skeleton-rows" count={3} label="Loading Guild Hall leaderboard..." />
      ) : rankedEntries.length === 0 ? (
        <Card padding="lg" className="text-center text-sm text-muted">
          No adventurers in the Guild yet.
        </Card>
      ) : (
        <>
          {rankedEntries.length >= 3 && (
            <div className="grid items-end gap-4 md:grid-cols-3" aria-label="Top three podium">
              {podium.map((entry, podiumIdx) => {
                if (!entry) return null;
                const rank = podiumIdx === 1 ? 1 : podiumIdx === 0 ? 2 : 3;
                const progress = progressFor(entry.totalXp, GAME_RULES.characterLevelScale);
                const stage = stageFor(progress.level);
                const isFirst = rank === 1;

                return (
                  <m.div
                    key={entry.userId}
                    initial={reduce ? false : { opacity: 0, y: 24, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    whileHover={reduce ? undefined : { y: -6 }}
                    transition={{
                      type: 'spring',
                      stiffness: 320,
                      damping: 20,
                      delay: podiumIdx * 0.08,
                    }}
                    className={podiumIdx === 1 ? 'order-first md:order-none' : ''}
                  >
                    <Link
                      to={`/c/${entry.handle}`}
                      onClick={() => sfx.tap()}
                      className={`rpg-card relative flex flex-col items-center p-5 text-center transition-colors hover:border-brand ${
                        isFirst ? 'border-gold bg-gold/10 md:py-7' : ''
                      }`}
                    >
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-display text-xs font-extrabold ${
                          isFirst
                            ? 'bg-gold text-on-gold shadow-[0_3px_0_var(--gold-deep)]'
                            : 'bg-surface-2 text-ink'
                        }`}
                      >
                        {isFirst && <Crown className="h-3.5 w-3.5" aria-hidden="true" />}#{rank}
                      </span>

                      <div className="mt-3">
                        <Pip
                          stage={stage}
                          mood={isFirst || entry.streakDays >= 7 ? 'fired_up' : 'proud'}
                          tint={entry.pipTint}
                          accessory={entry.pipAccessory}
                          className={isFirst ? 'h-auto w-24' : 'h-auto w-20'}
                        />
                      </div>

                      <h2 className="mt-2 font-display text-lg font-bold">{entry.fullName}</h2>
                      <p className="font-mono text-xs text-muted">
                        @{entry.handle} · Lv.{progress.level} {titleFor(progress.level)}
                      </p>

                      <p className="mt-2 inline-flex items-center gap-1 font-display text-xl font-extrabold text-brand">
                        <Trophy className="h-4 w-4 text-gold-deep" aria-hidden="true" />
                        <CountUpValue value={entry.totalXp} suffix=" XP" />
                      </p>
                    </Link>
                  </m.div>
                );
              })}
            </div>
          )}

          <ol className="space-y-3">
            {(rankedEntries.length >= 3 ? rankedEntries.slice(3) : rankedEntries).map(
              (entry, offsetIndex) => {
                const index = rankedEntries.length >= 3 ? offsetIndex + 3 : offsetIndex;
                const progress = progressFor(entry.totalXp, GAME_RULES.characterLevelScale);
                const title = titleFor(progress.level);
                const stage = stageFor(progress.level);
                const classInfo = CLASS_INFO[entry.characterClass];
                const isTop = index === 0;

                return (
                  <m.li
                    key={entry.userId}
                    initial={reduce ? false : { opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={reduce ? undefined : { x: 4 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 22,
                      delay: Math.min(index * 0.05, 0.25),
                    }}
                  >
                    <Link
                      to={`/c/${entry.handle}`}
                      onClick={() => sfx.tap()}
                      className={`rpg-card flex flex-wrap items-center justify-between gap-4 p-4 transition-colors hover:border-brand ${
                        isTop ? 'border-gold bg-gold/5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-base font-bold ${
                            isTop ? 'bg-gold text-on-gold' : 'bg-surface-2 text-ink'
                          }`}
                        >
                          #{index + 1}
                        </span>

                        <div className="h-14 w-14 shrink-0">
                          <Pip
                            stage={stage}
                            mood={entry.streakDays >= 7 ? 'fired_up' : 'happy'}
                            tint={entry.pipTint}
                            accessory={entry.pipAccessory}
                            className="h-auto w-14"
                          />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <strong className="font-display text-lg">{entry.fullName}</strong>
                            <span className="font-mono text-xs text-muted">@{entry.handle}</span>
                            <span className="rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-bold text-brand">
                              Lv. {progress.level} {title}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs font-semibold text-muted">
                            {classInfo.label} · {entry.completedLessons} quests ·{' '}
                            {entry.passedQuizzes} bosses
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {entry.streakDays > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-bold">
                            <Flame className="h-3.5 w-3.5 text-warn" aria-hidden="true" />
                            {entry.streakDays}d
                          </span>
                        )}
                        {entry.certificatesEarned > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-bold">
                            <Award className="h-3.5 w-3.5 text-good" aria-hidden="true" />
                            {entry.certificatesEarned} cert
                          </span>
                        )}
                        <div className="text-right">
                          <div className="inline-flex items-center gap-1 font-display text-lg font-bold text-brand">
                            <Trophy className="h-4 w-4 text-gold-deep" aria-hidden="true" />
                            <CountUpValue value={entry.totalXp} suffix=" XP" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </m.li>
                );
              },
            )}
          </ol>
        </>
      )}
    </section>
  );
}
