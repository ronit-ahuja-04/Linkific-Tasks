import { AppError, toAppError } from '../errors';
import { supabase } from '../supabase';
import type {
  Course,
  CourseStatus,
  GenerationJob,
  JobKind,
  Lesson,
  LessonKind,
  QuestionWithKey,
  StudioCourse,
  StudioLesson,
  StudioUnit,
} from '../types';

/**
 * The instructor studio's API. Every call goes through RLS or a SECURITY DEFINER RPC that checks the caller, so
 * this file never decides who may do what; it only shapes requests and turns errors into AppErrors.
 */

const COURSE_COLUMNS =
  'id, slug, title, island_name, guardian, topic, level, summary, owner_id, status, version, ai_generated, updated_at';
const LESSON_COLUMNS =
  'id, unit_id, position, kind, title, summary, duration_seconds, xp, video_path, captions_path, transcript, deleted_at';

export interface CourseInput {
  title: string;
  island_name: string;
  slug: string;
  guardian: Course['guardian'];
  topic: Course['topic'];
  level: Course['level'];
  summary: string;
}

export interface LessonInput {
  title: string;
  kind: LessonKind;
  summary: string;
  duration_seconds: number | null;
  xp: number;
}

export interface QuestionInput {
  prompt: string;
  code: string;
  options: string[];
  concept: string;
  correct_index: number;
  explanation: string;
  mistakes: Record<string, string>;
}

// ---------------------------------------------------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------------------------------------------------
export async function createCourse(ownerId: string, input: CourseInput): Promise<Course> {
  const { data, error } = await supabase()
    .from('courses')
    .insert({ ...input, owner_id: ownerId, status: 'draft' })
    .select(COURSE_COLUMNS)
    .single();
  if (error) throw toAppError(error);
  return data as Course;
}

/** The slug is fixed once a course exists (links and certificates point at it), so it isn't part of an update. */
export async function updateCourse(id: string, input: Omit<CourseInput, 'slug'>): Promise<Course> {
  const { data, error } = await supabase()
    .from('courses')
    .update(input)
    .eq('id', id)
    .select(COURSE_COLUMNS)
    .single();
  if (error) throw toAppError(error);
  return data as Course;
}

/** The database decides which moves are allowed (owners: draft <-> in review; admins: anything). */
export async function setCourseStatus(id: string, status: CourseStatus): Promise<Course> {
  const { data, error } = await supabase()
    .from('courses')
    .update({ status })
    .eq('id', id)
    .select(COURSE_COLUMNS)
    .single();
  if (error) throw toAppError(error);
  return data as Course;
}

export async function deleteCourse(id: string): Promise<void> {
  const { error } = await supabase().rpc('delete_course', { p_course: id });
  if (error) throw toAppError(error);
}

/** One course with every unit and lesson (hidden lessons included, for the editor), in path order. */
export async function getStudioCourse(id: string): Promise<StudioCourse> {
  const { data, error } = await supabase()
    .from('courses')
    .select(
      `${COURSE_COLUMNS}, units(id, course_id, position, title, summary, published, ai_drafted, lessons(${LESSON_COLUMNS}, questions(id, answer_keys(verified))))`,
    )
    .eq('id', id)
    .is('deleted_at', null)
    .single();
  if (error) throw toAppError(error);
  type RawLesson = Omit<StudioLesson, 'question_count' | 'unchecked_count'> & {
    questions: {
      id: string;
      answer_keys: { verified: boolean } | { verified: boolean }[] | null;
    }[];
  };
  const checked = (k: RawLesson['questions'][number]['answer_keys']) =>
    Array.isArray(k) ? Boolean(k[0]?.verified) : Boolean(k?.verified);
  const raw = data as unknown as Course & {
    units: (Omit<StudioUnit, 'lessons'> & { lessons: RawLesson[] })[];
  };
  const units = [...raw.units]
    .sort((a, b) => a.position - b.position)
    .map((u) => ({
      ...u,
      lessons: [...u.lessons]
        .sort((a, b) => a.position - b.position)
        .map(({ questions, ...l }) => ({
          ...l,
          question_count: questions.length,
          unchecked_count: questions.filter((q) => !checked(q.answer_keys)).length,
        })),
    }));
  return { ...raw, units };
}

// ---------------------------------------------------------------------------------------------------------------
// Units and lessons (positions are filled in by the database)
// ---------------------------------------------------------------------------------------------------------------
export async function createUnit(courseId: string, title: string, summary = ''): Promise<void> {
  const { error } = await supabase().from('units').insert({ course_id: courseId, title, summary });
  if (error) throw toAppError(error);
}

export async function updateUnit(id: string, title: string): Promise<void> {
  const { error } = await supabase().from('units').update({ title }).eq('id', id);
  if (error) throw toAppError(error);
}

export async function deleteUnit(id: string): Promise<void> {
  const { error } = await supabase().from('units').delete().eq('id', id);
  if (error) throw toAppError(error);
}

/** Make a drafted unit visible to learners. The database refuses while any question is unchecked. */
export async function publishUnit(id: string): Promise<void> {
  const { error } = await supabase().rpc('publish_unit', { p_unit: id });
  if (error) throw toAppError(error);
}

export async function reorderUnits(courseId: string, ids: string[]): Promise<void> {
  const { error } = await supabase().rpc('reorder_units', { p_course: courseId, p_ids: ids });
  if (error) throw toAppError(error);
}

