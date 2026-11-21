import { BADGES, earnedBadges, type BadgeId } from './badges';
import { RULES, SKILL_LABELS, type CharacterClass, type Skill } from './catalog';
import { computeStats, type CharacterStats, type QuestInput } from './xp';

/**
 * PIP, the sidekick. Everything here is a pure function of the quests (and today's date), so Pip's face and
 * words are predictable and tested. Lines are hand-written; which one Pip says is picked by hashing the quest id,
 * so the same quest always gets the same reaction (no randomness, no AI).
 */
export const PIP_STAGES = ['egg', 'sprout', 'sprite', 'guardian'] as const;
export type PipStage = (typeof PIP_STAGES)[number];

export const PIP_MOODS = ['happy', 'worried', 'sleepy', 'proud', 'fired_up'] as const;
export type PipMood = (typeof PIP_MOODS)[number];

export const STAGE_INFO: Record<PipStage, { name: string; from: number }> = {
  egg: { name: 'Egg', from: 1 },
  sprout: { name: 'Sprout', from: 3 },
  sprite: { name: 'Sprite', from: 6 },
  guardian: { name: 'Guardian', from: 10 },
};

export function stageFor(level: number): PipStage {
  if (level >= STAGE_INFO.guardian.from) return 'guardian';
  if (level >= STAGE_INFO.sprite.from) return 'sprite';
  if (level >= STAGE_INFO.sprout.from) return 'sprout';
  return 'egg';
}

/** Whole calendar days between two ISO dates (YYYY-MM-DD), computed in UTC so time zones can not shift it */
export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / 86_400_000);
}

/** What changed when a quest was added: the before and after of the character */
export interface Change {
  levelUp: boolean;
  newLevel: number;
  newTitle: string;
  newBadges: BadgeId[];
  skillLevelUps: Skill[];
  xpGained: number;
}

export function changeFrom(characterClass: CharacterClass, others: readonly QuestInput[], quest: QuestInput): Change {
  const before = computeStats(characterClass, others);
  const after = computeStats(characterClass, [...others, quest]);
  const hadBadges = new Set(earnedBadges(others).map((b) => b.id));
  return {
    levelUp: after.progress.level > before.progress.level,
    newLevel: after.progress.level,
    newTitle: after.title,
    newBadges: earnedBadges([...others, quest]).map((b) => b.id).filter((id) => !hadBadges.has(id)),
    skillLevelUps: quest.skills.filter((s) => after.skills[s].level > before.skills[s].level),
    xpGained: after.totalXp - before.totalXp,
  };
}

const latestOf = (quests: readonly QuestInput[]): QuestInput | undefined =>
  quests.filter((q) => q.status === 'published').reduce<QuestInput | undefined>((best, q) => (!best || q.day > best.day ? q : best), undefined);

/**
 * Pip's mood right now. In order: asleep if nothing was logged lately; fired up after a boss; proud when the
 * newest quest levelled you up or earned a badge; worried when it has blockers; otherwise happy.
 */
export function pipMood(characterClass: CharacterClass, quests: readonly QuestInput[], todayIso: string): PipMood {
  const latest = latestOf(quests);
  if (!latest || daysBetween(latest.date, todayIso) >= RULES.sleepyAfterDays) return 'sleepy';
  if (latest.difficulty === 'boss') return 'fired_up';
  const change = changeFrom(characterClass, quests.filter((q) => q.id !== latest.id), latest);
  if (change.levelUp || change.newBadges.length > 0) return 'proud';
  if (latest.blockers.trim() !== '') return 'worried';
  return 'happy';
}

// ---------------------------------------------------------------- what Pip says

export type Situation = 'level_up' | 'new_badge' | 'boss' | 'blocked' | 'skill_up' | 'hard' | 'skill' | 'steady';

const MOOD_FOR: Record<Situation, PipMood> = {
  level_up: 'proud', new_badge: 'proud', boss: 'fired_up', blocked: 'worried',
  skill_up: 'happy', hard: 'happy', skill: 'happy', steady: 'happy',
};

