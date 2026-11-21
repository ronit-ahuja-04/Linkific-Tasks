/**
 * The fixed vocabulary of the game. Every union type is DERIVED from a list (`as const` + indexed access),
 * so the list the UI renders and the type the compiler checks can never disagree. The same values exist as
 * Postgres enums in supabase/migrations, and a test checks the two match.
 */
export const SKILLS = [
  'html_css', 'javascript', 'react', 'state', 'routing', 'styling', 'testing',
  'typescript', 'nextjs', 'backend', 'database', 'auth', 'devops',
] as const;
export type Skill = (typeof SKILLS)[number];

export const SKILL_LABELS: Record<Skill, string> = {
  html_css: 'HTML & CSS', javascript: 'JavaScript', react: 'React', state: 'State', routing: 'Routing',
  styling: 'Styling', testing: 'Testing', typescript: 'TypeScript', nextjs: 'Next.js', backend: 'Backend',
  database: 'Database', auth: 'Auth', devops: 'DevOps',
};

export const DIFFICULTIES = ['easy', 'normal', 'hard', 'boss'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/** XP a quest is worth before bonuses */
export const DIFFICULTY_XP: Record<Difficulty, number> = { easy: 50, normal: 100, hard: 150, boss: 250 };

export const CLASSES = ['frontend_mage', 'backend_knight', 'fullstack_ranger', 'design_bard'] as const;
export type CharacterClass = (typeof CLASSES)[number];

export interface ClassInfo {
  label: string;
  /** skills that earn the class bonus */
  home: readonly Skill[];
  motto: string;
}
export const CLASS_INFO: Record<CharacterClass, ClassInfo> = {
  frontend_mage: { label: 'Frontend Mage', home: ['html_css', 'javascript', 'react', 'styling'], motto: 'Bends the DOM to their will.' },
  backend_knight: { label: 'Backend Knight', home: ['backend', 'database', 'auth', 'devops'], motto: 'Guards the data, holds the line.' },
  fullstack_ranger: { label: 'Full-stack Ranger', home: ['react', 'nextjs', 'backend', 'database'], motto: 'At home on both sides of the wire.' },
  design_bard: { label: 'Design Bard', home: ['html_css', 'styling', 'state', 'routing'], motto: 'Makes every screen sing.' },
};

/** Rules with numbers in them, named once */
export const RULES = {
  prBonus: 20,
  /** only the first three PR links of a quest earn the bonus */
  prBonusCap: 3,
  maxPrLinks: 5,
  maxSkills: 4,
  /** +10% when the previous day was also logged, and +10% on a class's home skills (applied as ×11/10, rounded down) */
  bonusNumerator: 11,
  bonusDenominator: 10,
  /** level L starts at levelScale × L(L-1)/2 XP: 100 for the character (0, 100, 300, 600, ...) */
  characterLevelScale: 100,
  /** skills level faster: 0, 50, 150, 300, ... */
  skillLevelScale: 50,
  /** Pip falls asleep when the newest quest is this many calendar days old */
  sleepyAfterDays: 3,
} as const;

export const TITLES: readonly { from: number; title: string }[] = [
  { from: 1, title: 'Trainee' },
  { from: 3, title: 'Apprentice' },
  { from: 5, title: 'Journeyman' },
  { from: 8, title: 'Adept' },
  { from: 12, title: 'Expert' },
  { from: 16, title: 'Master' },
];
