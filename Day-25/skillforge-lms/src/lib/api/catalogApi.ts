import type { CourseLevel, CourseRealm, CourseStatus, SkillTag } from '../../types/lms';
import { DEMO_REALMS } from '../demoData';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase';
import { normalizeApiError } from './authApi';

interface RawCourseRow {
  id: string;
  instructor_id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  skill_tag: SkillTag;
  level: CourseLevel;
  status: CourseStatus;
  xp_reward: number;
  thumbnail_url: string | null;
  estimated_minutes: number;
  created_at: string;
  profiles?: { full_name: string; handle: string } | null;
  course_reviews?: { rating: number }[];
  modules?: { lessons?: { id: string }[] }[];
}

export async function fetchPublishedRealms(): Promise<CourseRealm[]> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) {
    return [...DEMO_REALMS];
  }

  const { data, error } = await client
    .from('courses')
    .select(
      `
      id, instructor_id, slug, title, subtitle, description, category, skill_tag, level, status,
      xp_reward, thumbnail_url, estimated_minutes, created_at,
      profiles!courses_instructor_id_fkey(full_name, handle),
      course_reviews(rating),
      modules(lessons(id))
    `,
    )
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) throw normalizeApiError(error, 'Failed to load course realms');

  return (data as unknown as RawCourseRow[]).map((row) => {
    const reviews = row.course_reviews ?? [];
    const avgRating =
      reviews.length > 0
        ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
        : 0;
    const lessonsCount = (row.modules ?? []).reduce(
      (sum, mod) => sum + (mod.lessons?.length ?? 0),
      0,
    );

    return {
      id: row.id,
      instructorId: row.instructor_id,
      instructorName: row.profiles?.full_name ?? 'SkillForge Instructor',
      instructorHandle: row.profiles?.handle ?? 'instructor',
      slug: row.slug,
      title: row.title,
      subtitle: row.subtitle,
      description: row.description,
      category: row.category,
      skillTag: row.skill_tag,
      level: row.level,
      status: row.status,
      xpReward: row.xp_reward,
      thumbnailUrl: row.thumbnail_url,
      estimatedMinutes: row.estimated_minutes,
      lessonsCount,
      avgRating,
      reviewCount: reviews.length,
      createdAt: row.created_at,
    };
  });
}
