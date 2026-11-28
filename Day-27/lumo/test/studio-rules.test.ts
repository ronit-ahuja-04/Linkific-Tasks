import { describe, expect, it } from 'vitest';
import { searchPattern } from '../src/lib/api/courses';
import { slugify } from '../src/lib/text/slug';
import {
  hasErrors,
  validateCourse,
  validateLesson,
  validateQuestion,
} from '../src/features/studio/validation';
import toast, { toastAdded, toastDismissed } from '../src/features/toast/toastSlice';

const course = {
  title: 'Loops Lab',
  island_name: 'Mosaic Bay',
  slug: 'loops-lab',
  guardian: 'byte' as const,
  topic: 'code' as const,
  level: 'beginner' as const,
  summary: '',
};

const question = {
  prompt: 'How many laps?',
  code: '',
  options: ['3', '4'],
  concept: 'loop count',
  correct_index: 0,
  explanation: 'i goes 0, 1, 2.',
  mistakes: {},
};

describe('slugs and search', () => {
  it('turns a title into a link the database accepts', () => {
    expect(slugify('Loops & Logic 101!')).toBe('loops-logic-101');
    expect(slugify('  Café   Crème ')).toBe('cafe-creme');
    expect(slugify('---')).toBe('');
  });

  it('strips characters that would break the PostgREST filter or act as wildcards', () => {
    expect(searchPattern('  loops ')).toBe('%loops%');
    expect(searchPattern('a,b(c)%_d')).toBe('%a b c d%');
    expect(searchPattern('   ')).toBeNull();
  });
});

describe('course and lesson rules (mirroring the database checks)', () => {
  it('accepts a valid course', () => {
    expect(hasErrors(validateCourse(course))).toBe(false);
  });

  it('flags short titles, bad links and long summaries', () => {
    const e = validateCourse({
      ...course,
      title: 'Hi',
      slug: 'Bad Slug',
      summary: 'x'.repeat(601),
    });
    expect(e.title).toMatch(/at least 3/);
    expect(e.slug).toMatch(/Lowercase/);
    expect(e.summary).toMatch(/600/);
  });

  it('keeps lesson length and points in range', () => {
    const base = {
      title: 'Intro',
      kind: 'video' as const,
      summary: '',
      duration_seconds: null,
      xp: 10,
    };
    expect(hasErrors(validateLesson(base))).toBe(false);
    expect(validateLesson({ ...base, duration_seconds: 5 }).duration_seconds).toBeTruthy();
    expect(validateLesson({ ...base, xp: 101 }).xp).toBeTruthy();
  });
});

describe('question rules', () => {
  it('accepts a valid question', () => {
    expect(hasErrors(validateQuestion(question))).toBe(false);
  });

  it('needs a correct option, and options that differ', () => {
    const e = validateQuestion({ ...question, options: ['Yes', ' yes ', ''], correct_index: -1 });
    expect(e.correct_index).toMatch(/Mark which/);
    expect(e.optionErrors).toEqual([
      undefined,
      'Same as option 1.',
      'Write this option, or remove it.',
    ]);
  });
});

describe('toasts', () => {
  it('keeps only the newest three and can dismiss one', () => {
    let state = toast(undefined, { type: 'init' });
    for (const n of [1, 2, 3, 4]) state = toast(state, toastAdded('info', `t${n}`));
    expect(state.map((t) => t.message)).toEqual(['t2', 't3', 't4']);
    state = toast(state, toastDismissed(state[0]!.id));
    expect(state).toHaveLength(2);
  });
});
