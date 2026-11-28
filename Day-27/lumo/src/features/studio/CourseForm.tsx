import { useState, type FormEvent } from 'react';
import { Guardian } from '../../components/characters';
import { Button, Field, SelectField, TextAreaField } from '../../components/ui';
import type { FieldErrors } from '../auth/validation';
import type { CourseInput } from '../../lib/api/studio';
import { toAppError } from '../../lib/errors';
import { slugify } from '../../lib/text/slug';
import { GUARDIANS, LEVELS, TOPICS } from './options';
import { hasErrors, validateCourse } from './validation';

const EMPTY_COURSE: CourseInput = {
  title: '',
  island_name: '',
  slug: '',
  guardian: 'byte',
  topic: 'code',
  level: 'beginner',
  summary: '',
};

/**
 * Create or edit a course. On create, the link (slug) follows the title until someone edits it by hand; on edit
 * it's fixed, because shared links and certificates point at it.
 */
export function CourseForm({
  initial = EMPTY_COURSE,
  mode,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: CourseInput;
  mode: 'create' | 'edit';
  submitLabel: string;
  onSubmit: (input: CourseInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(mode === 'edit');
  const [errors, setErrors] = useState<FieldErrors<keyof CourseInput>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof CourseInput>(key: K, value: CourseInput[K]) => {
    setValues((v) => {
      const next = { ...v, [key]: value };
      if (key === 'title' && !slugTouched) next.slug = slugify(String(value));
      return next;
    });
    // Clear a field's error as soon as it's edited; it's re-checked on submit.
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = {
      ...values,
      title: values.title.trim(),
      island_name: values.island_name.trim(),
      summary: values.summary.trim(),
    };
    const found = validateCourse(trimmed);
    setErrors(found);
    setFormError(null);
    if (hasErrors(found)) {
      const first = (Object.keys(found) as (keyof CourseInput)[]).find((k) => found[k]);
      if (first) document.getElementById(`course-${first}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      await onSubmit(trimmed);
    } catch (error) {
      const appError = toAppError(error);
      if (appError.kind === 'conflict') {
        setErrors({ slug: 'Another course already uses this link. Try a different one.' });
        document.getElementById('course-slug')?.focus();
      } else {
        setFormError(appError.message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        <Field
          id="course-title"
          label="Course title"
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          error={errors.title}
          placeholder="JavaScript Foundations"
          maxLength={120}
          required
        />
        <Field
          id="course-island_name"
          label="Island name"
          hint="What learners see on the map."
          value={values.island_name}
          onChange={(e) => set('island_name', e.target.value)}
          error={errors.island_name}
          placeholder="Code Reef"
          maxLength={60}
          required
        />
      </div>

      <Field
        id="course-slug"
        label="Link"
        hint={
          mode === 'edit'
            ? 'Fixed once a course exists, so shared links keep working.'
            : `lumo.app/islands/${values.slug || 'your-course'}`
        }
        value={values.slug}
        readOnly={mode === 'edit'}
        onChange={(e) => {
          setSlugTouched(true);
          set('slug', e.target.value.toLowerCase());
        }}
        error={errors.slug}
        maxLength={60}
        className={mode === 'edit' ? 'bg-mist text-dusk' : ''}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          id="course-topic"
          label="Topic"
          value={values.topic}
          onChange={(e) => set('topic', e.target.value as CourseInput['topic'])}
          options={TOPICS}
        />
        <SelectField
          id="course-level"
          label="Level"
          value={values.level}
          onChange={(e) => set('level', e.target.value as CourseInput['level'])}
          options={LEVELS}
        />
      </div>

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-2 p-0 text-sm font-extrabold">Island guardian</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {GUARDIANS.map((g) => (
            <label
              key={g.value}
              className={[
                'flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-violet',
                values.guardian === g.value
                  ? 'border-violet bg-violet-soft'
                  : 'border-line-strong bg-white',
              ].join(' ')}
            >
              <input
                type="radio"
                name="guardian"
                value={g.value}
                checked={values.guardian === g.value}
                onChange={() => set('guardian', g.value)}
                className="sr-only"
              />
              <Guardian guardian={g.value} size={44} decorative />
              <span className="flex flex-col">
                <b>{g.label}</b>
                <span className="text-xs text-dusk">{g.blurb}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <TextAreaField
        id="course-summary"
        label="Summary"
        hint="One or two sentences for the Explore page."
        value={values.summary}
        onChange={(e) => set('summary', e.target.value)}
        error={errors.summary}
        maxLength={600}
        showCount
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
