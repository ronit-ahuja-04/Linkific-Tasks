import { toAppError } from '../errors';
import { supabase } from '../supabase';
import type { Course, CourseMap, Lesson, Unit } from '../types';

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
      `${COURSE_COLUMNS}, units(id, course_id, position, title, summary, lessons(id, unit_id, position, kind, title, summary, duration_seconds, xp))`,
    )
    .eq('slug', slug)
    .is('deleted_at', null)
    .single();
  if (error) throw toAppError(error);
  const course = data as unknown as Course & { units: (Unit & { lessons: Lesson[] })[] };
  const units = [...course.units]
    .sort((a, b) => a.position - b.position)
    .map((u) => ({ ...u, lessons: [...u.lessons].sort((a, b) => a.position - b.position) }));
  return { ...course, units };
}
