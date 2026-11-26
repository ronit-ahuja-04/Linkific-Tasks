export type UserRole = 'student' | 'instructor' | 'admin';

export type CharacterClass =
  'frontend_mage' | 'backend_knight' | 'fullstack_ranger' | 'design_bard';

export type SkillTag =
  'frontend' | 'backend' | 'react' | 'typescript' | 'database' | 'design' | 'testing';

export type Difficulty = 'easy' | 'normal' | 'hard' | 'boss';

export type PipStage = 'egg' | 'sprout' | 'sprite' | 'guardian';
export type PipMood = 'happy' | 'worried' | 'sleepy' | 'proud' | 'fired_up';

export interface UserProfile {
  id: string;
  handle: string;
  fullName: string;
  role: UserRole;
  characterClass: CharacterClass;
  pipTint: number;
  pipAccessory: number;
  bio: string;
  avatarUrl: string | null;
  createdAt: string;
}

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseStatus = 'draft' | 'published';

export interface CourseRealm {
  id: string;
  instructorId: string;
  instructorName: string;
  instructorHandle: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  skillTag: SkillTag;
  level: CourseLevel;
  status: CourseStatus;
  xpReward: number;
  thumbnailUrl: string | null;
  estimatedMinutes: number;
  lessonsCount: number;
  avgRating: number;
  reviewCount: number;
  createdAt: string;
}

export interface GuildEntry {
  userId: string;
  handle: string;
  fullName: string;
  role: UserRole;
  characterClass: CharacterClass;
  pipTint: number;
  pipAccessory: number;
  totalXp: number;
  completedLessons: number;
  passedQuizzes: number;
  certificatesEarned: number;
  streakDays: number;
  reviewsCount: number;
  distinctSkillsCount: number;
  skillXp: Partial<Record<SkillTag, number>>;
}

export interface ApiError {
  code: string;
  message: string;
}
