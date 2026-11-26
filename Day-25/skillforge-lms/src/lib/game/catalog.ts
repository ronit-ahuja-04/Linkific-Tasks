import type { CharacterClass, Difficulty, SkillTag } from '../../types/lms';

export const SKILLS: readonly SkillTag[] = [
  'frontend',
  'backend',
  'react',
  'typescript',
  'database',
  'design',
  'testing',
] as const;

export const SKILL_LABELS: Record<SkillTag, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  react: 'React',
  typescript: 'TypeScript',
  database: 'Database',
  design: 'Design',
  testing: 'Testing',
};

export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'normal', 'hard', 'boss'] as const;

export const DIFFICULTY_XP: Record<Difficulty, number> = {
  easy: 50,
  normal: 100,
  hard: 150,
  boss: 250,
};

export const CLASSES: readonly CharacterClass[] = [
  'frontend_mage',
  'backend_knight',
  'fullstack_ranger',
  'design_bard',
] as const;

export interface ClassInfo {
  label: string;
  home: readonly SkillTag[];
  motto: string;
}

export const CLASS_INFO: Record<CharacterClass, ClassInfo> = {
  frontend_mage: {
    label: 'Frontend Mage',
    home: ['frontend', 'react', 'typescript', 'design'],
    motto: 'Bends components and state to their will.',
  },
  backend_knight: {
    label: 'Backend Knight',
    home: ['backend', 'database', 'testing'],
    motto: 'Guards the schema, holds the RLS line.',
  },
  fullstack_ranger: {
    label: 'Full-stack Ranger',
    home: ['react', 'typescript', 'backend', 'database'],
    motto: 'At home on both sides of the wire.',
  },
  design_bard: {
    label: 'Design Bard',
    home: ['design', 'frontend', 'react'],
    motto: 'Makes every screen sing.',
  },
};

export const GAME_RULES = {
  bonusNumerator: 11,
  bonusDenominator: 10,
  characterLevelScale: 100,
  skillLevelScale: 50,
} as const;

export const TITLES: readonly { from: number; title: string }[] = [
  { from: 1, title: 'Trainee' },
  { from: 3, title: 'Apprentice' },
  { from: 5, title: 'Journeyman' },
  { from: 8, title: 'Adept' },
  { from: 12, title: 'Expert' },
  { from: 16, title: 'Master' },
];

export const PIP_TINTS = [
  '#FFF7EC',
  '#DFF7E8',
  '#DDEEFF',
  '#FFE4D6',
  '#EDE4FF',
  '#FFF6C8',
  '#FFE0EA',
  '#ECEAE6',
] as const;

export const PIP_TINT_NAMES = [
  'Cream',
  'Mint',
  'Sky',
  'Peach',
  'Lilac',
  'Lemon',
  'Rose',
  'Stone',
] as const;

export const PIP_ACCESSORIES = [
  'None',
  'Glasses',
  'Scarf',
  'Bow',
  'Headphones',
  'Freckles',
] as const;
