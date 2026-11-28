import { Plus, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button, Field, TextAreaField } from '../../components/ui';
import type { QuestionInput } from '../../lib/api/studio';
import { toAppError } from '../../lib/errors';
import { hasErrors, validateQuestion, type QuestionErrors } from './validation';

const LETTERS = 'ABCDEF';

/**
 * One multiple-choice question and its answer key. Each wrong option can carry a "why that's wrong" note: Wisp
 * shows it to a learner who picks that option.
 */
export function QuestionForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: QuestionInput;
  onSubmit: (input: QuestionInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<QuestionErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const setOption = (i: number, text: string) =>
    setV((x) => ({ ...x, options: x.options.map((o, j) => (j === i ? text : o)) }));

  const setMistake = (i: number, text: string) =>
    setV((x) => ({ ...x, mistakes: { ...x.mistakes, [String(i)]: text } }));

  /** Removing an option shifts later ones up, so the correct index and the mistake notes move with them. */
  function removeOption(i: number) {
    setV((x) => {
      const mistakes: Record<string, string> = {};
      for (const [k, note] of Object.entries(x.mistakes)) {
        const n = Number(k);
        if (n < i) mistakes[k] = note;
        else if (n > i) mistakes[String(n - 1)] = note;
      }
      const correct =
        x.correct_index === i ? -1 : x.correct_index > i ? x.correct_index - 1 : x.correct_index;
      return {
        ...x,
        options: x.options.filter((_, j) => j !== i),
        mistakes,
        correct_index: correct,
      };
    });
    setErrors((e) => ({ ...e, optionErrors: undefined }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const input: QuestionInput = {
      ...v,
      prompt: v.prompt.trim(),
      concept: v.concept.trim(),
      explanation: v.explanation.trim(),
      options: v.options.map((o) => o.trim()),
      // Notes only for wrong options, and only non-empty ones.
      mistakes: Object.fromEntries(
        Object.entries(v.mistakes)
          .map(([k, note]) => [k, note.trim()] as const)
          .filter(
            ([k, note]) => note && Number(k) !== v.correct_index && Number(k) < v.options.length,
          ),
      ),
    };
    const found = validateQuestion(input);
    setErrors(found);
    setFormError(null);
    if (hasErrors(found)) return;
    setBusy(true);
    try {
      await onSubmit(input);
    } catch (error) {
      setFormError(toAppError(error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-5">
      <TextAreaField
        label="Question"
        value={v.prompt}
        onChange={(e) => setV((x) => ({ ...x, prompt: e.target.value }))}
        error={errors.prompt}
        maxLength={500}
        rows={2}
        placeholder="What will this print?"
      />
      <TextAreaField
        label="Code (optional)"
        hint="Shown in a code block above the options."
        value={v.code}
        onChange={(e) => setV((x) => ({ ...x, code: e.target.value }))}
        rows={3}
        mono
        spellCheck={false}
      />

      <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
        <legend className="mb-1 p-0 text-sm font-extrabold">Options: mark the correct one</legend>
        {errors.correct_index && (
          <p role="alert" className="m-0 text-sm font-bold text-ember-ink">
            {errors.correct_index}
          </p>
        )}
        {errors.options && (
          <p role="alert" className="m-0 text-sm font-bold text-ember-ink">
            {errors.options}
          </p>
        )}
        {v.options.map((option, i) => {
          const correct = v.correct_index === i;
          return (
            <div
              key={i}
              className={`flex flex-col gap-2 rounded-2xl border-2 p-3 ${correct ? 'border-lagoon bg-lagoon-soft' : 'border-line'}`}
            >
              <div className="flex items-start gap-3">
                <label className="flex min-h-12 shrink-0 cursor-pointer items-center gap-2 font-extrabold">
                  <input
                    type="radio"
                    name="correct"
                    checked={correct}
                    onChange={() => {
                      setV((x) => ({ ...x, correct_index: i }));
                      setErrors((e) => ({ ...e, correct_index: undefined }));
                    }}
                    className="h-5 w-5 accent-lagoon"
                  />
                  <span className="sr-only">Option {LETTERS[i]} is correct</span>
                  <span aria-hidden="true">{LETTERS[i]}</span>
                </label>
                <div className="flex-1">
                  <Field
                    label={`Option ${LETTERS[i]}`}
                    className="font-medium"
                    value={option}
                    onChange={(e) => setOption(i, e.target.value)}
                    error={errors.optionErrors?.[i]}
                    maxLength={200}
                  />
                </div>
                <button
                  type="button"
                  aria-label={`Remove option ${LETTERS[i]}`}
                  disabled={v.options.length <= 2}
                  onClick={() => removeOption(i)}
                  className="mt-7 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-dusk hover:bg-mist disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>
              {!correct && v.correct_index !== -1 && (
                <Field
                  label={`Why ${LETTERS[i]} is wrong (optional)`}
                  value={v.mistakes[String(i)] ?? ''}
                  onChange={(e) => setMistake(i, e.target.value)}
                  placeholder="The loop starts at 0, not 1."
                  maxLength={300}
                />
              )}
            </div>
          );
        })}
        {v.options.length < 6 && (
          <div>
            <Button
              size="sm"
              variant="plain"
              leftIcon={<Plus aria-hidden="true" className="h-4 w-4" />}
              onClick={() => setV((x) => ({ ...x, options: [...x.options, ''] }))}
            >
              Add an option
            </Button>
          </div>
        )}
      </fieldset>

      <Field
        label="Idea it checks"
        hint="Used to bring this idea back for review later."
        value={v.concept}
        onChange={(e) => setV((x) => ({ ...x, concept: e.target.value }))}
        error={errors.concept}
        maxLength={80}
        placeholder="for-loop bounds"
      />
      <TextAreaField
        label="Explanation"
        hint="Shown after the learner answers."
        value={v.explanation}
        onChange={(e) => setV((x) => ({ ...x, explanation: e.target.value }))}
        error={errors.explanation}
        maxLength={1000}
        rows={3}
      />

      {formError && (
        <p
          role="alert"
          className="m-0 rounded-2xl bg-ember-soft px-4 py-3 font-bold text-ember-ink"
        >
          {formError}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="violet" loading={busy} loadingText="Saving…">
          Save question
        </Button>
      </div>
    </form>
  );
}
