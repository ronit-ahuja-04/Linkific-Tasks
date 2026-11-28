// Put the starter lessons' videos on the hosted Lumo: npm run attach:cloud
//
// Uploads the rendered videos (out/<id>.mp4, captions and transcript) and links them to their lessons, signed in AS
// YOU: email and password are asked for here (the password is hidden and never stored), and Row Level Security
// decides what you may change, exactly as in the studio. No service key is involved.
//
// The project's URL and public key come from Vercel (`vercel env pull`), so nothing needs copying by hand.
// `--local` targets the local stack instead (reads ../.env), for testing.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { FPS, attachToLesson, root } from './lib.mjs';

/** Which rendered video belongs to which starter lesson (titles from supabase/seed.sql). */
const LESSONS = [
  { title: 'Boxes with names', video: 'variables' },
  { title: 'For-loops in 90 seconds', video: 'for-loops' },
  { title: 'Reading a chart in 90 seconds', video: 'charts' },
  { title: 'Contrast first in 90 seconds', video: 'colour' },
  { title: 'Where money goes in 90 seconds', video: 'money' },
];

const local = process.argv.includes('--local');
const app = path.resolve(root, '..');
const parseEnv = (text) =>
  Object.fromEntries(
    text
      .split('\n')
      .map((l) => l.match(/^([A-Z_]+)=["']?(.*?)["']?$/))
      .filter(Boolean)
      .map((m) => [m[1], m[2]]),
  );

function projectEnv() {
  if (local) return parseEnv(readFileSync(path.join(app, '.env'), 'utf8'));
  const dir = mkdtempSync(path.join(tmpdir(), 'lumo-env-'));
  try {
    const file = path.join(dir, '.env');
    execFileSync('vercel', ['env', 'pull', file, '--environment=production', '--yes'], {
      cwd: app,
      stdio: 'ignore',
    });
    return parseEnv(readFileSync(file, 'utf8'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Ask a question on the terminal; `hidden` keeps the answer off the screen (for the password). */
function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    if (hidden) {
      rl._writeToOutput = (text) => {
        if (text.includes(question)) process.stdout.write(question);
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      resolve(answer.trim());
    });
  });
}

const env = projectEnv();
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
if (!url || !key)
  throw new Error('Could not find the project URL and public key (vercel env pull).');
if (!local && !url.startsWith('https://'))
  throw new Error(`Refusing a non-https project URL: ${url}`);
console.log(`Project: ${new URL(url).host}`);

const missing = LESSONS.filter((l) => !existsSync(path.join(root, 'out', `${l.video}.mp4`)));
if (missing.length) {
  throw new Error(
    `Render these first: ${missing.map((l) => `npm run make -- scripts/lessons/${l.video}.json`).join('; ')}`,
  );
}

const email = process.env.LUMO_EMAIL ?? (await ask('Your Lumo email: '));
const password = process.env.LUMO_PASSWORD ?? (await ask('Your Lumo password (hidden): ', true));

const { createClient } = await import('@supabase/supabase-js');
const db = createClient(url, key, { auth: { persistSession: false } });
const { error: signInError } = await db.auth.signInWithPassword({ email, password });
if (signInError) throw new Error(`Sign-in failed: ${signInError.message}`);

let done = 0;
for (const { title, video } of LESSONS) {
  const { data: lessons, error } = await db
    .from('lessons')
    .select('id, title, video_path, captions_path, units(course_id)')
    .eq('title', title)
    .is('deleted_at', null);
  if (error) throw error;
  if (!lessons?.length) {
    console.log(`• ${title}: not found (has the starter content been loaded?)`);
    continue;
  }
  const timeline = JSON.parse(
    readFileSync(path.join(root, 'public', 'generated', video, 'timeline.json'), 'utf8'),
  );
  for (const lesson of lessons) {
    try {
      await attachToLesson(db, lesson, {
        mp4: path.join(root, 'out', `${video}.mp4`),
        vtt: path.join(root, 'out', `${video}.vtt`),
        transcript: readFileSync(path.join(root, 'out', `${video}.txt`), 'utf8').trim(),
        seconds: timeline.durationInFrames / FPS,
      });
      done += 1;
      console.log(`• ${title}: video, captions and transcript attached`);
    } catch (e) {
      // RLS refuses islands you don't own: say so and carry on.
      console.log(`• ${title}: skipped (${e.message ?? e})`);
    }
  }
}
await db.auth.signOut();
console.log(`${done} lesson${done === 1 ? '' : 's'} updated.`);
