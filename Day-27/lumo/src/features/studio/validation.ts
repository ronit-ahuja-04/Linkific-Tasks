/**
 * Studio form rules. Each mirrors a database check (see the schema migrations), so people see the problem next to
 * the field before anything is sent; the database still enforces every rule.
 */
import type { FieldErrors } from '../auth/validation';
import type { CourseInput, LessonInput, QuestionInput } from '../../lib/api/studio';
import { SLUG_RULE } from '../../lib/text/slug';

const len = (s: string) => s.trim().length;

export function validateCourse(v: CourseInput): FieldErrors<keyof CourseInput> {
  const e: FieldErrors<keyof CourseInput> = {};
  if (len(v.title) < 3) e.title = 'Give the course a title (at least 3 characters).';
  else if (len(v.title) > 120) e.title = 'Keep the title under 120 characters.';
  if (len(v.island_name) < 2) e.island_name = 'Name the island (at least 2 characters).';
  else if (len(v.island_name) > 60) e.island_name = 'Keep the island name under 60 characters.';
  if (!SLUG_RULE.test(v.slug)) e.slug = 'Lowercase letters and numbers, joined by single dashes.';
  else if (v.slug.length > 60) e.slug = 'Keep the link under 60 characters.';
  if (v.summary.length > 600) e.summary = 'Keep the summary under 600 characters.';
  return e;
}

export function validateUnitTitle(title: string): string | undefined {
  if (len(title) < 2) return 'Give the unit a name (at least 2 characters).';
  if (len(title) > 120) return 'Keep it under 120 characters.';
  return undefined;
}

export function validateLesson(v: LessonInput): FieldErrors<keyof LessonInput> {
  const e: FieldErrors<keyof LessonInput> = {};
  if (len(v.title) < 2) e.title = 'Give the lesson a title (at least 2 characters).';
  else if (len(v.title) > 120) e.title = 'Keep the title under 120 characters.';
  if (v.duration_seconds !== null && (v.duration_seconds < 10 || v.duration_seconds > 1800)) {
    e.duration_seconds = 'Between 10 seconds and 30 minutes (bites work best under 2 minutes).';
  }
  if (!Number.isInteger(v.xp) || v.xp < 0 || v.xp > 100) e.xp = 'A whole number from 0 to 100.';
  return e;
}

export type QuestionErrors = FieldErrors<
  'prompt' | 'concept' | 'explanation' | 'correct_index' | 'options'
> & {
  optionErrors?: (string | undefined)[];
};

export function validateQuestion(v: QuestionInput): QuestionErrors {
  const e: QuestionErrors = {};
  if (len(v.prompt) < 3) e.prompt = 'Write the question (at least 3 characters).';
  else if (len(v.prompt) > 500) e.prompt = 'Keep the question under 500 characters.';
  if (len(v.concept) < 2) e.concept = 'Name the idea this checks, e.g. "for-loop bounds".';
  else if (len(v.concept) > 80) e.concept = 'Keep it under 80 characters.';
  if (len(v.explanation) < 3)
    e.explanation = 'Explain the right answer: Wisp shows this to learners.';
  else if (len(v.explanation) > 1000) e.explanation = 'Keep it under 1000 characters.';

  if (v.options.length < 2 || v.options.length > 6) e.options = 'Use 2 to 6 options.';
  const seen = new Map<string, number>();
  const optionErrors = v.options.map((option, i) => {
    const key = option.trim().toLowerCase();
    if (!key) return 'Write this option, or remove it.';
    if (option.trim().length > 200) return 'Keep options under 200 characters.';
    if (seen.has(key)) return `Same as option ${seen.get(key)! + 1}.`;
    seen.set(key, i);
    return undefined;
  });
  if (optionErrors.some(Boolean)) e.optionErrors = optionErrors;
  if (v.correct_index < 0 || v.correct_index >= v.options.length) {
    e.correct_index = 'Mark which option is correct.';
  }
  return e;
}

export const hasErrors = (e: object) =>
  Object.values(e).some((v) => (Array.isArray(v) ? v.some(Boolean) : Boolean(v)));
