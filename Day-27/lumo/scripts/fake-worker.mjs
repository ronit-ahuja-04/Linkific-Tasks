// The fake AI worker for local development: npm run worker
//
// It plays the part the real pipeline (Gemini, M4) will play: pick up queued generation jobs, report progress
// step by step (the studio watches over Realtime), and write a drafted unit into the course. The questions it
// writes are marked unverified, so the instructor has to check each one.
//
// It costs nothing and calls no AI. It only ever runs against the LOCAL stack: it reads the local service-role
// key from `supabase status` into memory (never printed or written to disk) and refuses any non-local URL.
//
// Options: LUMO_FAKE_QUOTA=1 stops halfway with "waiting_quota", to try the out-of-quota screen.
import { execSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const status = execSync('npx supabase status -o env', {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'ignore'],
});
const read = (name) => status.match(new RegExp(`^${name}="?([^"\\n]+)"?$`, 'm'))?.[1];
const url = read('API_URL');
const serviceKey = read('SERVICE_ROLE_KEY');

if (!url || !serviceKey) {
  console.error('Could not read the local Supabase stack. Start it first: npm run db:start');
  process.exit(1);
}
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(url)) {
  console.error('The fake worker only runs against the local stack.');
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const STEP_MS = Number(process.env.LUMO_FAKE_STEP_MS ?? 1500);

/** What Wisp "writes" for each topic. Real generation (M4) replaces this with the course's own subject. */
const DRAFTS = {
  code: {
    unit: 'Functions: reusable spells',
    video: ['Functions in 90 seconds', 'Name a block of code once, use it everywhere.'],
    questions: [
      [
        'What does this return?',
        'function double(n) {\n  return n * 2\n}\ndouble(4)',
        ['8', '4', 'undefined'],
        0,
        'double(4) runs the body with n = 4 and returns 4 * 2 = 8.',
        'return values',
      ],
      [
        'Which line calls the function?',
        null,
        ['function greet() {}', 'greet()', 'return greet'],
        1,
        'Parentheses after the name call it; the first line only defines it.',
        'calling vs defining',
      ],
    ],
  },
  data: {
    unit: 'Averages that don’t lie',
    video: [
      'Mean, median, mode in 90 seconds',
      'Three ways to say "typical", and when each misleads.',
    ],
    questions: [
      [
        'Salaries: 30, 32, 35, 400. Which "typical" value is fairest?',
        null,
        ['Mean', 'Median', 'Maximum'],
        1,
        'One huge value drags the mean up; the median stays in the middle.',
        'median vs mean',
      ],
      [
        'What is the mode of 2, 3, 3, 5?',
        null,
        ['3', '3.25', '5'],
        0,
        'The mode is the most frequent value: 3 appears twice.',
        'mode',
      ],
    ],
  },
  design: {
    unit: 'Type that people can read',
    video: ['Picking a typeface in 90 seconds', 'Size, spacing and contrast before style.'],
    questions: [
      [
        'A comfortable line length for body text is about…',
        null,
        ['20 characters', '45–75 characters', '150 characters'],
        1,
        'Around 45–75 characters per line keeps eyes from losing their place.',
        'line length',
      ],
      [
        'Which helps readability most?',
        null,
        ['More fonts', 'Enough line spacing', 'All caps'],
        1,
        'Line spacing of about 1.4–1.6 gives each line room to breathe.',
        'line spacing',
      ],
    ],
  },
  money: {
    unit: 'Interest: money that grows',
    video: [
      'Compound interest in 90 seconds',
      'Interest on your interest, and why starting early wins.',
    ],
    questions: [
      [
        '₹1,000 at 10% a year, compounded. After 2 years?',
        null,
        ['₹1,200', '₹1,210', '₹1,100'],
        1,
        'Year 1: 1,100. Year 2: 10% of 1,100 is 110, so 1,210.',
        'compound interest',
      ],
      [
        'What makes compound interest grow fastest?',
        null,
        ['Time', 'Checking often', 'Small deposits only'],
        0,
        'Each year builds on the last, so more years means much more growth.',
        'time in the market',
      ],
    ],
  },
  languages: {
    unit: 'Greetings for every time of day',
    video: ['Saying hello in 90 seconds', 'Morning, evening and the polite forms.'],
    questions: [
      [
        '"Buenas noches" is used…',
        null,
        ['In the morning', 'At night', 'At noon'],
        1,
        '"Noches" means nights: it’s for the evening and night.',
        'time-of-day greetings',
      ],
      [
        'Which is the polite "you" in Spanish?',
        null,
        ['tú', 'usted', 'vos'],
        1,
        '"Usted" is the formal you, for strangers and elders.',
        'formal you',
      ],
    ],
  },
  mind: {
    unit: 'How memory really works',
    video: ['Forgetting curves in 90 seconds', 'Why reviewing just before you forget works best.'],
    questions: [
      [
        'When is the best time to review something?',
        null,
        ['Right after learning it', 'Just before you’d forget it', 'Never'],
        1,
        'Reviewing at the edge of forgetting makes the memory last much longer.',
        'spaced repetition',
      ],
      [
        'Testing yourself is called…',
        null,
        ['Retrieval practice', 'Re-reading', 'Highlighting'],
        0,
        'Pulling an answer from memory strengthens it more than reading again.',
        'retrieval practice',
      ],
    ],
  },
};

const STEPS = [
  [10, 'Reading the course brief'],
  [30, 'Sketching the unit outline'],
  [55, 'Writing the video script'],
  [75, 'Drafting quiz questions'],
  [90, 'Checking every answer twice'],
];

async function setJob(id, fields) {
  const { error } = await db.from('generation_jobs').update(fields).eq('id', id);
  if (error) throw error;
}

async function stillWanted(id) {
  const { data } = await db.from('generation_jobs').select('status').eq('id', id).single();
  return data?.status === 'running';
}

async function writeDraft(courseId) {
  const { data: course, error } = await db
    .from('courses')
    .select('topic')
    .eq('id', courseId)
    .single();
  if (error) throw error;
  const draft = DRAFTS[course.topic] ?? DRAFTS.code;

  const { data: unit, error: unitError } = await db
    .from('units')
    .insert({
      course_id: courseId,
      title: draft.unit,
      summary: 'Drafted by Wisp. Review before publishing.',
    })
    .select('id')
    .single();
  if (unitError) throw unitError;

  const { error: videoError } = await db.from('lessons').insert({
    unit_id: unit.id,
    kind: 'video',
    title: draft.video[0],
    summary: draft.video[1],
    duration_seconds: 90,
    xp: 10,
    transcript: `${draft.video[1]} (Script drafted by Wisp; the animated video is rendered in M2b/M4.)`,
  });
  if (videoError) throw videoError;

  const { data: quiz, error: quizError } = await db
    .from('lessons')
    .insert({
      unit_id: unit.id,
      kind: 'quiz',
      title: 'Quick check',
      summary: 'Two questions to lock it in.',
      xp: 15,
    })
    .select('id')
    .single();
  if (quizError) throw quizError;

  for (const [prompt, code, options, correct, explanation, concept] of draft.questions) {
    const { data: q, error: qError } = await db
      .from('questions')
      .insert({ lesson_id: quiz.id, prompt, code, options, concept })
      .select('id')
      .single();
    if (qError) throw qError;
    const { error: kError } = await db
      .from('answer_keys')
      .insert({ question_id: q.id, correct_index: correct, explanation, verified: false });
    if (kError) throw kError;
  }

  await db.from('courses').update({ ai_generated: true }).eq('id', courseId);
}

async function runJob(job) {
  // Claim it: only one worker wins, even if two are running.
  const { data: claimed } = await db
    .from('generation_jobs')
    .update({
      status: 'running',
      progress: 2,
      message: 'Wisp is on it',
      attempts: job.attempts + 1,
    })
    .eq('id', job.id)
    .eq('status', 'queued')
    .select('id');
  if (!claimed?.length) return;
  console.log(`job ${job.id.slice(0, 8)}: started (${job.kind})`);

  for (const [i, [progress, message]] of STEPS.entries()) {
    await sleep(STEP_MS);
    if (!(await stillWanted(job.id))) {
      console.log(`job ${job.id.slice(0, 8)}: cancelled, nothing written`);
      return;
    }
    if (process.env.LUMO_FAKE_QUOTA === '1' && i === 2) {
      await setJob(job.id, {
        status: 'waiting_quota',
        message: "Out of today's free AI quota: resumes tomorrow",
      });
      console.log(`job ${job.id.slice(0, 8)}: waiting for quota (simulated)`);
      return;
    }
    await setJob(job.id, { progress, message });
  }

  try {
    await writeDraft(job.course_id);
    await setJob(job.id, {
      status: 'succeeded',
      progress: 100,
      message: 'Draft ready to review',
      requests_used: 1,
    });
    console.log(`job ${job.id.slice(0, 8)}: done`);
  } catch (error) {
    await setJob(job.id, {
      status: 'failed',
      error: error.message ?? 'Unknown error',
      message: 'Failed',
    });
    console.error(`job ${job.id.slice(0, 8)}: failed: ${error.message}`);
  }
}

console.log(`Fake AI worker watching ${url} for queued jobs (Ctrl+C to stop).`);
for (;;) {
  const { data: jobs, error } = await db
    .from('generation_jobs')
    .select('id, course_id, kind, attempts')
    .eq('status', 'queued')
    .order('created_at')
    .limit(5);
  if (error) console.error(`Could not read jobs: ${error.message}`);
  for (const job of jobs ?? []) await runJob(job);
  await sleep(1500);
}
