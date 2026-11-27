import { m, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Lock,
  Play,
  Shield,
  Skull,
  Sparkles,
  Star,
  Swords,
  Trophy,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { CountUpValue } from '../../components/game/CountUpValue';
import { FloatingParticles, type SparkBurstItem } from '../../components/game/FloatingParticles';
import { MicroChallengeCard } from '../../components/game/MicroChallengeCard';
import { Pip } from '../../components/pip/Pip';
import { DEMO_REALM_CURRICULA, type QuestNode, type RealmBoss } from '../../lib/demoCurricula';
import { DEMO_GUILD_ENTRIES } from '../../lib/demoData';
import { CLASS_INFO, SKILL_LABELS } from '../../lib/game/catalog';
import { sfx } from '../../lib/game/sfx';
import { levelFor } from '../../lib/game/xp';
import { fetchRealms } from '../catalog/catalogSlice';
import {
  addRealmReview,
  claimRealmCertificate,
  completeQuestNode,
  enrollInRealm,
  passRealmBoss,
  resetCombo,
} from './questSlice';

function DifficultyPill({ level }: { level: QuestNode['difficulty'] }) {
  const styles: Record<QuestNode['difficulty'], string> = {
    easy: 'bg-good/15 text-good',
    normal: 'bg-brand/15 text-brand',
    hard: 'bg-warn/15 text-warn',
    boss: 'bg-danger/15 text-danger',
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase ${styles[level]}`}
    >
      {level}
    </span>
  );
}

function BossBattleArena({
  boss,
  nodes,
  courseId,
  onJumpToNode,
  onDefeatBoss,
}: {
  boss: RealmBoss;
  nodes: readonly QuestNode[];
  courseId: string;
  onJumpToNode: (order: number) => void;
  onDefeatBoss: (scorePercent: number) => void;
}) {
  const reduce = useReducedMotion();
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [hitShake, setHitShake] = useState(0);
  const [sparks, setSparks] = useState<SparkBurstItem[]>([]);

  const totalQuestions = boss.questions.length;
  const finished = answers.length >= totalQuestions;
  const correctCount = answers.reduce((sum, ans, idx) => {
    const q = boss.questions[idx];
    return sum + (q && ans === q.correctIndex ? 1 : 0);
  }, 0);
  const hpRemaining = Math.max(
    0,
    Math.round(((totalQuestions - correctCount) / Math.max(1, totalQuestions)) * 100),
  );
  const finalScore = Math.round((correctCount / Math.max(1, totalQuestions)) * 100);
  const passed = finalScore >= boss.passScorePercent;

  const missedPointers = boss.questions
    .map((q, idx) => ({ q, ans: answers[idx] }))
    .filter((item) => item.ans !== undefined && item.ans !== item.q.correctIndex);

  const currentQ = boss.questions[questionIdx];

  const handleAnswer = (optIdx: number) => {
    if (!currentQ || finished) return;
    const isHit = optIdx === currentQ.correctIndex;
    const nextAnswers = [...answers, optIdx];
    setAnswers(nextAnswers);

    const id = `${Date.now()}-${optIdx}`;
    if (isHit) {
      sfx.bossHit();
      setHitShake((prev) => prev + 1);
      setSparks((prev) => [...prev.slice(-3), { id, label: 'CRITICAL HIT!', tone: 'gold' }]);
    } else {
      sfx.error();
      setSparks((prev) => [...prev.slice(-3), { id, label: 'BLOCKED!', tone: 'danger' }]);
    }

    if (nextAnswers.length < totalQuestions) {
      setTimeout(() => setQuestionIdx((prev) => prev + 1), 350);
    } else {
      const nextCorrect = nextAnswers.reduce((sum, a, idx) => {
        const q = boss.questions[idx];
        return sum + (q && a === q.correctIndex ? 1 : 0);
      }, 0);
      const pct = Math.round((nextCorrect / Math.max(1, totalQuestions)) * 100);
      if (pct >= boss.passScorePercent) {
        setTimeout(() => onDefeatBoss(pct), 420);
      }
    }
  };

  const handleRetry = () => {
    sfx.tap();
    setQuestionIdx(0);
    setAnswers([]);
    setHitShake(0);
    setSparks([]);
  };

  return (
    <m.div
      key={`${courseId}-${hitShake}`}
      animate={reduce || hitShake === 0 ? undefined : { x: [0, -7, 7, -4, 4, 0] }}
      transition={{ duration: 0.3 }}
      className="rpg-card relative overflow-hidden bg-gradient-to-br from-[#231639] via-[#2A1E3B] to-[#4A2FC9] p-6 text-white"
    >
      <FloatingParticles items={sparks} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1 font-mono text-xs font-bold text-gold">
            <Skull className="h-3.5 w-3.5" aria-hidden="true" />
            {boss.title}
          </span>
          <h3 className="mt-2 font-display text-2xl font-extrabold">{boss.name}</h3>
          <p className="mt-1 text-xs text-white/80">&ldquo;{boss.taunt}&rdquo;</p>
        </div>

        <div className="w-full max-w-xs space-y-1.5">
          <div className="flex items-center justify-between font-mono text-xs font-bold">
            <span>BOSS HP</span>
            <span className="text-gold">{hpRemaining}%</span>
          </div>
          <div className="h-3.5 w-full overflow-hidden rounded-full border border-white/20 bg-black/40">
            <m.div
              initial={false}
              animate={{ width: `${hpRemaining}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="h-full rounded-full bg-gradient-to-r from-[#FF5E7E] to-[#FFC12E]"
            />
          </div>
        </div>
      </div>

      {!finished && currentQ ? (
        <div className="mt-6 space-y-4">
          <p className="font-mono text-xs font-bold text-gold">
            Strike {questionIdx + 1} of {totalQuestions}
          </p>
          <p className="font-display text-lg font-bold">{currentQ.prompt}</p>
          <div className="grid gap-2.5">
            {currentQ.options.map((opt, idx) => (
              <m.button
                key={opt}
                type="button"
                whileHover={reduce ? undefined : { x: 4, scale: 1.01 }}
                whileTap={reduce ? undefined : { scale: 0.98 }}
                onClick={() => handleAnswer(idx)}
                className="rounded-xl border-2 border-white/20 bg-white/10 px-4 py-3 text-left text-sm font-bold text-white transition-colors hover:border-gold hover:bg-white/20"
              >
                {opt}
              </m.button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-5">
          <h4 className="font-display text-xl font-extrabold">
            {passed
              ? `Victory! ${finalScore}% Boss Accuracy`
              : `Regroup & Strike Again (${finalScore}% — need ${boss.passScorePercent}%)`}
          </h4>
          {missedPointers.length > 0 && (
            <ul className="mt-3 space-y-2 text-xs">
              {missedPointers.map((item) => {
                const targetNode = nodes.find((n) => n.order === item.q.remediationNodeOrder);
                return (
                  <li
                    key={item.q.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-black/25 px-3 py-2"
                  >
                    <span>{item.q.remediationHint}</span>
                    {targetNode && (
                      <button
                        type="button"
                        onClick={() => onJumpToNode(targetNode.order)}
                        className="font-mono font-bold text-gold hover:underline"
                      >
                        Replay Node {targetNode.order} →
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRetry}
              className="rpg-btn-gold rounded-xl px-4 py-2 text-xs font-bold"
            >
              {passed ? 'Rematch Boss for Higher Score' : 'Retry Boss Battle'}
            </button>
          </div>
        </div>
      )}
    </m.div>
  );
}

export function RealmQuestPage() {
  const { slug } = useParams();
  const dispatch = useAppDispatch();
  const reduce = useReducedMotion();

  const realms = useAppSelector((state) => state.catalog.realms);
  const catalogStatus = useAppSelector((state) => state.catalog.status);
  const profile = useAppSelector((state) => state.auth.profile);
  const {
    enrolledCourseIds,
    completedLessonIds,
    passedQuizCourseIds,
    claimedCertificateIds,
    comboCount,
    sessionEarnedXp,
    reviewsByCourse,
  } = useAppSelector((state) => state.quest);

  const [selectedOrder, setSelectedOrder] = useState<number | 'boss'>(1);
  const [slideIdx, setSlideIdx] = useState(0);
  const [solvedChallengeNodes, setSolvedChallengeNodes] = useState<string[]>([]);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  useEffect(() => {
    if (realms.length === 0) void dispatch(fetchRealms());
  }, [dispatch, realms.length]);

  const realm = realms.find((r) => r.slug === slug);
  const curriculum = realm ? DEMO_REALM_CURRICULA[realm.id] : undefined;

  if ((catalogStatus === 'idle' || catalogStatus === 'loading') && !realm) {
    return (
      <div className="rpg-card p-8 text-sm font-semibold text-muted" role="status">
        Loading Quest Realm map...
      </div>
    );
  }

  if (!realm || !curriculum) {
    return (
      <section className="rpg-card mx-auto max-w-lg p-8 text-center">
        <h1 className="text-2xl font-bold">Realm Not Discovered Yet</h1>
        <p className="mt-2 text-sm text-muted">
          This Quest Realm has not been charted in local demo data.
        </p>
        <Link
          to="/courses"
          className="rpg-btn-primary mt-5 inline-block rounded-xl px-4 py-2 text-sm font-bold"
        >
          Browse All Realms
        </Link>
      </section>
    );
  }

  const baseEntry =
    DEMO_GUILD_ENTRIES.find((g) => g.userId === profile?.id) ?? DEMO_GUILD_ENTRIES[1];
  const baseUserXp = baseEntry?.totalXp ?? 720;
  const pipTint = profile?.pipTint ?? baseEntry?.pipTint ?? 1;
  const pipAccessory = profile?.pipAccessory ?? baseEntry?.pipAccessory ?? 4;
  const activeLevel = levelFor(baseUserXp + sessionEarnedXp, 100);
  const activeClass = profile?.characterClass ?? baseEntry?.characterClass ?? 'frontend_mage';
  const classMatchesSkill = CLASS_INFO[activeClass].home.includes(realm.skillTag);

  const isEnrolled = enrolledCourseIds.includes(realm.id);
  const completedCount = curriculum.nodes.filter((n) => completedLessonIds.includes(n.id)).length;
  const allNodesCleared = completedCount === curriculum.nodes.length;
  const bossPassed = passedQuizCourseIds.includes(realm.id);
  const certClaimed = claimedCertificateIds.includes(realm.id);
  const totalSteps = curriculum.nodes.length + 1;
  const mapProgress = Math.round(((completedCount + (bossPassed ? 1 : 0)) / totalSteps) * 100);

  const frontierNode = curriculum.nodes.find((n) => !completedLessonIds.includes(n.id)) ?? null;

  const activeNode =
    selectedOrder === 'boss'
      ? null
      : (curriculum.nodes.find((n) => n.order === selectedOrder) ?? curriculum.nodes[0] ?? null);
  const activeSlide = activeNode
    ? (activeNode.slides[slideIdx] ?? activeNode.slides[0])
    : undefined;

  const nodeAlreadyCleared = activeNode ? completedLessonIds.includes(activeNode.id) : false;
  const nodePuzzleSolved = activeNode
    ? solvedChallengeNodes.includes(activeNode.id) || nodeAlreadyCleared
    : false;

  const reviews = reviewsByCourse[realm.id] ?? curriculum.initialReviews;

  const handleSelectNode = (order: number | 'boss') => {
    sfx.tap();
    if (!isEnrolled) {
      dispatch(enrollInRealm(realm.id));
    }
    setSelectedOrder(order);
    setSlideIdx(0);
  };

  const handleCompleteNode = (node: QuestNode) => {
    const adjustedXp = classMatchesSkill ? Math.round((node.xpReward * 11) / 10) : node.xpReward;
    dispatch(
      completeQuestNode({
        lessonId: node.id,
        courseId: realm.id,
        lessonTitle: node.title,
        xpReward: adjustedXp,
        baseUserXp,
        baseCompletedLessons: baseEntry?.completedLessons ?? 0,
        basePassedQuizzes: baseEntry?.passedQuizzes ?? 0,
        baseCertificates: baseEntry?.certificatesEarned ?? 0,
        streakDays: baseEntry?.streakDays ?? 4,
        pipTint,
        pipAccessory,
      }),
    );

    const nextNode = curriculum.nodes.find((n) => n.order === node.order + 1);
    if (nextNode) {
      setSelectedOrder(nextNode.order);
      setSlideIdx(0);
    } else {
      setSelectedOrder('boss');
    }
  };

  const handlePostReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;
    sfx.combo(2);
    dispatch(
      addRealmReview({
        courseId: realm.id,
        review: {
          id: `rev-${Date.now()}`,
          authorName: profile?.fullName ?? 'Guest Adventurer',
          authorHandle: profile?.handle ?? 'adventurer',
          rating: reviewRating,
          comment: reviewText.trim(),
          createdAt: new Date().toISOString(),
        },
      }),
    );
    setReviewText('');
  };

  return (
    <section className="space-y-8">
      <Link
        to="/courses"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-brand"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span>Back to Course Realms</span>
      </Link>

      <div className="rpg-card bg-gradient-to-br from-brand via-brand to-brand-deep p-6 text-on-brand sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/15 px-3 py-1 font-mono text-xs font-bold">
                {realm.category} · {SKILL_LABELS[realm.skillTag]}
              </span>
              {classMatchesSkill && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gold px-3 py-1 font-mono text-xs font-extrabold text-on-gold">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  {CLASS_INFO[activeClass].label} +10% XP Synergy
                </span>
              )}
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{realm.title}</h1>
            <p className="mt-2 text-sm text-white/90">{realm.description}</p>
          </div>

          <div className="flex min-w-[240px] flex-col gap-3 rounded-2xl bg-black/20 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>Realm Conquest</span>
              <span className="font-mono text-gold">
                <CountUpValue value={mapProgress} suffix="%" duration={600} />
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/20">
              <m.div
                initial={false}
                animate={{ width: `${mapProgress}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                className="xp-bar-fill h-full rounded-full bg-gold"
              />
            </div>

            {!isEnrolled ? (
              <m.button
                type="button"
                whileHover={reduce ? undefined : { scale: 1.02 }}
                whileTap={reduce ? undefined : { scale: 0.97 }}
                onClick={() => {
                  sfx.combo(2);
                  dispatch(enrollInRealm(realm.id));
                }}
                className="rpg-btn-gold mt-1 rounded-xl px-4 py-2.5 text-sm font-bold"
              >
                Start Realm (Free Enroll)
              </m.button>
            ) : bossPassed ? (
              <m.button
                type="button"
                whileTap={reduce ? undefined : { scale: 0.97 }}
                onClick={() =>
                  dispatch(
                    claimRealmCertificate({
                      courseId: realm.id,
                      courseTitle: realm.title,
                      baseUserXp,
                      pipTint,
                      pipAccessory,
                    }),
                  )
                }
                className="rpg-btn-gold mt-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"
              >
                <Award className="h-4 w-4" aria-hidden="true" />
                <span>{certClaimed ? 'View Realm Certificate' : 'Claim +100 XP Certificate'}</span>
              </m.button>
            ) : (
              <p className="text-xs font-semibold text-white/85">
                {allNodesCleared
                  ? 'All quest nodes cleared! Challenge the Boss below.'
                  : `${completedCount} of ${curriculum.nodes.length} nodes cleared`}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[380px_1fr]">
        <aside aria-label="Winding quest path" className="rpg-card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Quest Path</h2>
            <span className="rounded-full bg-surface-2 px-2.5 py-0.5 font-mono text-xs font-bold text-brand">
              {completedCount + (bossPassed ? 1 : 0)}/{totalSteps}
            </span>
          </div>

          <div className="mt-5 flex flex-col">
            {curriculum.nodes.map((node, index) => {
              const cleared = completedLessonIds.includes(node.id);
              const isFrontier = frontierNode?.id === node.id;
              const unlocked = cleared || isFrontier || index === 0;
              const selected = selectedOrder === node.order;
              const topActive = index > 0 && (cleared || isFrontier);

              return (
                <div key={node.id} className="flex items-stretch gap-3.5">
                  <div className="flex w-12 shrink-0 flex-col items-center" aria-hidden="true">
                    <div
                      className={`w-1 flex-1 rounded-full ${
                        index === 0 ? 'bg-transparent' : topActive ? 'bg-brand' : 'bg-line'
                      }`}
                    />
                    {isFrontier ? (
                      <m.div
                        animate={reduce ? undefined : { y: [0, -4, 0] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                        className="my-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/15 p-1"
                      >
                        <Pip
                          stage={activeLevel >= 10 ? 'sprite' : 'sprout'}
                          mood="fired_up"
                          tint={pipTint}
                          accessory={pipAccessory}
                          className="h-auto w-10"
                        />
                      </m.div>
                    ) : (
                      <span
                        className={`my-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 font-display text-sm font-extrabold ${
                          cleared
                            ? 'border-good bg-good text-white'
                            : unlocked
                              ? 'border-brand bg-brand text-on-brand'
                              : 'border-line bg-surface-2 text-muted'
                        }`}
                      >
                        {cleared ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : unlocked ? (
                          node.order
                        ) : (
                          <Lock className="h-4 w-4" />
                        )}
                      </span>
                    )}
                    <div
                      className={`w-1 flex-1 rounded-full ${cleared ? 'bg-brand' : 'bg-line'}`}
                    />
                  </div>

                  <div className="min-w-0 flex-1 py-2">
                    <m.button
                      type="button"
                      disabled={!unlocked}
                      whileHover={unlocked && !reduce ? { y: -2, scale: 1.015 } : undefined}
                      whileTap={unlocked && !reduce ? { scale: 0.98 } : undefined}
                      onClick={() => handleSelectNode(node.order)}
                      className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all ${
                        selected
                          ? 'border-brand bg-brand/12 shadow-[0_4px_0_var(--brand-deep)]'
                          : cleared
                            ? 'border-good/70 bg-good/10'
                            : isFrontier
                              ? 'quest-beacon border-brand bg-surface'
                              : 'cursor-not-allowed border-line bg-surface-2/60 opacity-65'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] font-bold uppercase text-muted">
                            Node {node.order}
                            {isFrontier ? ' · Next' : cleared ? ' · Cleared' : ''}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-ink dark:text-gold">
                            +{node.xpReward} XP
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 font-display text-sm font-bold leading-snug">
                          {node.title}
                        </p>
                        <div className="mt-1.5">
                          <DifficultyPill level={node.difficulty} />
                        </div>
                      </div>
                    </m.button>
                  </div>
                </div>
              );
            })}

            <div className="flex items-stretch gap-3.5">
              <div className="flex w-12 shrink-0 flex-col items-center" aria-hidden="true">
                <div
                  className={`w-1 flex-1 rounded-full ${
                    allNodesCleared || bossPassed ? 'bg-gold' : 'bg-line'
                  }`}
                />
                <span
                  className={`my-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 ${
                    bossPassed
                      ? 'border-good bg-good text-white'
                      : allNodesCleared
                        ? 'border-gold bg-[#2A1E3B] text-gold'
                        : 'border-line bg-surface-2 text-muted'
                  }`}
                >
                  <Swords className="h-5 w-5" />
                </span>
                <div className="w-1 flex-1 bg-transparent" />
              </div>

              <div className="min-w-0 flex-1 py-2">
                <m.button
                  type="button"
                  disabled={!allNodesCleared && !bossPassed}
                  whileHover={
                    (allNodesCleared || bossPassed) && !reduce ? { y: -2, scale: 1.015 } : undefined
                  }
                  whileTap={
                    (allNodesCleared || bossPassed) && !reduce ? { scale: 0.98 } : undefined
                  }
                  onClick={() => handleSelectNode('boss')}
                  className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-all ${
                    selectedOrder === 'boss'
                      ? 'border-gold bg-gold text-on-gold shadow-[0_4px_0_var(--gold-deep)]'
                      : bossPassed
                        ? 'border-good/70 bg-good/15'
                        : allNodesCleared
                          ? 'quest-beacon border-gold bg-gold/15'
                          : 'cursor-not-allowed border-line bg-surface-2/60 opacity-70'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-extrabold">{curriculum.boss.name}</p>
                    <p className="mt-0.5 font-mono text-[11px] font-bold">
                      {bossPassed
                        ? 'BOSS DEFEATED ✓'
                        : allNodesCleared
                          ? `BOSS READY · +${curriculum.boss.xpReward} XP`
                          : 'Clear nodes above to unlock'}
                    </p>
                  </div>
                </m.button>
              </div>
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          {selectedOrder === 'boss' ? (
            <BossBattleArena
              boss={curriculum.boss}
              nodes={curriculum.nodes}
              courseId={realm.id}
              onJumpToNode={(order) => handleSelectNode(order)}
              onDefeatBoss={(pct) =>
                dispatch(
                  passRealmBoss({
                    courseId: realm.id,
                    courseTitle: realm.title,
                    bossName: curriculum.boss.name,
                    scorePercent: pct,
                    xpReward: curriculum.boss.xpReward,
                    baseUserXp,
                    baseCompletedLessons: baseEntry?.completedLessons ?? 0,
                    basePassedQuizzes: baseEntry?.passedQuizzes ?? 0,
                    baseCertificates: baseEntry?.certificatesEarned ?? 0,
                    streakDays: baseEntry?.streakDays ?? 4,
                    pipTint,
                    pipAccessory,
                  }),
                )
              }
            />
          ) : activeNode ? (
            <m.div
              key={activeNode.id}
              initial={reduce ? false : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 360, damping: 26 }}
              className="space-y-6"
            >
              <div className="rpg-card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-line bg-surface-2/70 px-6 py-4">
                  <div>
                    <p className="font-mono text-xs font-bold text-brand">
                      {activeNode.moduleTitle} · Node {activeNode.order}
                    </p>
                    <h2 className="mt-0.5 text-2xl font-bold">{activeNode.title}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <DifficultyPill level={activeNode.difficulty} />
                    <span className="rounded-full bg-gold/30 px-3 py-1 font-mono text-xs font-extrabold text-ink dark:text-gold">
                      +{activeNode.xpReward} XP
                    </span>
                  </div>
                </div>

                {activeSlide && (
                  <div className="p-6">
                    <div className="rounded-2xl border-2 border-line bg-[#1A132B] p-6 text-white">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/30 px-3 py-1 font-mono font-bold text-gold">
                          <Play className="h-3 w-3" aria-hidden="true" />
                          {activeSlide.visualTag}
                        </span>
                        <span className="font-mono text-white/75">
                          Concept Card {slideIdx + 1} / {activeNode.slides.length}
                        </span>
                      </div>

                      <h3 className="mt-4 font-display text-xl font-bold text-gold">
                        {activeSlide.heading}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/90">
                        {activeSlide.body}
                      </p>

                      {activeSlide.code && (
                        <pre className="mt-4 overflow-x-auto rounded-xl border border-white/15 bg-black/40 p-4 font-mono text-xs text-[#D9CEFF]">
                          <code>{activeSlide.code}</code>
                        </pre>
                      )}
                    </div>

                    {activeNode.slides.length > 1 && (
                      <div className="mt-4 flex items-center justify-between">
                        <button
                          type="button"
                          disabled={slideIdx === 0}
                          onClick={() => {
                            sfx.tap();
                            setSlideIdx((prev) => Math.max(0, prev - 1));
                          }}
                          className="inline-flex items-center gap-1 rounded-xl border-2 border-line px-3 py-1.5 text-xs font-bold disabled:opacity-45"
                        >
                          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                          Prev Slide
                        </button>

                        <div className="flex gap-1.5">
                          {activeNode.slides.map((s, idx) => (
                            <span
                              key={s.heading}
                              className={`h-2 rounded-full transition-all ${
                                idx === slideIdx ? 'w-6 bg-brand' : 'w-2 bg-line'
                              }`}
                            />
                          ))}
                        </div>

                        <button
                          type="button"
                          disabled={slideIdx >= activeNode.slides.length - 1}
                          onClick={() => {
                            sfx.tap();
                            setSlideIdx((prev) => Math.min(activeNode.slides.length - 1, prev + 1));
                          }}
                          className="inline-flex items-center gap-1 rounded-xl border-2 border-line px-3 py-1.5 text-xs font-bold disabled:opacity-45"
                        >
                          Next Slide
                          <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                    <Flame className="h-4 w-4 text-warn" aria-hidden="true" />
                    <span>Interactive Mastery Check (Required to Clear Node)</span>
                  </h3>
                </div>

                <MicroChallengeCard
                  key={activeNode.challenge.id}
                  challenge={activeNode.challenge}
                  combo={comboCount}
                  solved={nodePuzzleSolved}
                  onSolved={() => {
                    if (!solvedChallengeNodes.includes(activeNode.id)) {
                      setSolvedChallengeNodes((prev) => [...prev, activeNode.id]);
                    }
                  }}
                  onWrong={() => dispatch(resetCombo())}
                />

                <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-line bg-surface p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted">
                    <Shield className="h-4 w-4 text-brand" aria-hidden="true" />
                    <span>
                      {nodeAlreadyCleared
                        ? 'Already cleared — replay anytime with zero XP inflation.'
                        : nodePuzzleSolved
                          ? 'Challenge cracked! Ready to claim Quest XP and advance Pip.'
                          : 'Solve the challenge above to unlock Node Clear.'}
                    </span>
                  </div>

                  <m.button
                    type="button"
                    disabled={!nodePuzzleSolved}
                    whileHover={nodePuzzleSolved && !reduce ? { scale: 1.03 } : undefined}
                    whileTap={nodePuzzleSolved && !reduce ? { scale: 0.96 } : undefined}
                    onClick={() => handleCompleteNode(activeNode)}
                    className="rpg-btn-gold inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trophy className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {nodeAlreadyCleared
                        ? 'Replay Clear & Advance →'
                        : `Claim +${activeNode.xpReward} XP & Advance →`}
                    </span>
                  </m.button>
                </div>
              </div>
            </m.div>
          ) : null}

          <section className="rpg-card p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Star className="h-5 w-5 fill-gold text-gold-deep" aria-hidden="true" />
              <span>Adventurer Reviews ({reviews.length})</span>
            </h2>

            <form
              onSubmit={handlePostReview}
              className="mt-4 space-y-3 rounded-xl bg-surface-2/60 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="realm-review-rating" className="text-xs font-bold text-muted">
                  Your Rating
                </label>
                <select
                  id="realm-review-rating"
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-bold"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} Stars
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={2}
                placeholder="Share what helped you beat this Realm..."
                className="w-full rounded-xl border-2 border-line bg-surface px-3.5 py-2 text-sm focus:border-brand focus:outline-none"
              />
              <button
                type="submit"
                className="rpg-btn-primary rounded-xl px-4 py-2 text-xs font-bold"
              >
                Post Review
              </button>
            </form>

            <ul className="mt-4 space-y-3">
              {reviews.map((rev) => (
                <li key={rev.id} className="rounded-xl border border-line p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-bold">
                      {rev.authorName}{' '}
                      <span className="font-mono text-xs text-muted">@{rev.authorHandle}</span>
                    </span>
                    <span className="font-mono text-xs font-bold text-gold-deep">
                      {'★'.repeat(rev.rating)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted">{rev.comment}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </section>
  );
}
