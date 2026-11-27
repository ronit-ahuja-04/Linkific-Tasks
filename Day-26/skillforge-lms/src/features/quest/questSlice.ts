import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RewardCelebration } from '../../components/game/RewardOverlay';
import { DEMO_REALM_CURRICULA, type RealmReview } from '../../lib/demoCurricula';
import { earnedBadgesFor } from '../../lib/game/badges';
import { GAME_RULES } from '../../lib/game/catalog';
import { levelFor, titleFor } from '../../lib/game/xp';
import type { PipMood } from '../../types/lms';

const QUEST_STORAGE_KEY = 'skillforge_quest_progress_v1';

export interface QuestState {
  enrolledCourseIds: string[];
  completedLessonIds: string[];
  passedQuizCourseIds: string[];
  claimedCertificateIds: string[];
  bestQuizScores: Record<string, number>;
  arcadeSolvedIds: string[];
  sessionEarnedXp: number;
  comboCount: number;
  comboBest: number;
  reviewsByCourse: Record<string, RealmReview[]>;
  activeReward: RewardCelebration | null;
}

interface PersistedQuestState {
  enrolledCourseIds?: string[];
  completedLessonIds?: string[];
  passedQuizCourseIds?: string[];
  claimedCertificateIds?: string[];
  bestQuizScores?: Record<string, number>;
  arcadeSolvedIds?: string[];
  sessionEarnedXp?: number;
  comboBest?: number;
  reviewsByCourse?: Record<string, RealmReview[]>;
}

function initialReviews(): Record<string, RealmReview[]> {
  const out: Record<string, RealmReview[]> = {};
  for (const [courseId, cur] of Object.entries(DEMO_REALM_CURRICULA)) {
    out[courseId] = [...cur.initialReviews];
  }
  return out;
}

function loadInitialQuestState(): QuestState {
  const baseReviews = initialReviews();
  const defaults: QuestState = {
    enrolledCourseIds: ['c1111111-1111-4111-8111-111111111111'],
    completedLessonIds: ['node-react-1'],
    passedQuizCourseIds: [],
    claimedCertificateIds: [],
    bestQuizScores: {},
    arcadeSolvedIds: [],
    sessionEarnedXp: 0,
    comboCount: 0,
    comboBest: 0,
    reviewsByCourse: baseReviews,
    activeReward: null,
  };

  if (typeof window === 'undefined') return defaults;
  try {
    const raw = window.localStorage.getItem(QUEST_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as PersistedQuestState;
    return {
      enrolledCourseIds: parsed.enrolledCourseIds ?? defaults.enrolledCourseIds,
      completedLessonIds: parsed.completedLessonIds ?? defaults.completedLessonIds,
      passedQuizCourseIds: parsed.passedQuizCourseIds ?? defaults.passedQuizCourseIds,
      claimedCertificateIds: parsed.claimedCertificateIds ?? defaults.claimedCertificateIds,
      bestQuizScores: parsed.bestQuizScores ?? defaults.bestQuizScores,
      arcadeSolvedIds: parsed.arcadeSolvedIds ?? defaults.arcadeSolvedIds,
      sessionEarnedXp: parsed.sessionEarnedXp ?? 0,
      comboCount: 0,
      comboBest: parsed.comboBest ?? 0,
      reviewsByCourse: parsed.reviewsByCourse ?? baseReviews,
      activeReward: null,
    };
  } catch {
    return defaults;
  }
}

function persistQuestState(state: QuestState): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: PersistedQuestState = {
      enrolledCourseIds: state.enrolledCourseIds,
      completedLessonIds: state.completedLessonIds,
      passedQuizCourseIds: state.passedQuizCourseIds,
      claimedCertificateIds: state.claimedCertificateIds,
      bestQuizScores: state.bestQuizScores,
      arcadeSolvedIds: state.arcadeSolvedIds,
      sessionEarnedXp: state.sessionEarnedXp,
      comboBest: state.comboBest,
      reviewsByCourse: state.reviewsByCourse,
    };
    window.localStorage.setItem(QUEST_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage errors in restricted contexts
  }
}

export interface CompleteQuestPayload {
  lessonId: string;
  courseId: string;
  lessonTitle: string;
  xpReward: number;
  baseUserXp: number;
  baseCompletedLessons: number;
  basePassedQuizzes: number;
  baseCertificates: number;
  streakDays: number;
  pipTint: number;
  pipAccessory: number;
}

export interface PassBossPayload {
  courseId: string;
  courseTitle: string;
  bossName: string;
  scorePercent: number;
  xpReward: number;
  baseUserXp: number;
  baseCompletedLessons: number;
  basePassedQuizzes: number;
  baseCertificates: number;
  streakDays: number;
  pipTint: number;
  pipAccessory: number;
}

