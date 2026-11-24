import { describe, expect, it } from 'vitest';
import { CLASS_INFO, CLASSES, computeStats, DIFFICULTIES, DIFFICULTY_XP, levelFor, levelStart, progressFor, questXp, SKILLS, titleFor, topSkills } from '@/lib/game';
import { quest } from './helpers';

describe('questXp', () => {
  const none = new Set<number>();

  it('starts from the difficulty', () => {
    for (const difficulty of DIFFICULTIES) {
      expect(questXp(quest(1, { difficulty, skills: ['testing'] }), 'frontend_mage', none).raw).toBe(DIFFICULTY_XP[difficulty]);
    }
  });

  it('adds 20 per PR link, counting at most three', () => {
    const links = (n: number) => Array.from({ length: n }, (_, i) => `https://example.com/pull/${i}`);
    expect(questXp(quest(1, { prLinks: links(2), skills: ['testing'] }), 'frontend_mage', none).prBonus).toBe(40);
    expect(questXp(quest(1, { prLinks: links(5), skills: ['testing'] }), 'frontend_mage', none).prBonus).toBe(60);
  });

  it('adds 10% (rounded down) when the previous day was logged', () => {
    const xp = questXp(quest(2, { prLinks: ['a'], skills: ['testing'] }), 'frontend_mage', new Set([1]));
    expect(xp.streak).toBe(true);
    expect(xp.raw).toBe(132); // (100 + 20) × 1.1
    expect(questXp(quest(2, { difficulty: 'easy', skills: ['testing'] }), 'frontend_mage', new Set([1])).raw).toBe(55);
  });

  it('splits XP evenly across skills (rounded down) and gives the class bonus on home skills', () => {
    const xp = questXp(quest(1, { difficulty: 'hard', skills: ['react', 'testing', 'devops'] }), 'frontend_mage', none);
    expect(xp.shares).toEqual({ react: 55, testing: 50, devops: 50 }); // 150 / 3 = 50; react is a Mage home skill: 55
    expect(xp.total).toBe(155);
  });
});

describe('computeStats, a worked example (checked by hand)', () => {
  // Full-stack Ranger. Day 1: normal, React + Testing, 2 PRs. Day 2: boss, Next.js, 4 PRs.
  //   day 1: 100 + 40 = 140, no streak; 140 / 2 = 70 each; React is home: 77; Testing 70        -> 147
  //   day 2: 250 + 60 (capped at 3 PRs) = 310; streak: 341; Next.js is home: 375                 -> 375
  //   total 522: level 3 (300 to 599), title Apprentice; Next.js 375: skill level 4 (300 to 499)
  const stats = computeStats('fullstack_ranger', [
    quest(1, { skills: ['react', 'testing'], prLinks: ['a', 'b'] }),
    quest(2, { difficulty: 'boss', skills: ['nextjs'], prLinks: ['a', 'b', 'c', 'd'] }),
  ]);

  it('adds up to the hand-worked numbers', () => {
    expect(stats.quests.get('q1')?.total).toBe(147);
    expect(stats.quests.get('q2')?.total).toBe(375);
    expect(stats.totalXp).toBe(522);
    expect(stats.progress).toMatchObject({ level: 3, into: 222, span: 300 });
    expect(stats.title).toBe('Apprentice');
    expect(stats.skills.nextjs).toEqual({ xp: 375, level: 4 });
    expect(stats.skills.react).toEqual({ xp: 77, level: 2 });
    expect(stats.skills.database).toEqual({ xp: 0, level: 1 });
  });

  it('ranks the skills by XP', () => {
    expect(topSkills(stats).map((s) => s.skill)).toEqual(['nextjs', 'react', 'testing']);
    expect(topSkills(stats, 1)).toHaveLength(1);
  });
});

describe('drafts', () => {
  it('earn nothing and do not count for the streak', () => {
    const stats = computeStats('design_bard', [quest(1, { status: 'draft' }), quest(2)]);
    expect(stats.publishedCount).toBe(1);
    expect(stats.totalXp).toBe(100);
    expect(stats.quests.get('q2')?.streak).toBe(false);
  });
});

describe('levels and titles', () => {
  it('level L starts at 100 × L(L-1)/2', () => {
    expect([0, 99, 100, 299, 300, 599, 600].map((xp) => levelFor(xp, 100))).toEqual([1, 1, 2, 2, 3, 3, 4]);
    expect(levelStart(16, 100)).toBe(12_000);
    expect(levelFor(12_000, 100)).toBe(16);
  });

  it('skills level twice as fast', () => {
    expect([0, 49, 50, 150, 300].map((xp) => levelFor(xp, 50))).toEqual([1, 1, 2, 3, 4]);
  });

  it('reports progress inside the level', () => {
    expect(progressFor(450, 100)).toEqual({ level: 3, into: 150, span: 300, fraction: 0.5 });
  });

  it('titles change at levels 3, 5, 8, 12 and 16', () => {
    expect([1, 2, 3, 4, 5, 7, 8, 11, 12, 15, 16, 40].map(titleFor)).toEqual([
      'Trainee', 'Trainee', 'Apprentice', 'Apprentice', 'Journeyman', 'Journeyman', 'Adept', 'Adept', 'Expert', 'Expert', 'Master', 'Master',
    ]);
  });
});

describe('the catalogue', () => {
  it('every class has four distinct home skills that exist', () => {
    for (const c of CLASSES) {
      const home = CLASS_INFO[c].home;
      expect(home).toHaveLength(4);
      expect(new Set(home).size).toBe(4);
      for (const skill of home) expect(SKILLS).toContain(skill);
    }
  });
  it('harder quests are worth more', () => {
    const values = DIFFICULTIES.map((d) => DIFFICULTY_XP[d]);
    expect([...values].sort((a, b) => a - b)).toEqual(values);
  });
});
