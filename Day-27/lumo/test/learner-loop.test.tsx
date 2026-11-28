import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { QuizRunner } from '../src/features/learn/QuizRunner';
import { litToday, pathState, todayIn } from '../src/lib/game/path';
import type { LearnQuestion } from '../src/lib/types';

const units = [
  { position: 1, lessons: [{ id: 'a' }, { id: 'b' }] },
  { position: 2, lessons: [{ id: 'c' }, { id: 'd' }] },
];

describe('the path', () => {
  it('starts at the first lesson and locks the rest', () => {
    const s = pathState(units, new Set());
    expect([...s.values()]).toEqual(['current', 'locked', 'locked', 'locked']);
  });

  it('moves the start marker past finished lessons', () => {
    const s = pathState(units, new Set(['a', 'b']));
    expect([...s.values()]).toEqual(['done', 'done', 'current', 'locked']);
  });

  it('leaves skipped units open after placement, and starts at the placed unit', () => {
    const s = pathState(units, new Set(), 2);
    expect([...s.values()]).toEqual(['open', 'open', 'current', 'locked']);
  });
});

describe('the daily flame', () => {
  it('uses the learner’s own timezone for "today"', () => {
    // 20:00 UTC on 28 Nov is already 29 Nov in Kolkata (UTC+5:30).
    const now = new Date('2026-11-28T20:00:00Z');
    expect(todayIn('Asia/Kolkata', now)).toBe('2026-11-29');
    expect(todayIn('UTC', now)).toBe('2026-11-28');
    expect(litToday('2026-11-29', 'Asia/Kolkata', now)).toBe(true);
    expect(litToday('2026-11-28', 'Asia/Kolkata', now)).toBe(false);
  });
});

describe('QuizRunner', () => {
  const questions: LearnQuestion[] = [
    {
      id: 'q1',
      prompt: 'What prints?',
      code: null,
      options: ['0 1 2', '1 2 3'],
      concept: 'bounds',
    },
    { id: 'q2', prompt: 'Does it run?', code: null, options: ['Yes', 'No'], concept: 'while' },
  ];

  it('grades on the server, brings a miss back at the end, and finishes when all are right', async () => {
    const grade = vi.fn(async (q: LearnQuestion, choice: number) => {
      const correctIndex = q.id === 'q1' ? 0 : 1;
      return {
        correct: choice === correctIndex,
        correct_index: correctIndex,
        explanation: `Because of ${q.concept}.`,
        mistake: choice === correctIndex ? null : 'Look at where it starts.',
      };
    });
    const onDone = vi.fn();
    render(<QuizRunner questions={questions} grade={grade} persona="calm" onDone={onDone} />);
    const user = userEvent.setup();

    // Q1 wrong.
    await user.click(screen.getByRole('radio', { name: /1 2 3/ }));
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(await screen.findByText('Look at where it starts.')).toBeInTheDocument();
    expect(screen.getByText('This one comes back at the end.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    // Q2 right, using the keyboard: 2 then Enter, Enter.
    expect(screen.getByRole('heading', { name: 'Does it run?' })).toBeInTheDocument();
    await user.keyboard('2');
    await user.keyboard('{Enter}');
    expect(await screen.findByText('Because of while.')).toBeInTheDocument();
    await user.keyboard('{Enter}');

    // Q1 again ("second chance"), right this time.
    expect(screen.getByText('Second chance')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /0 1 2/ }));
    await user.click(screen.getByRole('button', { name: 'Check' }));
    await user.click(await screen.findByRole('button', { name: 'Continue' }));

    expect(grade).toHaveBeenCalledTimes(3);
    expect(onDone).toHaveBeenCalledWith({ total: 2, firstTry: 1 });
  });

  it('shows a retry when the answer can’t be sent', async () => {
    const grade = vi.fn().mockRejectedValueOnce(new TypeError('fetch failed')).mockResolvedValue({
      correct: true,
      correct_index: 0,
      explanation: 'Yes.',
      mistake: null,
    });
    render(
      <QuizRunner
        questions={questions.slice(0, 1)}
        grade={grade}
        persona="coach"
        onDone={() => {}}
      />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('radio', { name: /0 1 2/ }));
    await user.click(screen.getByRole('button', { name: 'Check' }));
    await user.click(await screen.findByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Yes.')).toBeInTheDocument();
  });
});