export async function createLesson(unitId: string, input: LessonInput): Promise<Lesson> {
  const { data, error } = await supabase()
    .from('lessons')
    .insert({ unit_id: unitId, ...input })
    .select(LESSON_COLUMNS)
    .single();
  if (error) throw toAppError(error);
  return data as Lesson;
}

export async function updateLesson(
  id: string,
  input: Partial<LessonInput> & {
    video_path?: string | null;
    captions_path?: string | null;
    transcript?: string | null;
  },
): Promise<void> {
  const { error } = await supabase().from('lessons').update(input).eq('id', id);
  if (error) throw toAppError(error);
}

/** Hide (soft-delete) or bring back a lesson. Used for live courses, where a hard delete would erase progress. */
export async function setLessonHidden(id: string, hidden: boolean): Promise<void> {
  const { error } = await supabase()
    .from('lessons')
    .update({ deleted_at: hidden ? new Date().toISOString() : null })
    .eq('id', id);
  if (error) throw toAppError(error);
}

export async function deleteLesson(id: string): Promise<void> {
  const { error } = await supabase().from('lessons').delete().eq('id', id);
  if (error) throw toAppError(error);
}

export async function reorderLessons(unitId: string, ids: string[]): Promise<void> {
  const { error } = await supabase().rpc('reorder_lessons', { p_unit: unitId, p_ids: ids });
  if (error) throw toAppError(error);
}

export async function getStudioLesson(
  id: string,
): Promise<StudioLesson & { course_id: string; questions: QuestionWithKey[] }> {
  const { data, error } = await supabase()
    .from('lessons')
    .select(
      `${LESSON_COLUMNS}, units(course_id), questions(id, lesson_id, position, prompt, code, options, concept, answer_keys(correct_index, explanation, mistakes, verified))`,
    )
    .eq('id', id)
    .single();
  if (error) throw toAppError(error);
  type RawQuestion = Omit<QuestionWithKey, 'key'> & {
    answer_keys: QuestionWithKey['key'] | QuestionWithKey['key'][];
  };
  const raw = data as unknown as Omit<StudioLesson, 'question_count'> & {
    units: { course_id: string };
    questions: RawQuestion[];
  };
  const questions = [...raw.questions]
    .sort((a, b) => a.position - b.position)
    .map(({ answer_keys, ...q }) => ({
      ...q,
      // A one-to-one embed comes back as an object; be tolerant of an array too.
      key: Array.isArray(answer_keys) ? (answer_keys[0] ?? null) : answer_keys,
    }));
  const { units, ...lesson } = raw;
  return {
    ...lesson,
    course_id: units.course_id,
    question_count: questions.length,
    unchecked_count: questions.filter((q) => !q.key?.verified).length,
    questions,
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Questions: saved together with their answer key in one RPC
// ---------------------------------------------------------------------------------------------------------------
export async function saveQuestion(
  lessonId: string,
  questionId: string | null,
  input: QuestionInput,
): Promise<string> {
  const { data, error } = await supabase().rpc('save_question', {
    p_lesson: lessonId,
    p_question: questionId,
    p_prompt: input.prompt,
    p_code: input.code,
    p_options: input.options,
    p_concept: input.concept,
    p_correct_index: input.correct_index,
    p_explanation: input.explanation,
    p_mistakes: input.mistakes,
  });
  if (error) throw toAppError(error);
  return data as string;
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await supabase().from('questions').delete().eq('id', id);
  if (error) throw toAppError(error);
}

// ---------------------------------------------------------------------------------------------------------------
// Generation jobs (written by the worker; the studio queues, cancels and watches them)
// ---------------------------------------------------------------------------------------------------------------
const JOB_COLUMNS =
  'id, course_id, kind, status, progress, message, error, attempts, created_at, updated_at, input, result, run_after';

export async function listJobs(courseId: string): Promise<GenerationJob[]> {
  const { data, error } = await supabase()
    .from('generation_jobs')
    .select(JOB_COLUMNS)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) throw toAppError(error);
  return data as GenerationJob[];
}

export async function queueJob(
  courseId: string,
  requestedBy: string,
  kind: JobKind,
  input: { topic: string; notes?: string } = { topic: '' },
): Promise<GenerationJob> {
  const { data, error } = await supabase()
    .from('generation_jobs')
    .insert({
      course_id: courseId,
      requested_by: requestedBy,
      kind,
      input,
      message: 'Waiting in line',
    })
    .select(JOB_COLUMNS)
    .single();
  if (error) {
    if (error.code === '23505') {
      throw new AppError(
        'conflict',
        'Wisp is already working on this. Wait for it to finish, or cancel it.',
        error.code,
      );
    }
    throw toAppError(error);
  }
  return data as GenerationJob;
}

export async function cancelJob(id: string): Promise<void> {
  const { error } = await supabase().rpc('cancel_job', { p_job: id });
  if (error) throw toAppError(error);
}

/**
 * Watch a course's jobs live. Realtime applies the same RLS policy as a select, so only editors get events.
 * Returns the unsubscribe function.
 */
export function watchJobs(courseId: string, onChange: (job: GenerationJob) => void): () => void {
  const client = supabase();
  const channel = client
    .channel(`jobs:${courseId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'generation_jobs',
        filter: `course_id=eq.${courseId}`,
      },
      (payload) => {
        if (payload.new && 'id' in payload.new) onChange(payload.new as GenerationJob);
      },
    )
    .subscribe();
  return () => {
    void client.removeChannel(channel);
  };
}
