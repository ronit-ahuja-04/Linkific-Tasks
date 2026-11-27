import { describe, expect, it } from 'vitest';
import { earnedBadgesFor } from '../src/lib/game/badges';
import { GAME_RULES } from '../src/lib/game/catalog';
import {
  lessonXpFor,
  levelFor,
  levelStart,
  progressFor,
  quizXpFor,
  stageFor,
  titleFor,
} from '../src/lib/game/xp';

describe('SkillForge RPG game engine', () => {
  it('computes levels, progress, titles, and Pip stages with integer math', () => {
    expect(levelStart(1, GAME_RULES.characterLevelScale)).toBe(0);
    expect(levelStart(2, GAME_RULES.characterLevelScale)).toBe(100);
    expect(levelStart(3, GAME_RULES.characterLevelScale)).toBe(300);

    expect(levelFor(0, 100)).toBe(1);
    expect(levelFor(99, 100)).toBe(1);
    expect(levelFor(100, 100)).toBe(2);
    expect(levelFor(300, 100)).toBe(3);

    const prog = progressFor(200, 100);
    expect(prog.level).toBe(2);
    expect(prog.into).toBe(100);
    expect(prog.span).toBe(200);
    expect(prog.fraction).toBe(0.5);

    expect(titleFor(1)).toBe('Trainee');
    expect(titleFor(5)).toBe('Journeyman');
    expect(titleFor(16)).toBe('Master');

    expect(stageFor(1)).toBe('egg');
    expect(stageFor(3)).toBe('sprout');
    expect(stageFor(6)).toBe('sprite');
    expect(stageFor(10)).toBe('guardian');
  });

  it('prevents lesson XP farming and applies +10% home-skill class bonus', () => {
    expect(lessonXpFor('normal', 'react', 'frontend_mage', true)).toBe(110);
    expect(lessonXpFor('normal', 'database', 'frontend_mage', true)).toBe(100);
    expect(lessonXpFor('boss', 'react', 'frontend_mage', false)).toBe(0);
  });

  it('prevents quiz XP farming and rewards only improvement delta on retakes', () => {
    expect(quizXpFor(250, 60, 70, 0, false)).toBe(0);
    expect(quizXpFor(250, 80, 70, 0, false)).toBe(330);
    expect(quizXpFor(250, 80, 70, 80, true)).toBe(0);
    expect(quizXpFor(250, 95, 70, 80, true)).toBe(15);
  });

  it('derives automatic badges deterministically from progress counts', () => {
    const badges = earnedBadgesFor({
      completedLessons: 5,
      streakDays: 7,
      passedQuizzes: 1,
      distinctSkillsCount: 3,
      certificatesEarned: 1,
      reviewsCount: 1,
    });
    expect(badges.map((b) => b.id)).toEqual([
      'first_quest',
      'streak_7',
      'boss_slayer',
      'polyglot',
      'course_conqueror',
      'trusted_critic',
    ]);
  });
});
