import type { Difficulty, SkillTag } from '../types/lms';

export type ChallengeKind = 'quiz_strike' | 'bug_hunt' | 'sequence';

export interface MicroChallenge {
  id: string;
  kind: ChallengeKind;
  skillTag: SkillTag;
  xpReward: number;
  prompt: string;
  codeSnippet?: string;
  options: readonly string[];
  correctAnswer: string | readonly string[];
  explanation: string;
  hint: string;
}

export interface QuestLessonSlide {
  heading: string;
  visualTag: string;
  body: string;
  code?: string;
  durationSec: number;
}

export interface QuestNode {
  id: string;
  courseId: string;
  moduleTitle: string;
  order: number;
  title: string;
  difficulty: Difficulty;
  xpReward: number;
  estimatedMinutes: number;
  slides: readonly QuestLessonSlide[];
  challenge: MicroChallenge;
}

export interface BossQuestion {
  id: string;
  prompt: string;
  options: readonly string[];
  correctIndex: number;
  remediationNodeOrder: number;
  remediationHint: string;
}

export interface RealmBoss {
  id: string;
  name: string;
  title: string;
  taunt: string;
  passScorePercent: number;
  xpReward: number;
  questions: readonly BossQuestion[];
}

export interface RealmReview {
  id: string;
  authorName: string;
  authorHandle: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface RealmCurriculum {
  courseId: string;
  slug: string;
  badgeTitle: string;
  nodes: readonly QuestNode[];
  boss: RealmBoss;
  initialReviews: readonly RealmReview[];
}

export const HOME_ARCADE_CHALLENGES: readonly MicroChallenge[] = [
  {
    id: 'arcade-react-key',
    kind: 'bug_hunt',
    skillTag: 'react',
    xpReward: 40,
    prompt: 'Bug Hunt: Why does this animated list glitch when items reorder?',
    codeSnippet: `items.map((quest, index) => (
  <QuestRow key={index} quest={quest} />
))`,
    options: [
      'Using array index as key instead of quest.id breaks DOM identity',
      'Missing useEffect cleanup around map()',
      'QuestRow must be wrapped in React.memo exclusively',
    ],
    correctAnswer: 'Using array index as key instead of quest.id breaks DOM identity',
    explanation:
      'React matches component instances and Motion layoutId/enter states by key. Reordering with key={index} reuses the wrong row state.',
    hint: 'Look closely at what identifies each QuestRow across reorders.',
  },
  {
    id: 'arcade-rls-guard',
    kind: 'quiz_strike',
    skillTag: 'database',
    xpReward: 45,
    prompt:
      'Security Strike: A student edits their profile POST payload to role: "admin". How does SkillForge stop it?',
    codeSnippet: `CREATE TRIGGER trg_guard_role
BEFORE UPDATE ON public.profiles ...`,
    options: [
      'A Postgres BEFORE UPDATE trigger blocks non-admin role changes on the DB row',
      'Disabling the Admin button in CSS hides the field',
      'Clearing localStorage after login removes admin access',
    ],
    correctAnswer: 'A Postgres BEFORE UPDATE trigger blocks non-admin role changes on the DB row',
    explanation:
      'UI checks improve UX, while Postgres RLS + triggers enforce authorization even against forged direct API requests.',
    hint: 'Never trust client-only state for authorization boundaries.',
  },
  {
    id: 'arcade-redux-flow',
    kind: 'sequence',
    skillTag: 'frontend',
    xpReward: 50,
    prompt:
      'Pipeline Forge: Tap tiles in the exact order Redux Toolkit processes an async quest action!',
    options: [
      'Component dispatches thunk',
      'API executes & resolves',
      'Slice extraReducers update state',
      'Selector re-renders subscribed HUD',
    ],
    correctAnswer: [
      'Component dispatches thunk',
      'API executes & resolves',
      'Slice extraReducers update state',
      'Selector re-renders subscribed HUD',
    ],
    explanation:
      'Clean unidirectional flow keeps UI components thin, async boundaries predictable, and derived HUD values automatic.',
    hint: 'Start from user action in UI and end at re-rendering selectors.',
  },
];

export const DEMO_REALM_CURRICULA: Record<string, RealmCurriculum> = {
  'c1111111-1111-4111-8111-111111111111': {
    courseId: 'c1111111-1111-4111-8111-111111111111',
    slug: 'react-architecture-design-patterns',
    badgeTitle: 'React Architect',
    nodes: [
      {
        id: 'node-react-1',
        courseId: 'c1111111-1111-4111-8111-111111111111',
        moduleTitle: 'Act I · Feature-Sliced Realms',
        order: 1,
        title: 'Isolate Features, Not Technical Folders',
        difficulty: 'easy',
        xpReward: 75,
        estimatedMinutes: 8,
        slides: [
          {
            heading: 'Why components/ + utils/ explodes at scale',
            visualTag: 'CONCEPT DIAGRAM',
            durationSec: 4,
            body: 'Grouping by file role scatters every feature across 6 directories. Grouping by feature (auth, catalog, quest, guild) keeps slices, views, and tests cohesive.',
            code: `src/features/
  quest/
    questSlice.ts
    RealmQuestPage.tsx`,
          },
          {
            heading: 'Explicit public boundaries prevent circular imports',
            visualTag: 'ARCHITECTURE RULE',
            durationSec: 4,
            body: 'Keep state mutations inside typed Redux slices and route data fetching through src/lib/api/ adapters so components remain declarative.',
          },
        ],
        challenge: {
          id: 'ch-react-1',
          kind: 'quiz_strike',
          skillTag: 'react',
          xpReward: 40,
          prompt: 'Where should XP reward math and badge unlock checks live?',
          options: [
            'Pure functions in src/lib/game/ tested with Vitest',
            'Inside JSX click handlers duplicated per button',
            'Hardcoded inside CSS data attributes',
          ],
          correctAnswer: 'Pure functions in src/lib/game/ tested with Vitest',
          explanation:
            'Pure TypeScript domain helpers are deterministic, instant to test, and shareable between Redux slices and components.',
          hint: 'Think deterministic and UI-independent!',
        },
      },
      {
        id: 'node-react-2',
        courseId: 'c1111111-1111-4111-8111-111111111111',
        moduleTitle: 'Act I · Feature-Sliced Realms',
        order: 2,
        title: 'Derived State Beats Mirrored State',
        difficulty: 'normal',
        xpReward: 100,
        estimatedMinutes: 10,
        slides: [
          {
            heading: 'Never sync two pieces of state with useEffect',
            visualTag: 'ANTI-PATTERN ALERT',
            durationSec: 4,
            body: 'Storing filteredRealms separately from realms + filters causes laggy double renders and stale UI. Compute filtered values cleanly via useMemo or selectors.',
            code: `const filtered = useMemo(
  () => realms.filter(r => r.level === filters.level),
  [realms, filters.level]
);`,
          },
          {
            heading: 'Single source of truth scales to RPG HUDs',
            visualTag: 'POWER PATTERN',
            durationSec: 4,
            body: 'From one totalXp number, derive level, stage (Egg -> Guardian), title, and progress bar fraction automatically.',
          },
        ],
        challenge: {
          id: 'ch-react-2',
          kind: 'bug_hunt',
          skillTag: 'react',
          xpReward: 50,
          prompt: 'Squash the Bug: Which snippet cleanly avoids stale derived level state?',
          codeSnippet: `// Player XP updates after Boss victory`,
          options: [
            'const progress = progressFor(totalXp, 100);',
            'const [level, setLevel] = useState(1); useEffect(() => setLevel(calc(xp)), [xp]);',
            'Mutate store.getState().guild directly inside render',
          ],
          correctAnswer: 'const progress = progressFor(totalXp, 100);',
          explanation:
            'Deriving progress during render guarantees Level, Stage, and Progress Bar can never drift out of sync with XP.',
          hint: 'One calculation in render beats effect synchronization.',
        },
      },
      {
        id: 'node-react-3',
        courseId: 'c1111111-1111-4111-8111-111111111111',
        moduleTitle: 'Act II · Compound Motion UI',
        order: 3,
        title: 'LazyMotion + Reduced-Motion Contracts',
        difficulty: 'hard',
        xpReward: 125,
        estimatedMinutes: 12,
        slides: [
          {
            heading: 'Heavy juice without heavy first load',
            visualTag: 'PERFORMANCE',
            durationSec: 4,
            body: 'By wrapping the app in <LazyMotion features={loadFeatures} strict> and using m.*, animations load asynchronously without inflating the initial entry chunk.',
            code: `<MotionConfig reducedMotion="user">
  <AppRouter />
</MotionConfig>`,
          },
          {
            heading: 'Tactile springs + accessible fallbacks',
            visualTag: 'UX CONTRACT',
            durationSec: 4,
            body: 'Springs give Pip natural weight on every hop, while reducedMotion="user" lets assistive setups bypass sudden translation.',
          },
        ],
        challenge: {
          id: 'ch-react-3',
          kind: 'sequence',
          skillTag: 'typescript',
          xpReward: 60,
          prompt: 'Assemble the LazyMotion bundle-splitting sequence in order:',
          options: [
            'Wrap root in <LazyMotion strict>',
            'Dynamic import domMax chunk',
            'Animate views with m.div springs',
            'Honor prefers-reduced-motion',
          ],
          correctAnswer: [
            'Wrap root in <LazyMotion strict>',
            'Dynamic import domMax chunk',
            'Animate views with m.div springs',
            'Honor prefers-reduced-motion',
          ],
          explanation:
            'Strict LazyMotion catches accidental full-bundle motion imports during development and keeps the first paint snappy.',
          hint: 'Provider first, lazy chunk next, components + accessibility!',
        },
      },
    ],
    boss: {
      id: 'boss-react',
      name: 'NullPointer Hydra',
      title: 'Realm Boss · React Architecture',
      taunt: 'Three heads of prop-drilling, stale effects, and bloated bundles await!',
      passScorePercent: 67,
      xpReward: 200,
      questions: [
        {
          id: 'bq-react-1',
          prompt: 'Which choice eliminates double renders and stale sync bugs for filtered lists?',
          options: [
            'Store source array + filter criteria and compute via selector/useMemo',
            'Duplicate filtered items into a second Redux slice inside useEffect',
            'Read DOM text nodes before rendering',
          ],
          correctIndex: 0,
          remediationNodeOrder: 2,
          remediationHint: 'Review Node 2: Derived State Beats Mirrored State.',
        },
        {
          id: 'bq-react-2',
          prompt: 'Why use <LazyMotion features={loadFeatures} strict> with m.section?',
          options: [
            'Defers animation feature weights into an async chunk while catching eager motion imports',
            'Disables CSS transitions globally',
            'Bypasses TypeScript strict checks',
          ],
          correctIndex: 0,
          remediationNodeOrder: 3,
          remediationHint: 'Review Node 3: LazyMotion + Reduced-Motion Contracts.',
        },
        {
          id: 'bq-react-3',
          prompt: 'Best home for deterministic level math shared by multiple components?',
          options: [
            'Pure tested helper module (src/lib/game/xp.ts)',
            'Copy-pasted inline math in each component JSX',
            'Database trigger only with no frontend preview',
          ],
          correctIndex: 0,
          remediationNodeOrder: 1,
          remediationHint: 'Review Node 1: Isolate Features, Not Technical Folders.',
        },
      ],
    },
    initialReviews: [
      {
        id: 'rev-react-1',
        authorName: 'Ada Lovelace',
        authorHandle: 'ada',
        rating: 5,
        comment:
          'The winding quest map + LazyMotion breakdown made architecture stick in 20 minutes.',
        createdAt: '2026-11-24T12:00:00.000Z',
      },
      {
        id: 'rev-react-2',
        authorName: 'Maya Sharma',
        authorHandle: 'maya',
        rating: 5,
        comment:
          'Squashing the derived state bug with combo sparks was way more fun than reading docs!',
        createdAt: '2026-11-25T15:30:00.000Z',
      },
    ],
  },

  'c2222222-2222-4222-8222-222222222222': {
    courseId: 'c2222222-2222-4222-8222-222222222222',
    slug: 'supabase-postgres-security-mastery',
    badgeTitle: 'RLS Shieldbearer',
    nodes: [
      {
        id: 'node-db-1',
        courseId: 'c2222222-2222-4222-8222-222222222222',
        moduleTitle: 'Act I · Row Level Security',
        order: 1,
        title: 'Lock Tables First, Open Read Explicitly',
        difficulty: 'easy',
        xpReward: 80,
        estimatedMinutes: 9,
        slides: [
          {
            heading: 'RLS turns every SQL query into a tenant gate',
            visualTag: 'SECURITY CORE',
            durationSec: 4,
            body: 'Enabling ALTER TABLE ... ENABLE ROW LEVEL SECURITY denies everything by default until policies grant exact auth.uid() access.',
            code: `ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_enrollments ON enrollments
  USING (auth.uid() = student_id);`,
          },
        ],
        challenge: {
          id: 'ch-db-1',
          kind: 'quiz_strike',
          skillTag: 'database',
          xpReward: 40,
          prompt:
            'What happens immediately after enabling RLS on a new Postgres table with 0 policies?',
          options: [
            'All client-role reads and writes are denied by default',
            'Everyone gets read-only access automatically',
            'Only admins lose access',
          ],
          correctAnswer: 'All client-role reads and writes are denied by default',
          explanation:
            'Postgres fails closed on RLS tables unless an explicit permissive policy matches.',
          hint: 'Fail-closed is Postgres security bedrock.',
        },
      },
      {
        id: 'node-db-2',
        courseId: 'c2222222-2222-4222-8222-222222222222',
        moduleTitle: 'Act II · Anti-Farming RPCs',
        order: 2,
        title: 'Grade Quizzes & Award XP Inside Postgres',
        difficulty: 'hard',
        xpReward: 120,
        estimatedMinutes: 12,
        slides: [
          {
            heading: 'Hide answer keys from client SELECT queries',
            visualTag: 'RPC AUTHORITY',
            durationSec: 4,
            body: 'Students fetch questions through get_student_quiz_questions(), while submit_quiz_attempt() grades in SECURITY DEFINER SQL and adds only best-score XP deltas.',
          },
        ],
        challenge: {
          id: 'ch-db-2',
          kind: 'bug_hunt',
          skillTag: 'database',
          xpReward: 55,
          prompt: 'Stop XP Farming: Which design prevents infinite XP from re-taking a quiz?',
          options: [
            'Store best_score per (student_id, quiz_id) and credit only positive score delta',
            'Hide the Retake button with display: none',
            'Trust client POST { xpEarned: 9999 }',
          ],
          correctAnswer:
            'Store best_score per (student_id, quiz_id) and credit only positive score delta',
          explanation:
            'Idempotent score-delta tracking inside Postgres guarantees learners can practice freely without inflating XP.',
          hint: 'Allow unlimited practice, limit net XP to net improvement.',
        },
      },
    ],
    boss: {
      id: 'boss-db',
      name: 'Schema Kraken',
      title: 'Realm Boss · Postgres Defense',
      taunt: 'Forged tokens and leaked answer keys feed the Kraken!',
      passScorePercent: 50,
      xpReward: 180,
      questions: [
        {
          id: 'bq-db-1',
          prompt: 'How do you stop users from self-promoting to admin on profile updates?',
          options: [
            'Enforce a BEFORE UPDATE trigger verifying actor is already admin',
            'Disable the select dropdown in React DevTools',
            'Rename the column to user_type',
          ],
          correctIndex: 0,
          remediationNodeOrder: 1,
          remediationHint: 'Check database trigger protection from Node 1.',
        },
        {
          id: 'bq-db-2',
          prompt: 'Why execute submit_quiz_attempt as a Postgres RPC instead of frontend grading?',
          options: [
            'Server keeps correct answers secret and computes idempotent XP deltas atomically',
            'Because SQL runs faster than JavaScript loops',
            'To skip TypeScript compilation',
          ],
          correctIndex: 0,
          remediationNodeOrder: 2,
          remediationHint: 'Review Node 2: Anti-Farming RPCs.',
        },
      ],
    },
    initialReviews: [
      {
        id: 'rev-db-1',
        authorName: 'Ada Lovelace',
        authorHandle: 'ada',
        rating: 5,
        comment: 'Best visual walkthrough of fail-closed RLS and anti-farming SQL RPCs.',
        createdAt: '2026-11-23T11:00:00.000Z',
      },
    ],
  },

  'c3333333-3333-4333-8333-333333333333': {
    courseId: 'c3333333-3333-4333-8333-333333333333',
    slug: 'tactile-design-systems-tailwind-v4',
    badgeTitle: 'Tactile Artisan',
    nodes: [
      {
        id: 'node-design-1',
        courseId: 'c3333333-3333-4333-8333-333333333333',
        moduleTitle: 'Act I · Plum, Violet & Gold Tokens',
        order: 1,
        title: 'Semantic CSS Tokens + 3D Press Physics',
        difficulty: 'normal',
        xpReward: 110,
        estimatedMinutes: 10,
        slides: [
          {
            heading: 'Solid lip shadows beat blurry web shadows',
            visualTag: 'TACTILE CRAFT',
            durationSec: 4,
            body: 'Replacing mushy blur shadows with a crisp 4px bottom lip (box-shadow: 0 4px 0 var(--brand-deep)) plus translateY(2px) on :active makes buttons feel like physical arcade keys.',
          },
        ],
        challenge: {
          id: 'ch-design-1',
          kind: 'quiz_strike',
          skillTag: 'design',
          xpReward: 50,
          prompt: 'Why pair CSS @theme inline variables with .dark overrides in Tailwind v4?',
          options: [
            'Components reference semantic utilities (bg-surface, text-ink) that flip themes automatically',
            'So every card needs manual dark: hex codes',
            'To bypass color contrast requirements',
          ],
          correctAnswer:
            'Components reference semantic utilities (bg-surface, text-ink) that flip themes automatically',
          explanation:
            'Tokenized theme variables give consistent contrast in both light and dark modes with zero duplicate class clutter.',
          hint: 'Write once with semantic names!',
        },
      },
      {
        id: 'node-design-2',
        courseId: 'c3333333-3333-4333-8333-333333333333',
        moduleTitle: 'Act II · Emotional UI Feedback',
        order: 2,
        title: 'Celebrate Progress With Confetti & Sound',
        difficulty: 'hard',
        xpReward: 140,
        estimatedMinutes: 11,
        slides: [
          {
            heading: 'Peak-End Rule for Educational Games',
            visualTag: 'GAME PSYCHOLOGY',
            durationSec: 4,
            body: 'Every cleared node gives immediate micro-juice (floating XP sparks + rising pentatonic tone), while Boss victories trigger full-screen mood color theater.',
          },
        ],
        challenge: {
          id: 'ch-design-2',
          kind: 'sequence',
          skillTag: 'design',
          xpReward: 60,
          prompt: 'Arrange the tactile micro-interaction loop from user click to celebration:',
          options: [
            'Chunky spring press down',
            'Instant chime + XP particle',
            'XP bar fills smoothly',
            'Pip hops with mood change',
          ],
          correctAnswer: [
            'Chunky spring press down',
            'Instant chime + XP particle',
            'XP bar fills smoothly',
            'Pip hops with mood change',
          ],
          explanation:
            'Immediate sub-100ms sensory feedback makes learning feel crisp, responsive, and rewarding.',
          hint: 'Start at finger contact, end with Pip celebration.',
        },
      },
    ],
    boss: {
      id: 'boss-design',
      name: 'Layout Phantom',
      title: 'Realm Boss · Tactile Craft',
      taunt: 'Low contrast text and dead buttons stalk the unwary!',
      passScorePercent: 50,
      xpReward: 210,
      questions: [
        {
          id: 'bq-design-1',
          prompt: 'Which button motion mimics physical arcade key travel?',
          options: [
            'Crisp bottom shadow lip + downward Y shift on press',
            '500ms linear opacity fade only',
            'Removing hover/focus indicators completely',
          ],
          correctIndex: 0,
          remediationNodeOrder: 1,
          remediationHint: 'Review Node 1: Semantic CSS Tokens + 3D Press Physics.',
        },
        {
          id: 'bq-design-2',
          prompt: 'How should motion behave for users who set prefers-reduced-motion?',
          options: [
            'Respect MotionConfig reducedMotion="user" and provide instant final state without disorienting translation',
            'Force full confetti and screen shake anyway',
            'Hide all interactive content',
          ],
          correctIndex: 0,
          remediationNodeOrder: 2,
          remediationHint: 'Remember accessibility invariants from Node 2 & AGENTS.md.',
        },
      ],
    },
    initialReviews: [
      {
        id: 'rev-design-1',
        authorName: 'Alex Mercer',
        authorHandle: 'alex',
        rating: 5,
        comment:
          'The tactile lip shadows + Pip reactions completely changed how our team builds UI.',
        createdAt: '2026-11-24T17:00:00.000Z',
      },
    ],
  },

  'c4444444-4444-4444-8444-444444444444': {
    courseId: 'c4444444-4444-4444-8444-444444444444',
    slug: 'typescript-testing-vitest-playwright',
    badgeTitle: 'Audit Paladin',
    nodes: [
      {
        id: 'node-test-1',
        courseId: 'c4444444-4444-4444-8444-444444444444',
        moduleTitle: 'Act I · Strict TypeScript Contracts',
        order: 1,
        title: 'Catch Undefined Traps With noUncheckedIndexedAccess',
        difficulty: 'normal',
        xpReward: 100,
        estimatedMinutes: 9,
        slides: [
          {
            heading: 'Array indexing always yields T | undefined',
            visualTag: 'TYPE SAFETY',
            durationSec: 4,
            body: 'Enabling noUncheckedIndexedAccess stops silent runtime TypeErrors when looking up dictionary keys or array offsets in game math.',
          },
        ],
        challenge: {
          id: 'ch-test-1',
          kind: 'bug_hunt',
          skillTag: 'typescript',
          xpReward: 50,
          prompt: 'Which lookup safely handles missing tint indices under strict TypeScript?',
          options: [
            'return PIP_TINTS[safe] ?? PIP_TINTS[0];',
            'return (PIP_TINTS as any)[safe];',
            'Ignore tsconfig errors on build',
          ],
          correctAnswer: 'return PIP_TINTS[safe] ?? PIP_TINTS[0];',
          explanation:
            'Nullish fallback keeps types sound and avoids runtime crashes on unexpected input.',
          hint: 'Zero any, always provide a safe fallback.',
        },
      },
      {
        id: 'node-test-2',
        courseId: 'c4444444-4444-4444-8444-444444444444',
        moduleTitle: 'Act II · Accessible Component Specs',
        order: 2,
        title: 'Query by ARIA Role, Not Brittle CSS Classes',
        difficulty: 'hard',
        xpReward: 130,
        estimatedMinutes: 11,
        slides: [
          {
            heading: 'Tests prove accessibility automatically',
            visualTag: 'TESTING LIBRARY',
            durationSec: 4,
            body: 'Querying getByRole("button", { name: ... }) tests both functionality and screen-reader usability in a single assertion.',
          },
        ],
        challenge: {
          id: 'ch-test-2',
          kind: 'quiz_strike',
          skillTag: 'testing',
          xpReward: 55,
          prompt: 'Which Vitest + Testing Library selector enforces accessible UI semantics?',
          options: [
            'screen.getByRole("heading", { name: /Student Command Center/i })',
            'container.querySelector("div > span.text-xl")',
            'window.__internalDebugNode',
          ],
          correctAnswer: 'screen.getByRole("heading", { name: /Student Command Center/i })',
          explanation:
            'Role queries break if semantic headings or labels disappear — catching accessibility regressions early.',
          hint: 'Prefer user-visible roles and labels!',
        },
      },
    ],
    boss: {
      id: 'boss-test',
      name: 'Flaky Golem',
      title: 'Realm Boss · Quality Gate',
      taunt: 'Unhandled nulls and brittle CSS selectors fuel the Golem!',
      passScorePercent: 50,
      xpReward: 190,
      questions: [
        {
          id: 'bq-test-1',
          prompt: 'Why forbid typescript/no-explicit-any in oxlint?',
          options: [
            'Prevents silently punching holes through strict type guarantees across API/state layers',
            'Makes bundle files larger',
            'Replaces runtime validation',
          ],
          correctIndex: 0,
          remediationNodeOrder: 1,
          remediationHint: 'Review Node 1: Strict TypeScript Contracts.',
        },
        {
          id: 'bq-test-2',
          prompt: 'Best Testing Library habit for interactive buttons & modals?',
          options: [
            'Use getByRole / findByRole with accessible names and userEvent interactions',
            'Test internal private Redux state keys with shallow snapshots',
            'Sleep 5000ms after every click',
          ],
          correctIndex: 0,
          remediationNodeOrder: 2,
          remediationHint: 'Review Node 2: Accessible Component Specs.',
        },
      ],
    },
    initialReviews: [
      {
        id: 'rev-test-1',
        authorName: 'Maya Sharma',
        authorHandle: 'maya',
        rating: 5,
        comment: 'Boss fight literally drilled accessible role selectors into muscle memory.',
        createdAt: '2026-11-25T10:15:00.000Z',
      },
    ],
  },
};
