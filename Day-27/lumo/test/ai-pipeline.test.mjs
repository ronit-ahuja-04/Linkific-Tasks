// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { checkDraft, draftPrompt, toVideoScript } from '../scripts/ai/draft.mjs';
import { fakeProvider } from '../scripts/ai/providers.mjs';
import { runJs, verifyQuestions } from '../scripts/ai/sandbox.mjs';

const course = {
  id: 'c',
  title: 'JavaScript Foundations',
  island_name: 'Code Reef',
  topic: 'code',
  level: 'beginner',
  summary: '',
  guardian: 'byte',
};

describe('the draft request', () => {
  it('asks for code questions with checkable output only on code topics', () => {
    const code = draftPrompt({ course, topic: 'arrays', notes: '', existingUnits: ['Variables'] });
    expect(code).toContain('This unit must teach: arrays.');
    expect(code).toContain("don't repeat them): Variables");
    expect(code).toContain('expected_output');
    const money = draftPrompt({
      course: { ...course, topic: 'money' },
      topic: 'budgets',
      notes: '',
      existingUnits: [],
    });
    expect(money).not.toContain('expected_output');
    expect(money).toContain('Do not use the "code" visual');
  });
});

describe('checking a draft', () => {
  it('accepts the fake provider’s draft and turns it into a video script', async () => {
    const { json } = await fakeProvider().generate(
      draftPrompt({ course, topic: 'arrays', notes: '', existingUnits: [] }),
    );
    const { draft, problems } = checkDraft(json, { codeTopic: true });
    expect(problems).toEqual([]);
    const script = toVideoScript(draft, { id: 'l-1', course, voice: 'am_puck' });
    expect(script.guardian).toBe('byte');
    expect(script.parts).toEqual({ Count: 'items.length' });
    const points = script.scenes.find((s) => s.visual === 'points');
    expect(points.lines.at(-1).show.points).toHaveLength(3); // points accumulate line by line
  });

  it('drops broken questions and code parts, and reports what makes a draft unusable', () => {
    const { draft, problems } = checkDraft(
      {
        unit_title: 'Arrays',
        video: {
          title: 'Arrays',
          code: 'const a = [1]',
          parts: [{ name: 'Missing', text: 'not in the code' }],
          scenes: [{ visual: 'code', lines: [{ say: 'Hi', highlight: 'Missing' }] }],
        },
        questions: [
          {
            prompt: 'Duplicate options?',
            options: ['A', 'a'],
            correct_index: 0,
            explanation: 'x x x',
            concept: 'dups',
          },
          {
            prompt: 'Bad index?',
            options: ['A', 'B'],
            correct_index: 5,
            explanation: 'x x x',
            concept: 'idx',
          },
        ],
      },
      { codeTopic: true },
    );
    expect(draft.video.parts).toEqual([]);
    expect(draft.video.scenes[0].lines[0].highlight).toBeUndefined();
    expect(draft.questions).toEqual([]);
    expect(problems.join(' ')).toMatch(/2 scenes/);
    expect(problems.join(' ')).toMatch(/0 usable questions/);
  });

  it('never keeps code or code scenes on a non-code topic', () => {
    const { draft } = checkDraft(
      {
        unit_title: 'Budgets',
        video: {
          title: 'B',
          code: 'x',
          scenes: [{ visual: 'code', lines: [{ say: 'Hello there' }] }],
        },
        questions: [],
      },
      { codeTopic: false },
    );
    expect(draft.video.code).toBe('');
    expect(draft.video.scenes[0].visual).toBe('points');
  });
});

describe('the code sandbox', () => {
  it('runs code and captures what it prints', async () => {
    expect(await runJs('for (let i = 0; i < 3; i++) console.log(i)')).toEqual({
      ok: true,
      output: '0\n1\n2',
    });
  });

  it('has no network, process or modules, and stops endless loops', async () => {
    expect((await runJs('fetch("http://example.com")')).ok).toBe(false);
    expect((await runJs('process.exit(0)')).error).toMatch(/process is not defined/);
    expect((await runJs('require("fs")')).error).toMatch(/require is not defined/);
    expect((await runJs('while (true) {}')).ok).toBe(false);
  }, 15000);

  it('fixes a mis-marked answer and drops a question whose stated output is wrong', async () => {
    const { kept, dropped } = await verifyQuestions([
      {
        prompt: 'mis-marked',
        code: 'console.log([1,2].length)',
        expected_output: '2',
        asks_for_output: true,
        options: ['1', '2'],
        correct_index: 0,
      },
      {
        prompt: 'wrong output',
        code: 'console.log(1 + 1)',
        expected_output: '11',
        asks_for_output: true,
        options: ['2', '11'],
        correct_index: 1,
      },
      { prompt: 'no code', options: ['a', 'b'], correct_index: 1 },
    ]);
    expect(kept.map((q) => [q.prompt, q.correct_index, q.machine_checked])).toEqual([
      ['mis-marked', 1, true],
      ['no code', 1, false],
    ]);
    expect(dropped).toEqual([{ prompt: 'wrong output', reason: 'the code prints "2", not "11"' }]);
  }, 15000);
});
