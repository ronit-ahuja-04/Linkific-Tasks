// Lumo's content worker: npm run worker
//
// Picks up "draft a unit" jobs queued in the studio and runs the pipeline, reporting each step live (the studio
// watches the job row over Realtime):
//
//   1. Write   one AI request drafts the whole unit (video script + quiz) as structured JSON
//   2. Check   the draft's shape and lengths; one retry with feedback if it's unusable
//   3. Verify  every "what does this print?" question is run in a sandbox; wrong ones are fixed or dropped
//   4. Save    a hidden draft unit (video lesson + quiz, answer keys marked "needs checking")
//   5. Render  the video with the video package (local voice + Remotion); one retry, then the lesson falls back
//              to its transcript
//
// The unit stays invisible to learners until the instructor checks each question and publishes it.
//
// Providers: AI_PROVIDER=gemini (needs GEMINI_API_KEY) or fake (no AI). Settings come from the environment or
// from .env.worker (gitignored), which only you write. Keys are never printed or logged.
// Free-quota handling: a per-minute limit waits and retries; the daily limit parks the job as "waiting for
// quota" until the quota resets (midnight Pacific time), then it resumes on its own.
//
// It only ever connects to the LOCAL Supabase stack (service-role key read from `supabase status`, in memory).
import { execSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { DRAFT_SCHEMA, checkDraft, draftPrompt, toVideoScript } from './ai/draft.mjs';
import { QuotaError, fakeProvider, geminiProvider } from './ai/providers.mjs';
import { verifyQuestions } from './ai/sandbox.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const videoRoot = path.join(appRoot, 'video');

// ---------------------------------------------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------------------------------------------
const fileEnv = {};
const envFile = path.join(appRoot, '.env.worker');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (m) fileEnv[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const setting = (name) => process.env[name] || fileEnv[name] || '';

const geminiKey = setting('GEMINI_API_KEY');
const providerName = setting('AI_PROVIDER') || (geminiKey ? 'gemini' : 'fake');
if (providerName === 'gemini' && !geminiKey) {
  console.error('AI_PROVIDER=gemini needs GEMINI_API_KEY (see README: "Add your Gemini key").');
  process.exit(1);
}
const provider =
  providerName === 'gemini'
    ? geminiProvider({ key: geminiKey, model: setting('GEMINI_MODEL') })
    : fakeProvider();
const renderVideos =
  setting('LUMO_RENDER') !== '0' && existsSync(path.join(videoRoot, 'node_modules'));

const status = execSync('npx supabase status -o env', {
  cwd: appRoot,
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
  console.error('The worker only runs against the local stack.');
  process.exit(1);
}
const db = createClient(url, serviceKey, { auth: { persistSession: false } });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const short = (id) => id.slice(0, 8);
const VOICES = { byte: 'am_puck', nova: 'af_bella', mystery: 'am_adam' };

// ---------------------------------------------------------------------------------------------------------------
// Job helpers
// ---------------------------------------------------------------------------------------------------------------
async function setJob(id, fields) {
  const { error } = await db.from('generation_jobs').update(fields).eq('id', id);
  if (error) throw error;
}

async function stillWanted(id) {
  const { data } = await db.from('generation_jobs').select('status').eq('id', id).single();
  return data?.status === 'running';
}

/** Next midnight in Pacific time, when Gemini's free daily quota resets. */
function nextQuotaReset(now = new Date()) {
  const pt = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const offset = now.getTime() - pt.getTime();
  const midnight = new Date(pt);
  midnight.setHours(24, 5, 0, 0); // 00:05 to be safe
  return new Date(midnight.getTime() + offset);
}

class Cancelled extends Error {}

// ---------------------------------------------------------------------------------------------------------------
// 1–2. Write and check
// ---------------------------------------------------------------------------------------------------------------
async function writeDraft(job, course) {
  const { data: units } = await db
    .from('units')
    .select('title')
    .eq('course_id', course.id)
    .order('position');
  const prompt = draftPrompt({
    course,
    topic: job.input?.topic || `the next step after what ${course.title} already covers`,
    notes: job.input?.notes || '',
    existingUnits: (units ?? []).map((u) => u.title),
  });
  const codeTopic = course.topic === 'code';
  let feedback = '';
  for (let attempt = 1; attempt <= 2; attempt++) {
    const { json, model } = await callWithRateLimitRetry(() =>
      provider.generate(
        feedback
          ? `${prompt}\n\nYour previous answer had problems: ${feedback}. Fix them.`
          : prompt,
        DRAFT_SCHEMA,
      ),
    );
    const { draft, problems } = checkDraft(json, { codeTopic });
    if (problems.length === 0) return { draft, model, requests: attempt };
    feedback = problems.join('; ');
    console.log(`job ${short(job.id)}: draft ${attempt} unusable (${feedback})`);
  }
  throw new Error(`The AI's draft wasn't usable twice in a row (${feedback}).`);
}

/** A short per-minute limit is worth waiting out; the daily limit is not (the caller parks the job). */
async function callWithRateLimitRetry(fn) {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof QuotaError && !error.daily && i < 3) {
        const wait = Math.min(120, error.retryAfterSeconds ?? 30);
        console.log(`  rate limited, waiting ${wait}s`);
        await sleep(wait * 1000);
        continue;
      }
      throw error;
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------
// 4. Save the hidden draft
// ---------------------------------------------------------------------------------------------------------------
async function saveDraft(course, draft, questions) {
  const { data: unit, error: unitError } = await db
    .from('units')
    .insert({
      course_id: course.id,
      title: draft.unit_title,
      summary: draft.unit_summary,
      published: false,
      ai_drafted: true,
    })
    .select('id')
    .single();
  if (unitError) throw unitError;

  const transcript = draft.video.scenes.flatMap((s) => s.lines.map((l) => l.say)).join(' ');
  const words = transcript.split(/\s+/).length;
  const { data: video, error: videoError } = await db
    .from('lessons')
    .insert({
      unit_id: unit.id,
      kind: 'video',
      title: draft.video.title,
      summary: draft.video.summary,
      transcript,
      duration_seconds: Math.min(1800, Math.max(10, Math.round(words / 2.4))),
      xp: 10,
    })
    .select('id')
    .single();
  if (videoError) throw videoError;

  const { data: quiz, error: quizError } = await db
    .from('lessons')
    .insert({
      unit_id: unit.id,
      kind: 'quiz',
      title: 'Quick check',
      summary: `Questions on ${draft.unit_title}.`,
      xp: 15,
    })
    .select('id')
    .single();
  if (quizError) throw quizError;

  for (const q of questions) {
    const { data: row, error } = await db
      .from('questions')
      .insert({
        lesson_id: quiz.id,
        prompt: q.prompt,
        code: q.code,
        options: q.options,
        concept: q.concept,
      })
      .select('id')
      .single();
    if (error) throw error;
    const { error: keyError } = await db.from('answer_keys').insert({
      question_id: row.id,
      correct_index: q.correct_index,
      explanation: q.explanation,
      mistakes: q.mistakes,
      verified: false, // a person must check it before the unit can be published
    });
    if (keyError) throw keyError;
  }
  await db.from('courses').update({ ai_generated: true }).eq('id', course.id);
  return { unitId: unit.id, videoLessonId: video.id };
}

// ---------------------------------------------------------------------------------------------------------------
// 5. Render (the video package's make script, as a child process so its memory is freed afterwards)
// ---------------------------------------------------------------------------------------------------------------
function renderVideo(scriptPath, lessonId, onProgress) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        '--experimental-websocket',
        '--no-warnings',
        'scripts/make-video.mjs',
        scriptPath,
        '--attach',
        lessonId,
      ],
      { cwd: videoRoot, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    let tail = '';
    child.stdout.on('data', (chunk) => {
      const text = String(chunk);
      tail = (tail + text).slice(-2000);
      if (/Loading the voice model/.test(text)) onProgress(null, 'Recording the narration');
      if (/Bundling/.test(text)) onProgress(null, 'Preparing the animation');
      const pcts = [...text.matchAll(/(\d+)% /g)].map((m) => Number(m[1]));
      if (pcts.length) onProgress(pcts.at(-1), 'Rendering the video');
    });
    child.stderr.on('data', (chunk) => {
      tail = (tail + String(chunk)).slice(-2000);
    });
    child.on('close', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(tail.split('\n').filter(Boolean).at(-1) ?? 'render failed')),
    );
  });
}

