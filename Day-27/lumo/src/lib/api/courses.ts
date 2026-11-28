import { toAppError } from '../errors';
import { supabase } from '../supabase';
import type { Course, CourseMap, Lesson, Level, Topic, Unit } from '../types';

const COURSE_COLUMNS =
  'id, slug, title, island_name, guardian, topic, level, summary, owner_id, status, version, ai_generated, updated_at';

/** Courses the current viewer can see (RLS decides: live ones for everyone, plus own drafts for staff). */
export async function listVisibleCourses(): Promise<Course[]> {
  const { data, error } = await supabase()
    .from('courses')
    .select(COURSE_COLUMNS)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  if (error) throw toAppError(error);
  return data as Course[];
}

export async function listOwnedCourses(ownerId: string): Promise<Course[]> {
  const { data, error } = await supabase()
    .from('courses')
    .select(COURSE_COLUMNS)
    .eq('owner_id', ownerId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });
  if (error) throw toAppError(error);
  return data as Course[];
}

/** One course with its units and lessons, in path order. */
export async function getCourseMap(slug: string): Promise<CourseMap> {
  const { data, error } = await supabase()
    .from('courses')
    .select(
      `${COURSE_COLUMNS}, units(id, course_id, position, title, summary, lessons(id, unit_id, position, kind, title, summary, duration_seconds, xp, questions(concept)))`,
    )
    .eq('slug', slug)
    .is('deleted_at', null)
    .single();
  if (error) throw toAppError(error);
  type RawLesson = Lesson & { questions: { concept: string }[] };
  const course = data as unknown as Course & { units: (Unit & { lessons: RawLesson[] })[] };
  const units = [...course.units]
    .sort((a, b) => a.position - b.position)
    .map((u) => ({
      ...u,
      lessons: [...u.lessons]
        .sort((a, b) => a.position - b.position)
        .map(({ questions, ...l }) => ({
          ...l,
          concepts: [...new Set(questions.map((q) => q.concept))],
        })),
    }));
  return { ...course, units };
}

export interface CourseSearch {
  q?: string;
  topic?: Topic | '';
  level?: Level | '';
}

/**
 * Words people type become an ILIKE pattern. PostgREST's or=() syntax treats , ( ) and quotes specially, and
 * ILIKE treats % _ \ as wildcards, so those are dropped: searching is for words, not patterns.
 */
export function searchPattern(q: string): string | null {
  const cleaned = q
    .replace(/[%_\\,()"'*:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
  return cleaned ? `%${cleaned}%` : null;
}

/** Live islands for Explore, searched and filtered by the database (title, island name or summary). */
export async function searchCourses({
  q = '',
  topic = '',
  level = '',
}: CourseSearch): Promise<Course[]> {
  let query = supabase()
    .from('courses')
    .select(COURSE_COLUMNS)
    .eq('status', 'live')
    .is('deleted_at', null);
  const pattern = searchPattern(q);
  if (pattern) {
    query = query.or(
      `title.ilike.${pattern},island_name.ilike.${pattern},summary.ilike.${pattern}`,
    );
  }
  if (topic) query = query.eq('topic', topic);
  if (level) query = query.eq('level', level);
  const { data, error } = await query.order('island_name', { ascending: true }).limit(60);
  if (error) throw toAppError(error);
  return data as Course[];
}
