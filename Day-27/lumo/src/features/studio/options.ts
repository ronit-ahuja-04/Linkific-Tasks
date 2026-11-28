import { BookOpenCheck, Clapperboard, Dumbbell, Swords, type LucideIcon } from 'lucide-react';
import type { CourseStatus, Guardian, LessonKind, Level, Topic } from '../../lib/types';

export const TOPICS: { value: Topic; label: string }[] = [
  { value: 'code', label: 'Code' },
  { value: 'data', label: 'Data' },
  { value: 'design', label: 'Design' },
  { value: 'money', label: 'Money' },
  { value: 'languages', label: 'Languages' },
  { value: 'mind', label: 'Mind' },
];

export const LEVELS: { value: Level; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export const GUARDIANS: { value: Guardian; label: string; blurb: string }[] = [
  { value: 'byte', label: 'Byte', blurb: 'The robot crab of Code Reef.' },
  { value: 'nova', label: 'Nova', blurb: 'The astronaut axolotl of Starfall Lagoon.' },
  { value: 'mystery', label: 'Mystery', blurb: 'A new guardian, revealed when the island opens.' },
];

export const LESSON_KINDS: { value: LessonKind; label: string; hint: string; icon: LucideIcon }[] =
  [
    {
      value: 'video',
      label: 'Video bite',
      hint: 'A short video (under 2 minutes works best).',
      icon: Clapperboard,
    },
    { value: 'quiz', label: 'Quiz', hint: 'Questions graded by the server.', icon: BookOpenCheck },
    { value: 'practice', label: 'Practice', hint: 'Hands-on tries, no pressure.', icon: Dumbbell },
    {
      value: 'guardian',
      label: 'Guardian battle',
      hint: 'Mixed questions that end a unit.',
      icon: Swords,
    },
  ];

export const KIND_BY_VALUE = Object.fromEntries(LESSON_KINDS.map((k) => [k.value, k])) as Record<
  LessonKind,
  (typeof LESSON_KINDS)[number]
>;

export const STATUS: Record<CourseStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-glow-soft text-glow-ink' },
  in_review: { label: 'In review', className: 'bg-violet-soft text-violet-deep' },
  live: { label: 'Live', className: 'bg-lagoon-soft text-lagoon-ink' },
  archived: { label: 'Archived', className: 'bg-mist text-dusk' },
};

export function formatDuration(seconds: number | null) {
  if (seconds === null) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
}