/** {skill} {level} {title} {badge} {xp} are filled in */
const LINES: Record<Exclude<Situation, 'skill'>, readonly string[]> = {
  level_up: [
    'LEVEL {level}! You are officially a {title}. I am telling everyone.',
    'Level {level}. {title}. I would bow, but I am mostly round.',
    'You levelled up! {title} {level}. Can we celebrate with snacks?',
  ],
  new_badge: [
    'You earned {badge}! Can I hold it? I will be careful.',
    '{badge}! That is going straight on the wall.',
    'A new badge: {badge}. I knew it. I absolutely knew it.',
  ],
  boss: [
    'A BOSS fight with {skill}? Show-off. +{xp} XP.',
    'You faced the boss and the boss lost. {xp} XP for the hero.',
    'I hid behind you the whole time. Worth it. Boss down, +{xp} XP.',
  ],
  blocked: [
    'Blockers are just side quests in disguise. We will get it tomorrow.',
    'Stuck on something? Write it down, sleep on it, ask the guild. In that order.',
    'Hmm. That blocker looks grumpy. I will glare at it for you.',
  ],
  skill_up: [
    '{skill} went up a level. I felt that.',
    'Your {skill} is getting scary. In a good way.',
    '{skill} level up! At this rate you will be teaching me.',
  ],
  hard: [
    'That was a hard one and you did it anyway. +{xp} XP.',
    'Tough quest, cleanly done. I am impressed and slightly sweaty.',
  ],
  steady: [
    'Another day, another +{xp} XP. Steady wins the internship.',
    'Logged and counted. Small quests build big heroes.',
    '+{xp} XP. I added it to my scrapbook.',
  ],
};

const SKILL_LINES: Record<Skill, readonly string[]> = {
  html_css: ['Semantic HTML! The screen readers send their thanks.', 'Flexbox AND grid? Fancy.'],
  javascript: ['JavaScript tamed for another day. Mostly.', 'Async, await, and not a single callback pyramid. Proud of you.'],
  react: ['Components all the way down. Nice.', 'You lifted state up and the app did not fall down.'],
  state: ['State managed. Unlike my snack cupboard.', 'One source of truth. I wish I had one.'],
  routing: ['Every page has a URL now. Bookmarks rejoice.', 'Routes! I love a good map.'],
  styling: ['It looks good now. Like, really good.', 'Dark mode? For me? You shouldn’t have.'],
  testing: ['Tests are like armour. You are very shiny today.', 'Green ticks everywhere. My favourite colour.'],
  typescript: ['Types caught a bug before it caught you.', 'No `any` today. I checked.'],
  nextjs: ['Server components, client components. You speak both now.', 'Static, dynamic, streamed. You make it look easy.'],
  backend: ['You built the part nobody sees. I see it.', 'An API that answers politely. Rare.'],
  database: ['Rows, columns, relations. Very tidy.', 'The data is safe with you. And indexed.'],
  auth: ['Locks on all the doors. Only friends get in.', 'Sessions, tokens, cookies. And not the edible kind.'],
  devops: ['Shipped! It is on the internet now. Wave!', 'The pipeline is green. Everyone breathe.'],
};

/** FNV-1a: a tiny, stable string hash, so the same quest always picks the same line */
export function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

const pick = (lines: readonly string[], key: string): string => lines[hash(key) % lines.length] ?? lines[0] ?? '';

export interface Reaction {
  situation: Situation;
  mood: PipMood;
  line: string;
}

/** What Pip says about a quest that was just saved. The most exciting thing that happened wins. */
export function pipReaction(quest: QuestInput, change: Change): Reaction {
  const firstSkill = quest.skills[0];
  const situation: Situation =
    change.levelUp ? 'level_up'
    : change.newBadges.length > 0 ? 'new_badge'
    : quest.difficulty === 'boss' ? 'boss'
    : quest.blockers.trim() !== '' ? 'blocked'
    : change.skillLevelUps.length > 0 ? 'skill_up'
    : quest.difficulty === 'hard' ? 'hard'
    : firstSkill && hash(quest.id) % 2 === 0 ? 'skill'
    : 'steady';

  const skill = change.skillLevelUps[0] ?? firstSkill;
  const badge = change.newBadges[0];
  const template = situation === 'skill' && firstSkill ? pick(SKILL_LINES[firstSkill], quest.id) : pick(LINES[situation === 'skill' ? 'steady' : situation], `${quest.id}:${situation}`);
  const line = template
    .replaceAll('{skill}', skill ? SKILL_LABELS[skill] : 'that')
    .replaceAll('{level}', String(change.newLevel))
    .replaceAll('{title}', change.newTitle)
    .replaceAll('{badge}', badge ? BADGES[badge].name : 'a badge')
    .replaceAll('{xp}', String(change.xpGained));
  return { situation, mood: MOOD_FOR[situation], line };
}

/** Everything the UI needs about Pip for a character */
export interface PipState {
  stage: PipStage;
  mood: PipMood;
}
export function pipState(characterClass: CharacterClass, quests: readonly QuestInput[], stats: CharacterStats, todayIso: string): PipState {
  return { stage: stageFor(stats.progress.level), mood: pipMood(characterClass, quests, todayIso) };
}
