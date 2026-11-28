import { toAppError } from '../errors';
import { supabase } from '../supabase';
import type {
  Enrollment,
  Grade,
  LearnQuestion,
  LessonCompletion,
  LessonKind,
  Profile,
  ReviewGrade,
  ReviewItem,
} from '../types';
import { signedUrl } from './storage';

/**
 * The learner's side of Lumo. Grading, Light, the flame and the review schedule are all decided by Postgres
 * functions; nothing here can award anything by itself.
 */

export interface PlayableLesson {
  id: string;
  title: string;
  summary: string;
  kind: LessonKind;
  xp: number;
  transcript: string | null;
  videoUrl: string | null;
  captionsUrl: string | null;
  course: { id: string; slug: string; island_name: string; guardian: 'byte' | 'nova' | 'mystery' };
  /** The lesson's own questions; for a guardian battle, a mix from the whole unit. */
  questions: LearnQuestion[];
  /** The lesson after this one on the path, if any (for "Next lesson"). */
  nextLessonId: string | null;
}

const Q_COLUMNS = 'id, prompt, code, options, concept, position';

export async function getPlayableLesson(id: string): Promise<PlayableLesson> {
  const { data, error } = await supabase()
    .from('lessons')
    .select(
      `id, title, summary, kind, xp, transcript, video_path, captions_path, position, unit_id,
       questions(${Q_COLUMNS}),
       units(id, position, course_id, courses(id, slug, island_name, guardian),
             lessons(id, position, kind, questions(${Q_COLUMNS})))`,
    )
    .eq('id', id)
    .single();
  if (error) throw toAppError(error);

  type RawQ = LearnQuestion & { position: number };
  const raw = data as unknown as {
    id: string;
    title: string;
    summary: string;
    kind: LessonKind;
    xp: number;
    transcript: string | null;
    video_path: string | null;
    captions_path: string | null;
    position: number;
    questions: RawQ[];
    units: {
      id: string;
      position: number;
      course_id: string;
      courses: PlayableLesson['course'];
      lessons: { id: string; position: number; kind: LessonKind; questions: RawQ[] }[];
    };
  };

  const byPosition = (a: { position: number }, b: { position: number }) => a.position - b.position;
  const strip = ({ position: _p, ...q }: RawQ): LearnQuestion => q;
  let questions = [...raw.questions].sort(byPosition).map(strip);
  const siblings = [...raw.units.lessons].sort(byPosition);
  if (raw.kind === 'guardian' && questions.length === 0) {
    // A guardian battle mixes the unit's questions: up to 6, spread across its lessons.
    questions = siblings
      .filter((l) => l.id !== raw.id)
      .flatMap((l) => [...l.questions].sort(byPosition).map(strip))
      .slice(0, 6);
  }

  const next = await nextLessonAfter(raw.units.course_id, raw.units.position, raw.position);
  const [videoUrl, captionsUrl] = await Promise.all([
    raw.video_path ? signedUrl('course-media', raw.video_path).catch(() => null) : null,
    raw.captions_path ? signedUrl('course-media', raw.captions_path).catch(() => null) : null,
  ]);

  return {
    id: raw.id,
    title: raw.title,
    summary: raw.summary,
    kind: raw.kind,
    xp: raw.xp,
    transcript: raw.transcript,
    videoUrl,
    captionsUrl,
    course: raw.units.courses,
    questions,
    nextLessonId: next,
  };
}

async function nextLessonAfter(courseId: string, unitPosition: number, lessonPosition: number) {
  const { data, error } = await supabase()
    .from('units')
    .select('position, lessons(id, position)')
    .eq('course_id', courseId)
    .gte('position', unitPosition)
    .order('position');
  if (error) return null;
  for (const unit of data as { position: number; lessons: { id: string; position: number }[] }[]) {
    const lessons = [...unit.lessons].sort((a, b) => a.position - b.position);
    const after =
      unit.position === unitPosition ? lessons.filter((l) => l.position > lessonPosition) : lessons;
    if (after[0]) return after[0].id;
  }
  return null;
}

export async function submitAnswer(questionId: string, choice: number): Promise<Grade> {
  const { data, error } = await supabase()
    .rpc('submit_answer', { p_question: questionId, p_choice: choice })
    .single();
  if (error) throw toAppError(error);
  return data as Grade;
}

export async function completeLesson(lessonId: string): Promise<LessonCompletion> {
  const { data, error } = await supabase().rpc('complete_lesson', { p_lesson: lessonId }).single();
  if (error) throw toAppError(error);
  return data as LessonCompletion;
}

/** Ids of every lesson this learner has finished (RLS returns only their own rows). */
export async function completedLessonIds(): Promise<Set<string>> {
  const { data, error } = await supabase().from('lesson_progress').select('lesson_id');
  if (error) throw toAppError(error);
  return new Set((data as { lesson_id: string }[]).map((r) => r.lesson_id));
}

export async function myEnrollments(): Promise<Enrollment[]> {
  const { data, error } = await supabase()
    .from('enrollments')
    .select('course_id, start_unit, last_opened_at')
    .order('last_opened_at', { ascending: false });
  if (error) throw toAppError(error);
  return data as Enrollment[];
}

export async function finishOnboarding(input: {
  courseId: string;
  goal: number;
  persona: Profile['wisp_persona'];
  startUnit: number;
}): Promise<void> {
  const { error } = await supabase().rpc('finish_onboarding', {
    p_course: input.courseId,
    p_goal: input.goal,
    p_persona: input.persona,
    p_start_unit: input.startUnit,
  });
  if (error) throw toAppError(error);
}

/** Foggy ideas on one island, by the server's clock. */
export async function fogConcepts(courseId: string): Promise<Set<string>> {
  const { data, error } = await supabase().rpc('fog_concepts', { p_course: courseId });
  if (error) throw toAppError(error);
  return new Set((data as { concept: string }[]).map((r) => r.concept));
}

export async function dueReviews(): Promise<ReviewItem[]> {
  const { data, error } = await supabase().rpc('due_reviews', { p_limit: 10 });
  if (error) throw toAppError(error);
  return (data as (Omit<ReviewItem, 'id'> & { question_id: string; due_at: string })[]).map(
    ({ question_id, due_at: _due, ...r }) => ({ ...r, id: question_id }),
  );
}

export async function reviewAnswer(questionId: string, choice: number): Promise<ReviewGrade> {
  const { data, error } = await supabase()
    .rpc('review_answer', { p_question: questionId, p_choice: choice })
    .single();
  if (error) throw toAppError(error);
  return data as ReviewGrade;
}

/** Fresh numbers after a lesson or review (Light, flame, embers), straight from the profile row. */
export async function myStats(
  userId: string,
): Promise<Pick<Profile, 'light' | 'flame_days' | 'best_flame' | 'embers' | 'last_goal_date'>> {
  const { data, error } = await supabase()
    .from('profiles')
    .select('light, flame_days, best_flame, embers, last_goal_date')
    .eq('id', userId)
    .single();
  if (error) throw toAppError(error);
  return data as Pick<Profile, 'light' | 'flame_days' | 'best_flame' | 'embers' | 'last_goal_date'>;
}
