/** Row shapes of the Lumo schema (supabase/migrations/20261128000001_lumo_schema.sql). */
export type Role = 'learner' | 'instructor' | 'admin';
export type CourseStatus = 'draft' | 'in_review' | 'live' | 'archived';
export type LessonKind = 'video' | 'quiz' | 'practice' | 'guardian';
export type Guardian = 'byte' | 'nova' | 'mystery';
export type Topic = 'code' | 'data' | 'design' | 'money' | 'languages' | 'mind';

export interface Profile {
  id: string;
  handle: string;
  display_name: string;
  role: Role;
  timezone: string;
  daily_goal_minutes: number;
  wisp_persona: 'cheeky' | 'calm' | 'coach';
  light: number;
  flame_days: number;
  best_flame: number;
  last_goal_date: string | null;
  embers: number;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  island_name: string;
  guardian: Guardian;
  topic: Topic;
  level: 'beginner' | 'intermediate' | 'advanced';
  summary: string;
  owner_id: string;
  status: CourseStatus;
  version: number;
  ai_generated: boolean;
  updated_at: string;
}

export interface Lesson {
  id: string;
  unit_id: string;
  position: number;
  kind: LessonKind;
  title: string;
  summary: string;
  duration_seconds: number | null;
  xp: number;
}

export interface Unit {
  id: string;
  course_id: string;
  position: number;
  title: string;
  summary: string;
  lessons: Lesson[];
}

export interface CourseMap extends Course {
  units: Unit[];
}
