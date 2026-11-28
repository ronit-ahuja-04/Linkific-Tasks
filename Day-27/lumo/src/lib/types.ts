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

export type Level = Course['level'];

/** A lesson as the studio sees it: media, hidden state and how many questions it has. */
export interface StudioLesson extends Lesson {
  video_path: string | null;
  transcript: string | null;
  deleted_at: string | null;
  question_count: number;
}

export interface StudioUnit extends Omit<Unit, 'lessons'> {
  lessons: StudioLesson[];
}

export interface StudioCourse extends Course {
  units: StudioUnit[];
}

export interface Question {
  id: string;
  lesson_id: string;
  position: number;
  prompt: string;
  code: string | null;
  options: string[];
  concept: string;
}

export interface AnswerKey {
  correct_index: number;
  explanation: string;
  /** Option index (as a string) to the note shown when a learner picks that wrong option. */
  mistakes: Record<string, string>;
  verified: boolean;
}

export interface QuestionWithKey extends Question {
  key: AnswerKey | null;
}

export type JobStatus =
  'queued' | 'running' | 'waiting_quota' | 'succeeded' | 'failed' | 'cancelled';
export type JobKind = 'outline' | 'lesson' | 'quiz' | 'video';

export interface GenerationJob {
  id: string;
  course_id: string;
  kind: JobKind;
  status: JobStatus;
  progress: number;
  message: string;
  error: string | null;
  attempts: number;
  created_at: string;
  updated_at: string;
}
