import 'server-only';
import { BADGES, changeFrom, pipReaction, type CharacterClass, type PipMood, type QuestInput } from '@/lib/game';
import { DbError, type Character, type Quest } from './db';
import { problem } from './http';
import type { SessionUser } from './session';

/** A quest as the API returns it (no internal user id) */
export type QuestDto = Omit<Quest, 'userId'>;
export const toDto = ({ userId: _userId, ...quest }: Quest): QuestDto => quest;

export const asInput = (q: Quest): QuestInput => ({
  id: q.id, day: q.day, date: q.date, difficulty: q.difficulty, skills: q.skills, prLinks: q.prLinks, blockers: q.blockers, status: q.status,
});

/** What saving a published quest earned: the game moment the UI celebrates */
export interface Reward {
  xpGained: number;
  levelUp: boolean;
  level: number;
  title: string;
  newBadges: { id: string; name: string; icon: string }[];
  pip: { line: string; mood: PipMood };
}

export function rewardFor(characterClass: CharacterClass, all: readonly Quest[], saved: Quest): Reward | null {
  if (saved.status !== 'published') return null; // drafts earn nothing (yet)
  const quest = asInput(saved);
  const others = all.filter((q) => q.id !== saved.id).map(asInput);
  const change = changeFrom(characterClass, others, quest);
  const reaction = pipReaction(quest, change);
  return {
    xpGained: change.xpGained,
    levelUp: change.levelUp,
    level: change.newLevel,
    title: change.newTitle,
    newBadges: change.newBadges.map((id) => ({ id, name: BADGES[id].name, icon: BADGES[id].icon })),
    pip: { line: reaction.line, mood: reaction.mood },
  };
}

/**
 * Who may READ a quest: its owner always; anyone else only when it is published, public, and on a public character.
 * Everything else answers 404, so the API never confirms that a private quest exists.
 */
export function canRead(user: SessionUser | null, quest: Quest, character: Character | null): boolean {
  if (user && user.id === quest.userId) return true;
  return quest.status === 'published' && quest.isPublic && character?.isPublic === true;
}

/** Turn an expected database failure into a clear HTTP answer; anything else is rethrown, and withErrors answers it (503 when the database is not answering, 500 for a bug) */
export function fromDbError(error: unknown, conflictMessage: string): Response {
  if (error instanceof DbError && error.kind === 'conflict') return problem(409, conflictMessage);
  if (error instanceof DbError && error.kind === 'invalid') return problem(400, 'A value breaks a rule. Check the fields and try again.');
  throw error;
}