// ---------------------------------------------------------------------------------------------------------------
// The pipeline
// ---------------------------------------------------------------------------------------------------------------
async function runJob(job) {
  const { data: claimed } = await db
    .from('generation_jobs')
    .update({
      status: 'running',
      progress: 3,
      message: 'Reading the course',
      attempts: job.attempts + 1,
      error: null,
    })
    .eq('id', job.id)
    .in('status', ['queued', 'waiting_quota'])
    .select('id');
  if (!claimed?.length) return;
  console.log(
    `job ${short(job.id)}: started with ${provider.name} (topic: ${job.input?.topic ?? 'next step'})`,
  );

  const check = async () => {
    if (!(await stillWanted(job.id))) throw new Cancelled();
  };
  const result = { provider: provider.name };
  try {
    const { data: course, error } = await db
      .from('courses')
      .select('id, title, island_name, topic, level, summary, guardian')
      .eq('id', job.course_id)
      .single();
    if (error) throw error;

    await setJob(job.id, { progress: 10, message: 'Wisp is writing the unit' });
    const { draft, model, requests } = await writeDraft(job, course);
    result.model = model;
    await setJob(job.id, { requests_used: job.requests_used + requests });
    await check();

    await setJob(job.id, {
      progress: 40,
      message: 'Running the code examples to check the answers',
    });
    const { kept, dropped } = await verifyQuestions(draft.questions);
    result.questions_kept = kept.length;
    result.questions_dropped = dropped;
    result.answers_corrected = kept.filter((q) => q.corrected).length;
    if (kept.length < 2) throw new Error(`Only ${kept.length} question survived the code check.`);
    await check();

    await setJob(job.id, { progress: 50, message: 'Saving the draft' });
    const { unitId, videoLessonId } = await saveDraft(course, draft, kept);
    result.unit_id = unitId;
    result.unit_title = draft.unit_title;

    if (renderVideos && (await stillWanted(job.id))) {
      const scriptDir = path.join(videoRoot, 'scripts', 'lessons', 'generated');
      mkdirSync(scriptDir, { recursive: true });
      const scriptPath = path.join(scriptDir, `${videoLessonId}.json`);
      const script = toVideoScript(draft, {
        id: `l-${short(videoLessonId)}`,
        course,
        voice: VOICES[course.guardian] ?? 'am_puck',
      });
      writeFileSync(scriptPath, JSON.stringify(script, null, 2));
      let last = 0;
      const onProgress = (pct, message) => {
        const progress = pct === null ? last : Math.round(55 + pct * 0.4);
        if (pct !== null) last = progress;
        void setJob(job.id, { progress, message: pct === null ? message : `${message} ${pct}%` });
      };
      try {
        await setJob(job.id, { progress: 55, message: 'Recording the narration' });
        await renderVideo(scriptPath, videoLessonId, onProgress).catch(async (first) => {
          console.log(`job ${short(job.id)}: render failed once (${first.message}), retrying`);
          await setJob(job.id, { message: 'Rendering again' });
          return renderVideo(scriptPath, videoLessonId, onProgress);
        });
        result.video = 'rendered';
      } catch (renderError) {
        result.video = 'failed';
        result.video_error = renderError.message;
      }
    } else {
      result.video = renderVideos ? 'skipped (cancelled)' : 'skipped (video package not installed)';
    }

    const message =
      result.video === 'rendered'
        ? 'Draft ready to review'
        : result.video === 'failed'
          ? 'Draft ready (the video failed; the lesson shows its transcript)'
          : 'Draft ready to review (no video)';
    await setJob(job.id, { status: 'succeeded', progress: 100, message, result });
    console.log(
      `job ${short(job.id)}: done (${kept.length} questions, ${dropped.length} dropped, video ${result.video})`,
    );
  } catch (error) {
    if (error instanceof Cancelled) {
      console.log(`job ${short(job.id)}: cancelled`);
      return;
    }
    if (error instanceof QuotaError) {
      const runAfter = error.daily ? nextQuotaReset() : new Date(Date.now() + 10 * 60 * 1000);
      await setJob(job.id, {
        status: 'waiting_quota',
        run_after: runAfter.toISOString(),
        message: error.daily
          ? "Out of today's free AI quota: resumes after it resets"
          : 'The AI is busy: trying again in 10 minutes',
      });
      console.log(`job ${short(job.id)}: waiting for quota until ${runAfter.toISOString()}`);
      return;
    }
    await setJob(job.id, {
      status: 'failed',
      message: 'Failed',
      error: error.message ?? String(error),
      result,
    });
    console.error(`job ${short(job.id)}: failed: ${error.message}`);
  }
}

console.log(
  `Lumo worker: AI = ${provider.name === 'gemini' ? 'Gemini (free tier)' : 'fake (no AI; add GEMINI_API_KEY to use Gemini)'}, videos = ${renderVideos ? 'on' : 'off'}. Watching ${url} (Ctrl+C to stop).`,
);
for (;;) {
  const now = new Date().toISOString();
  const { data: jobs, error } = await db
    .from('generation_jobs')
    .select('id, course_id, kind, attempts, requests_used, input, status, run_after')
    .or(`status.eq.queued,and(status.eq.waiting_quota,run_after.lte."${now}")`)
    .order('created_at')
    .limit(3);
  if (error) console.error(`Could not read jobs: ${error.message}`);
  for (const job of jobs ?? []) await runJob(job);
  await sleep(2000);
}
