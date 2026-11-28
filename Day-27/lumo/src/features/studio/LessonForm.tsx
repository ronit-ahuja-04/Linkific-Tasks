import { useState, type FormEvent } from 'react';
import { Button, Field, TextAreaField } from '../../components/ui';
import type { LessonInput } from '../../lib/api/studio';
import { toAppError } from '../../lib/errors';
import type { FieldErrors } from '../auth/validation';
import { LESSON_KINDS } from './options';
import { hasErrors, validateLesson } from './validation';

const EMPTY_LESSON: LessonInput = {
  title: '',
  kind: 'video',
  summary: '',
  duration_seconds: null,
  xp: 10,
};

const DEFAULT_XP: Record<LessonInput['kind'], number> = {
  video: 10,
  quiz: 15,
  practice: 15,
  guardian: 30,
};

/** Lesson details: used in the "new lesson" dialog and at the top of the lesson editor. */
export function LessonForm({
  initial = EMPTY_LESSON,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: LessonInput;
  submitLabel: string;
  onSubmit: (input: LessonInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState(initial);
  const [duration, setDuration] = useState(initial.duration_seconds?.toString() ?? '');
  const [xp, setXp] = useState(String(initial.xp));
  const [errors, setErrors] = useState<FieldErrors<keyof LessonInput>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Editing an existing lesson keeps its points; a new one follows the kind until changed by hand.
  const [xpTouched, setXpTouched] = useState(initial !== EMPTY_LESSON);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const input: LessonInput = {
      ...values,
      title: values.title.trim(),
      summary: values.summary.trim(),
      duration_seconds: duration.trim() === '' ? null : Number(duration),
      xp: Number(xp),
    };
    const found = validateLesson(input);
    if (duration.trim() !== '' && !Number.isInteger(Number(duration))) {
      found.duration_seconds = 'Whole seconds, e.g. 90.';
    }
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
      <Field
        label="Lesson title"
        value={values.title}
        onChange={(e) => {
          setValues((v) => ({ ...v, title: e.target.value }));
          if (errors.title) setErrors((x) => ({ ...x, title: undefined }));
        }}
        error={errors.title}
        maxLength={120}
        placeholder="For-loops in 90 seconds"
        required
      />

      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-2 p-0 text-sm font-extrabold">Kind of lesson</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {LESSON_KINDS.map(({ value, label, hint, icon: Icon }) => (
            <label
              key={value}
              className={[
                'flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-3 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-violet',
                values.kind === value
                  ? 'border-violet bg-violet-soft'
                  : 'border-line-strong bg-white',
              ].join(' ')}
            >
              <input
                type="radio"
                name="lesson-kind"
                value={value}
                checked={values.kind === value}
                onChange={() => {
                  setValues((v) => ({ ...v, kind: value }));
                  if (!xpTouched) setXp(String(DEFAULT_XP[value]));
                }}
                className="sr-only"
              />
              <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-violet-ink" />
              <span className="flex flex-col">
                <b>{label}</b>
                <span className="text-xs text-dusk">{hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <TextAreaField
        label="What it covers"
        hint="One line, shown on the lesson's stop on the map."
        value={values.summary}
        onChange={(e) => setValues((v) => ({ ...v, summary: e.target.value }))}
        maxLength={300}
        rows={2}
        showCount
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Length in seconds"
          hint={values.kind === 'video' ? 'Filled in when you upload a video.' : 'Optional.'}
          inputMode="numeric"
          value={duration}
          onChange={(e) => {
            setDuration(e.target.value);
            if (errors.duration_seconds) setErrors((x) => ({ ...x, duration_seconds: undefined }));
          }}
          error={errors.duration_seconds}
          placeholder="90"
        />
        <Field
          label="Light (points)"
          hint="0–100. Awarded once per learner."
          inputMode="numeric"
          value={xp}
          onChange={(e) => {
            setXp(e.target.value);
            setXpTouched(true);
            if (errors.xp) setErrors((x) => ({ ...x, xp: undefined }));
          }}
          error={errors.xp}
        />
      </div>

      {formError && (
        <p
          role="alert"
          className="m-0 rounded-2xl bg-ember-soft px-4 py-3 font-bold text-ember-ink"
        >
          {formError}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-3">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="violet" loading={busy} loadingText="Saving…">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
