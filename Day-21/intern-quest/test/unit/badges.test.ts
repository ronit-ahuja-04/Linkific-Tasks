import { describe, expect, it } from 'vitest';
import { BADGE_IDS, BADGES, earnedBadges, longestStreak } from '@/lib/game';
import { quest, run } from './helpers';

const ids = (quests: Parameters<typeof earnedBadges>[0]) => earnedBadges(quests).map((b) => `${b.id}@${b.day}`);

describe('automatic badges', () => {
  it('none without a published quest', () => {
    expect(earnedBadges([])).toEqual([]);
    expect(earnedBadges([quest(1, { status: 'draft' })])).toEqual([]);
  });

  it('First Quest on the first day logged', () => {
    expect(ids([quest(3)])).toEqual(['first_quest@3']);
  });

  it('7-Day Streak on the seventh day in a row, not before, and a gap resets the count', () => {
    expect(ids(run(6))).not.toContain('streak_7@6');
    expect(ids(run(7))).toContain('streak_7@7');
    const gap = [...run(5), ...[7, 8, 9, 10, 11, 12].map((d) => quest(d))];
    expect(ids(gap).some((b) => b.startsWith('streak_7'))).toBe(false);
    expect(ids([...gap, quest(13)])).toContain('streak_7@13');
  });

  it('Boss Defeated on the first boss quest', () => {
    expect(ids([quest(1), quest(2, { difficulty: 'boss' }), quest(3, { difficulty: 'boss' })])).toContain('boss_defeated@2');
  });

  it('Polyglot once five different skills have XP', () => {
    const quests = [
      quest(1, { skills: ['react', 'state'] }),
      quest(2, { skills: ['react', 'routing'] }),
      quest(3, { skills: ['testing'] }),
      quest(4, { skills: ['auth', 'react'] }),
    ];
    expect(ids(quests.slice(0, 3))).not.toContain('polyglot@3');
    expect(ids(quests)).toContain('polyglot@4');
  });

  it('PR Machine at ten linked pull requests in total', () => {
    const five = Array.from({ length: 5 }, (_, i) => `pr${i}`);
    expect(ids([quest(1, { prLinks: five }), quest(2, { prLinks: five.slice(0, 4) })])).not.toContain('pr_machine@2');
    expect(ids([quest(1, { prLinks: five }), quest(2, { prLinks: five })])).toContain('pr_machine@2');
  });

  it('Unblocked: a blocker, then a LATER hard (or boss) quest in the same skill', () => {
    const blocked = quest(1, { skills: ['auth'], blockers: 'OAuth callback fails' });
    expect(ids([blocked, quest(2, { skills: ['auth'], difficulty: 'normal' })])).not.toContain('unblocked@2');
    expect(ids([blocked, quest(2, { skills: ['testing'], difficulty: 'hard' })])).not.toContain('unblocked@2');
    expect(ids([blocked, quest(2, { skills: ['auth'], difficulty: 'hard' })])).toContain('unblocked@2');
    expect(ids([quest(1, { skills: ['auth'], difficulty: 'hard', blockers: 'stuck' })])).not.toContain('unblocked@1'); // not the same quest
  });

  it('are listed in the order they were earned, whatever order the quests come in', () => {
    expect(ids([quest(2, { difficulty: 'boss' }), quest(1)])).toEqual(['first_quest@1', 'boss_defeated@2']);
  });

  it('every badge id has a name, a description and an icon', () => {
    for (const id of BADGE_IDS) expect(BADGES[id].name && BADGES[id].description && BADGES[id].icon).toBeTruthy();
  });
});

describe('longestStreak', () => {
  it('counts the longest run of consecutive days, ignoring drafts', () => {
    expect(longestStreak([])).toBe(0);
    expect(longestStreak([quest(1), quest(2), quest(4), quest(5), quest(6)])).toBe(3);
    expect(longestStreak([quest(1), quest(2, { status: 'draft' }), quest(3)])).toBe(1);
  });
});
