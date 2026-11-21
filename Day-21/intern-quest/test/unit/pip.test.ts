import { describe, expect, it } from 'vitest';
import { changeFrom, daysBetween, hash, pipMood, pipReaction, SKILLS, stageFor, type Change } from '@/lib/game';
import { quest, run } from './helpers';

const calm: Change = { levelUp: false, newLevel: 2, newTitle: 'Trainee', newBadges: [], skillLevelUps: [], xpGained: 110 };

describe('Pip grows with the character', () => {
  it('Egg, Sprout, Sprite, Guardian at levels 1, 3, 6 and 10', () => {
    expect([1, 2, 3, 5, 6, 9, 10, 30].map(stageFor)).toEqual(['egg', 'egg', 'sprout', 'sprout', 'sprite', 'sprite', 'guardian', 'guardian']);
  });
});

describe('daysBetween', () => {
  it('counts calendar days, across months', () => {
    expect(daysBetween('2026-11-20', '2026-11-23')).toBe(3);
    expect(daysBetween('2026-10-31', '2026-11-01')).toBe(1);
    expect(daysBetween('2026-11-20', '2026-11-20')).toBe(0);
  });
});

describe('pipMood', () => {
  // day N is dated 2026-11-N in the helper
  it('is sleepy with no quests, or when the newest quest is three or more days old', () => {
    expect(pipMood('frontend_mage', [], '2026-11-21')).toBe('sleepy');
    expect(pipMood('frontend_mage', [quest(1), quest(2)], '2026-11-05')).toBe('sleepy');
    expect(pipMood('frontend_mage', [quest(1), quest(2)], '2026-11-04')).not.toBe('sleepy');
  });

  it('is fired up after a boss quest', () => {
    expect(pipMood('frontend_mage', [quest(1), quest(2, { difficulty: 'boss' })], '2026-11-02')).toBe('fired_up');
  });

  it('is proud when the newest quest earned a badge or a level', () => {
    expect(pipMood('frontend_mage', [quest(1)], '2026-11-01')).toBe('proud'); // First Quest badge
    // days 1 to 3 normal JavaScript: 100, 110, 110 = 320 XP: day 3 crosses 300 into level 3
    expect(pipMood('frontend_mage', run(3), '2026-11-03')).toBe('proud');
  });

  it('is worried when the newest quest has blockers (and nothing better happened)', () => {
    expect(pipMood('backend_knight', [quest(1), quest(2, { blockers: 'tests flaky' })], '2026-11-02')).toBe('worried');
  });

  it('is happy otherwise', () => {
    expect(pipMood('backend_knight', [quest(1), quest(2)], '2026-11-02')).toBe('happy');
  });
});

describe('pipReaction', () => {
  it('the most exciting thing wins: level up, badge, boss, blocker, skill level, hard', () => {
    const boss = quest(9, { difficulty: 'boss', blockers: 'x' });
    expect(pipReaction(boss, { ...calm, levelUp: true, newLevel: 5, newTitle: 'Journeyman' }).situation).toBe('level_up');
    expect(pipReaction(boss, { ...calm, newBadges: ['boss_defeated'] }).situation).toBe('new_badge');
    expect(pipReaction(boss, calm).situation).toBe('boss');
    expect(pipReaction(quest(9, { blockers: 'x', difficulty: 'hard' }), calm).situation).toBe('blocked');
    expect(pipReaction(quest(9, { difficulty: 'hard' }), { ...calm, skillLevelUps: ['javascript'] }).situation).toBe('skill_up');
    expect(pipReaction(quest(9, { difficulty: 'hard' }), calm).situation).toBe('hard');
    expect(['skill', 'steady']).toContain(pipReaction(quest(9), calm).situation);
  });

  it('matches the mood to the situation', () => {
    expect(pipReaction(quest(9), { ...calm, levelUp: true }).mood).toBe('proud');
    expect(pipReaction(quest(9, { difficulty: 'boss' }), calm).mood).toBe('fired_up');
    expect(pipReaction(quest(9, { blockers: 'x' }), calm).mood).toBe('worried');
  });

  it('fills in the details', () => {
    expect(pipReaction(quest(9), { ...calm, levelUp: true, newLevel: 7, newTitle: 'Journeyman' }).line).toMatch(/7|Journeyman/);
    expect(pipReaction(quest(9), { ...calm, newBadges: ['polyglot'] }).line).toContain('Polyglot');
  });

  it('is deterministic: the same quest always gets the same line', () => {
    const a = pipReaction(quest(4, { id: 'abc' }), calm);
    const b = pipReaction(quest(4, { id: 'abc' }), calm);
    expect(a).toEqual(b);
  });

  it('never leaves a {placeholder} unfilled, for any situation and skill', () => {
    for (let i = 0; i < 300; i += 1) {
      const skill = SKILLS[i % SKILLS.length] ?? 'react';
      const difficulty = (['easy', 'normal', 'hard', 'boss'] as const)[i % 4] ?? 'normal';
      const reaction = pipReaction(quest(1, { id: `id-${i}`, skills: [skill], difficulty, blockers: i % 5 === 0 ? 'x' : '' }), {
        ...calm, levelUp: i % 7 === 0, newBadges: i % 11 === 0 ? ['streak_7'] : [], skillLevelUps: i % 3 === 0 ? [skill] : [],
      });
      expect(reaction.line).not.toMatch(/[{}]/);
      expect(reaction.line.length).toBeGreaterThan(10);
    }
  });
});

describe('changeFrom', () => {
  it('describes what a new quest changed', () => {
    const change = changeFrom('frontend_mage', run(2), quest(3, { difficulty: 'boss', skills: ['react'] }));
    expect(change.newBadges).toContain('boss_defeated');
    expect(change.levelUp).toBe(true);
    expect(change.xpGained).toBe(302); // (250 × 1.1 = 275) on React, a Mage home skill: 302
    expect(change.skillLevelUps).toEqual(['react']);
  });
});

describe('hash', () => {
  it('is stable and spreads', () => {
    expect(hash('abc')).toBe(hash('abc'));
    expect(new Set(Array.from({ length: 50 }, (_, i) => hash(`q${i}`) % 3)).size).toBe(3);
  });
});