export interface ClaimCertificatePayload {
  courseId: string;
  courseTitle: string;
  baseUserXp: number;
  pipTint: number;
  pipAccessory: number;
}

export interface SolveArcadePayload {
  challengeId: string;
  xpReward: number;
}

export interface AddReviewPayload {
  courseId: string;
  review: RealmReview;
}

const questSlice = createSlice({
  name: 'quest',
  initialState: loadInitialQuestState(),
  reducers: {
    enrollInRealm(state, action: PayloadAction<string>) {
      if (!state.enrolledCourseIds.includes(action.payload)) {
        state.enrolledCourseIds.push(action.payload);
        persistQuestState(state);
      }
    },
    incrementCombo(state) {
      state.comboCount += 1;
      if (state.comboCount > state.comboBest) {
        state.comboBest = state.comboCount;
      }
      persistQuestState(state);
    },
    resetCombo(state) {
      state.comboCount = 0;
    },
    solveArcadeChallenge(state, action: PayloadAction<SolveArcadePayload>) {
      const { challengeId, xpReward } = action.payload;
      state.comboCount += 1;
      if (state.comboCount > state.comboBest) {
        state.comboBest = state.comboCount;
      }
      if (!state.arcadeSolvedIds.includes(challengeId)) {
        state.arcadeSolvedIds.push(challengeId);
        state.sessionEarnedXp += xpReward;
      }
      persistQuestState(state);
    },
    completeQuestNode(state, action: PayloadAction<CompleteQuestPayload>) {
      const p = action.payload;
      if (!state.enrolledCourseIds.includes(p.courseId)) {
        state.enrolledCourseIds.push(p.courseId);
      }
      const alreadyDone = state.completedLessonIds.includes(p.lessonId);
      const xpGained = alreadyDone ? 0 : p.xpReward;
      const prevTotalXp = p.baseUserXp + state.sessionEarnedXp;
      const prevLevel = levelFor(prevTotalXp, GAME_RULES.characterLevelScale);

      const prevBadges = earnedBadgesFor({
        completedLessons: p.baseCompletedLessons + state.completedLessonIds.length,
        streakDays: p.streakDays,
        passedQuizzes: p.basePassedQuizzes + state.passedQuizCourseIds.length,
        distinctSkillsCount: 3,
        certificatesEarned: p.baseCertificates + state.claimedCertificateIds.length,
        reviewsCount: 1,
      });

      if (!alreadyDone) {
        state.completedLessonIds.push(p.lessonId);
        state.sessionEarnedXp += xpGained;
      }
      state.comboCount += 1;
      if (state.comboCount > state.comboBest) {
        state.comboBest = state.comboCount;
      }

      const nextTotalXp = p.baseUserXp + state.sessionEarnedXp;
      const nextLevel = levelFor(nextTotalXp, GAME_RULES.characterLevelScale);
      const nextBadges = earnedBadgesFor({
        completedLessons: p.baseCompletedLessons + state.completedLessonIds.length,
        streakDays: p.streakDays,
        passedQuizzes: p.basePassedQuizzes + state.passedQuizCourseIds.length,
        distinctSkillsCount: 3,
        certificatesEarned: p.baseCertificates + state.claimedCertificateIds.length,
        reviewsCount: 1,
      });
      const prevIds = new Set(prevBadges.map((b) => b.id));
      const unlocked = nextBadges
        .filter((b) => !prevIds.has(b.id))
        .map((b) => ({ id: b.id, name: b.name, icon: b.icon }));

      const mood: PipMood = nextLevel > prevLevel ? 'proud' : xpGained > 0 ? 'happy' : 'fired_up';
      state.activeReward = {
        headline: alreadyDone ? 'Practice Replay Cleared!' : 'Quest Node Cleared!',
        subtitle: p.lessonTitle,
        xpGained,
        newTotalXp: nextTotalXp,
        newLevel: nextLevel,
        levelTitle: titleFor(nextLevel),
        leveledUp: nextLevel > prevLevel,
        mood,
        pipTint: p.pipTint,
        pipAccessory: p.pipAccessory,
        pipLine: alreadyDone
          ? 'Sharp practice run! Anti-farming keeps net XP fair — onwards!'
          : 'Smooth execution! That node glowed gold the moment you cleared it.',
        unlockedBadges: unlocked,
        ctaLabel: 'Back to Quest Path',
      };
      persistQuestState(state);
    },
    passRealmBoss(state, action: PayloadAction<PassBossPayload>) {
      const p = action.payload;
      const alreadyPassed = state.passedQuizCourseIds.includes(p.courseId);
      const prevBest = state.bestQuizScores[p.courseId] ?? 0;
      const improved = p.scorePercent > prevBest;
      const xpGained = !alreadyPassed ? p.xpReward : improved ? 50 : 0;

      const prevTotalXp = p.baseUserXp + state.sessionEarnedXp;
      const prevLevel = levelFor(prevTotalXp, GAME_RULES.characterLevelScale);
      const prevBadges = earnedBadgesFor({
        completedLessons: p.baseCompletedLessons + state.completedLessonIds.length,
        streakDays: p.streakDays,
        passedQuizzes: p.basePassedQuizzes + state.passedQuizCourseIds.length,
        distinctSkillsCount: 3,
        certificatesEarned: p.baseCertificates + state.claimedCertificateIds.length,
        reviewsCount: 1,
      });

      if (!alreadyPassed) {
        state.passedQuizCourseIds.push(p.courseId);
      }
      if (improved) {
        state.bestQuizScores[p.courseId] = p.scorePercent;
      }
      state.sessionEarnedXp += xpGained;

      const nextTotalXp = p.baseUserXp + state.sessionEarnedXp;
      const nextLevel = levelFor(nextTotalXp, GAME_RULES.characterLevelScale);
      const nextBadges = earnedBadgesFor({
        completedLessons: p.baseCompletedLessons + state.completedLessonIds.length,
        streakDays: p.streakDays,
        passedQuizzes: p.basePassedQuizzes + state.passedQuizCourseIds.length,
        distinctSkillsCount: 3,
        certificatesEarned: p.baseCertificates + state.claimedCertificateIds.length,
        reviewsCount: 1,
      });
      const prevIds = new Set(prevBadges.map((b) => b.id));
      const unlocked = nextBadges
        .filter((b) => !prevIds.has(b.id))
        .map((b) => ({ id: b.id, name: b.name, icon: b.icon }));

      state.activeReward = {
        headline: `${p.bossName} Defeated!`,
        subtitle: `${p.courseTitle} · ${p.scorePercent}% Boss Accuracy`,
        xpGained,
        newTotalXp: nextTotalXp,
        newLevel: nextLevel,
        levelTitle: titleFor(nextLevel),
        leveledUp: nextLevel > prevLevel,
        mood: 'fired_up',
        pipTint: p.pipTint,
        pipAccessory: p.pipAccessory,
        pipLine: 'CRITICAL VICTORY! Claim your Realm Certificate right on the quest map!',
        unlockedBadges: unlocked,
        ctaLabel: 'Celebrate & Return to Map',
      };
      persistQuestState(state);
    },
    claimRealmCertificate(state, action: PayloadAction<ClaimCertificatePayload>) {
      const p = action.payload;
      const already = state.claimedCertificateIds.includes(p.courseId);
      const xpGained = already ? 0 : 100;
      const prevTotalXp = p.baseUserXp + state.sessionEarnedXp;
      const prevLevel = levelFor(prevTotalXp, GAME_RULES.characterLevelScale);

      if (!already) {
        state.claimedCertificateIds.push(p.courseId);
        state.sessionEarnedXp += xpGained;
      }

      const nextTotalXp = p.baseUserXp + state.sessionEarnedXp;
      const nextLevel = levelFor(nextTotalXp, GAME_RULES.characterLevelScale);

      state.activeReward = {
        headline: 'Certificate Minted!',
        subtitle: p.courseTitle,
        xpGained,
        newTotalXp: nextTotalXp,
        newLevel: nextLevel,
        levelTitle: titleFor(nextLevel),
        leveledUp: nextLevel > prevLevel,
        mood: 'proud',
        pipTint: p.pipTint,
        pipAccessory: p.pipAccessory,
        pipLine: 'Verifiable Realm Certificate unlocked! Check your Command Center anytime.',
        unlockedBadges: already
          ? []
          : [{ id: 'course_conqueror', name: 'Realm Conqueror', icon: '🏆' }],
        ctaLabel: 'Inspect Certificate',
      };
      persistQuestState(state);
    },
    addRealmReview(state, action: PayloadAction<AddReviewPayload>) {
      const existing = state.reviewsByCourse[action.payload.courseId] ?? [];
      state.reviewsByCourse[action.payload.courseId] = [action.payload.review, ...existing];
      persistQuestState(state);
    },
    dismissReward(state) {
      state.activeReward = null;
    },
  },
});

export const {
  enrollInRealm,
  incrementCombo,
  resetCombo,
  solveArcadeChallenge,
  completeQuestNode,
  passRealmBoss,
  claimRealmCertificate,
  addRealmReview,
  dismissReward,
} = questSlice.actions;
export const questReducer = questSlice.reducer;
