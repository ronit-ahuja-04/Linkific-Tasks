import { Check, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Wisp } from '../../components/characters';
import { Button } from '../../components/ui';
import { toAppError } from '../../lib/errors';
import { wispSays } from '../../lib/game/wisp';
import type { Grade, LearnQuestion, Profile } from '../../lib/types';

const LETTERS = 'ABCDEF';

export interface QuizResult {
  total: number;
  /** Questions answered right on the first try. */
  firstTry: number;
}

type Phase =
  | { name: 'answering' }
  | { name: 'checking' }
  | { name: 'feedback'; grade: Grade; chosen: number }
  | { name: 'error'; message: string };

/**
 * One question at a time. The server grades each answer and only then reveals the right one. With `requeue`, a
 * missed question comes back at the end until it's answered right (lessons need every question right once).
 * Keys: 1–6 pick an option, Enter checks and continues.
 */
export function QuizRunner({
  questions,
  grade,
  persona,
  requeue = true,
  onProgress,
  onDone,
  renderExtra,
  onReport,
}: {
  questions: LearnQuestion[];
  grade: (question: LearnQuestion, choice: number) => Promise<Grade>;
  persona: Profile['wisp_persona'];
  requeue?: boolean;
  onProgress?: (fraction: number) => void;
  onDone: (result: QuizResult) => void;
  /** Extra line under the feedback (e.g. "+2 Light" in reviews). */
  renderExtra?: (grade: Grade) => string | null;
  /** Shows "Report a problem" under the feedback (signed-in learners only). */
  onReport?: (question: LearnQuestion) => void;
}) {
  const [queue, setQueue] = useState(() => questions.map((_, i) => i));
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>({ name: 'answering' });
  const [right, setRight] = useState(() => new Set<number>());
  const [missed, setMissed] = useState(() => new Set<number>());
  const [answered, setAnswered] = useState(0);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLHeadingElement>(null);

  const index = queue[0];
  const question = index === undefined ? undefined : questions[index];

  useEffect(() => {
    onProgress?.(right.size / Math.max(questions.length, 1));
  }, [right, questions.length, onProgress]);

  async function check() {
    if (question === undefined || index === undefined || selected === null) return;
    setPhase({ name: 'checking' });
    try {
      const result = await grade(question, selected);
      setAnswered((n) => n + 1);
      if (result.correct) setRight((s) => new Set(s).add(index));
      else setMissed((s) => new Set(s).add(index));
      setPhase({ name: 'feedback', grade: result, chosen: selected });
    } catch (error) {
      setPhase({ name: 'error', message: toAppError(error).message });
    }
  }

  function next() {
    if (phase.name !== 'feedback' || index === undefined) return;
    const rest = queue.slice(1);
    const again = !phase.grade.correct && requeue ? [...rest, index] : rest;
    if (again.length === 0) {
      onDone({ total: questions.length, firstTry: questions.length - missed.size });
      return;
    }
    setQueue(again);
    setSelected(null);
    setPhase({ name: 'answering' });
  }

  // Move focus with the flow: to the feedback when it appears, back to the question for the next one.
  useEffect(() => {
    if (phase.name === 'feedback' || phase.name === 'error') feedbackRef.current?.focus();
    if (phase.name === 'answering') promptRef.current?.focus();
  }, [phase.name, index]);

  // Keyboard shortcuts.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))
        return;
      if (phase.name === 'answering' && question) {
        const n = Number(e.key);
        if (n >= 1 && n <= question.options.length) setSelected(n - 1);
        if (e.key === 'Enter' && selected !== null) {
          e.preventDefault();
          void check();
        }
      } else if (phase.name === 'feedback' && e.key === 'Enter') {
        e.preventDefault();
        next();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!question || index === undefined) return null;
  const feedback = phase.name === 'feedback' ? phase : null;
  const locked = phase.name !== 'answering';

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-5 py-6">
        {missed.has(index) && !feedback && (
          <span className="self-start rounded-full bg-glow-soft px-3 py-1 text-sm font-black text-glow-ink">
            Second chance
          </span>
        )}
        <h2 ref={promptRef} tabIndex={-1} className="m-0 text-2xl font-semibold focus:outline-none">
          {question.prompt}
        </h2>
        {question.code && (
          <pre className="m-0 overflow-x-auto rounded-2xl bg-night p-4 font-mono text-base text-moon">
            {question.code}
          </pre>
        )}
        <div role="radiogroup" aria-label="Answers" className="flex flex-col gap-3">
          {question.options.map((option, i) => {
            const isRight = feedback && feedback.grade.correct_index === i;
            const isWrongPick = feedback && feedback.chosen === i && !feedback.grade.correct;
            return (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={selected === i}
                disabled={locked}
                onClick={() => setSelected(i)}
                className={[
                  'flex min-h-14 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-lg font-bold',
                  'disabled:cursor-default',
                  isRight
                    ? 'border-lagoon bg-lagoon-soft text-lagoon-ink'
                    : isWrongPick
                      ? 'border-ember bg-ember-soft text-ember-ink'
                      : selected === i
                        ? 'border-violet bg-violet-soft shadow-[0_4px_0_var(--color-violet)]'
                        : 'border-line-strong bg-white shadow-[0_4px_0_var(--color-line-strong)] hover:border-violet',
                ].join(' ')}
              >
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-current font-display text-sm"
                >
                  {LETTERS[i]}
                </span>
                <span className="flex-1">{option}</span>
                {isRight && <Check aria-label="Correct answer" className="h-6 w-6" />}
                {isWrongPick && <X aria-label="Your answer" className="h-6 w-6" />}
              </button>
            );
          })}
        </div>
        <p className="m-0 hidden text-sm text-dusk md:block" aria-hidden="true">
          Tip: press 1–{question.options.length} to pick, Enter to check.
        </p>
      </div>

      <div
        ref={feedbackRef}
        tabIndex={-1}
        aria-live="assertive"
        className={[
          'sticky bottom-0 border-t-2 focus:outline-none',
          feedback
            ? feedback.grade.correct
              ? 'border-lagoon bg-lagoon-soft'
              : 'border-ember bg-ember-soft'
            : phase.name === 'error'
              ? 'border-ember bg-ember-soft'
              : 'border-line bg-white',
        ].join(' ')}
      >
        <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center gap-4 px-5 py-4">
          {feedback ? (
            <>
              <Wisp
                size={56}
                mood={feedback.grade.correct ? 'cheer' : 'think'}
                decorative
                glow={false}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <b
                  className={`font-display text-xl ${feedback.grade.correct ? 'text-lagoon-ink' : 'text-ember-ink'}`}
                >
                  {wispSays(persona, feedback.grade.correct ? 'right' : 'wrong', answered)}
                </b>
                {!feedback.grade.correct && feedback.grade.mistake && (
                  <p className="m-0 font-bold text-ink">{feedback.grade.mistake}</p>
                )}
                <p className="m-0 text-ink">{feedback.grade.explanation}</p>
                {renderExtra?.(feedback.grade) && (
                  <p className="m-0 font-black text-lagoon-ink">{renderExtra(feedback.grade)}</p>
                )}
                {!feedback.grade.correct && requeue && (
                  <p className="m-0 text-sm text-dusk">This one comes back at the end.</p>
                )}
                {onReport && (
                  <button
                    type="button"
                    onClick={() => onReport(question)}
                    className="self-start text-sm font-bold text-dusk underline hover:text-ink"
                  >
                    Report a problem
                  </button>
                )}
              </div>
              <Button variant={feedback.grade.correct ? 'lagoon' : 'ember'} onClick={next}>
                Continue
              </Button>
            </>
          ) : phase.name === 'error' ? (
            <>
              <p className="m-0 flex-1 font-bold text-ember-ink">
                Couldn't check that answer: {phase.message}
              </p>
              <Button variant="ember" onClick={() => void check()}>
                Try again
              </Button>
            </>
          ) : (
            <div className="ml-auto">
              <Button
                variant="glow"
                size="lg"
                disabled={selected === null}
                loading={phase.name === 'checking'}
                loadingText="Checking…"
                onClick={() => void check()}
              >
                Check
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
