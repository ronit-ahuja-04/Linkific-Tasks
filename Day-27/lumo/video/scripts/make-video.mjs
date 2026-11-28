// Turn a lesson script into a finished video: npm run make -- scripts/lessons/for-loops.json [--attach "<lesson>"]
//
//   1. Narration: every line is spoken by Kokoro, an open-source voice model that runs on this machine (free, no
//      account; the model downloads once, ~90 MB). Lines are cached, so re-rendering after a visual tweak is quick.
//   2. Timing: each line's real audio length places it on the timeline, so captions and visuals match the voice.
//   3. Video: Remotion renders the animation (src/Lesson.tsx) with the audio to out/<id>.mp4 (720p, H.264).
//   4. Captions and transcript: out/<id>.vtt and out/<id>.txt, from the same timings.
//   5. --attach "<lesson title or id>": uploads the video and captions to the LOCAL stack and links them to that
//      lesson. Uses the local service-role key from `supabase status` (kept in memory, never printed); refuses any
//      non-local URL. In M4 the generation worker does this step for drafted lessons.
import { execSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const scriptPath = args.find((a) => a.endsWith('.json'));
const attachAt = args.indexOf('--attach');
const attach = attachAt >= 0 ? args[attachAt + 1] : null;
if (!scriptPath) {
  console.error(
    'Usage: npm run make -- scripts/lessons/<lesson>.json [--attach "<lesson title or id>"]',
  );
  process.exit(1);
}

const script = JSON.parse(readFileSync(path.resolve(root, scriptPath), 'utf8'));
const FPS = 30;
const GAP_LINE = 8; // frames of breath between lines
const GAP_SCENE = 14;
const INTRO = 12;
const OUTRO = 36;

// ---------------------------------------------------------------------------------------------------------------
// 1–2. Narration and timing
// ---------------------------------------------------------------------------------------------------------------
const audioDir = path.join(root, 'public', 'generated', script.id);
mkdirSync(audioDir, { recursive: true });

let tts = null;
async function speak(text, voice) {
  const name = `${createHash('sha1').update(`${voice}|${text}`).digest('hex').slice(0, 12)}.wav`;
  const file = path.join(audioDir, name);
  if (!existsSync(file)) {
    if (!tts) {
      process.stdout.write('Loading the voice model… ');
      const { KokoroTTS } = await import('kokoro-js');
      tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
        dtype: 'q8',
        device: 'cpu',
      });
      console.log('ready');
    }
    const audio = await tts.generate(text, { voice });
    await audio.save(file);
  }
  return { rel: `generated/${script.id}/${name}`, seconds: wavSeconds(file) };
}

/** Length of a PCM WAV file from its header (sample rate, channels, bits) and data size. */
function wavSeconds(file) {
  const b = readFileSync(file);
  let offset = 12;
  let rate = 24000;
  let blockAlign = 4;
  while (offset < b.length - 8) {
    const id = b.toString('ascii', offset, offset + 4);
    const size = b.readUInt32LE(offset + 4);
    if (id === 'fmt ') {
      rate = b.readUInt32LE(offset + 12);
      blockAlign = b.readUInt16LE(offset + 20);
    }
    if (id === 'data') return size / blockAlign / rate;
    offset += 8 + size + (size % 2);
  }
  throw new Error(`No audio data in ${file}`);
}

console.log(
  `Script: ${script.title} (${script.scenes.reduce((n, s) => n + s.lines.length, 0)} lines)`,
);
let t = INTRO;
const scenes = [];
for (const [si, scene] of script.scenes.entries()) {
  const from = si === 0 ? 0 : t;
  const cues = [];
  for (const line of scene.lines) {
    const { rel, seconds } = await speak(line.say, script.voice);
    const durationInFrames = Math.ceil(seconds * FPS);
    cues.push({ text: line.say, audio: rel, from: t, durationInFrames, show: line.show ?? {} });
    t += durationInFrames + GAP_LINE;
  }
  t += si === script.scenes.length - 1 ? OUTRO : GAP_SCENE;
  scenes.push({ visual: scene.visual, from, durationInFrames: t - from, cues });
}
tts = null; // free the voice model's memory before rendering

const timeline = {
  id: script.id,
  title: script.title,
  island: script.island ?? 'Code Reef',
  code: script.code ?? '',
  parts: script.parts ?? {},
  fps: FPS,
  durationInFrames: t,
  scenes,
};
const seconds = t / FPS;
console.log(`Timeline: ${seconds.toFixed(1)} s`);

// ---------------------------------------------------------------------------------------------------------------
// 4. Captions and transcript
// ---------------------------------------------------------------------------------------------------------------
const outDir = path.join(root, 'out');
mkdirSync(outDir, { recursive: true });
const stamp = (frames) => {
  const ms = Math.round((frames / FPS) * 1000);
  const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
  const m = String(Math.floor(ms / 60000) % 60).padStart(2, '0');
  const s = String(Math.floor(ms / 1000) % 60).padStart(2, '0');
  return `${h}:${m}:${s}.${String(ms % 1000).padStart(3, '0')}`;
};
const cues = scenes.flatMap((s) => s.cues);
const vtt = [
  'WEBVTT',
  '',
  ...cues.flatMap((c, n) => [
    String(n + 1),
    `${stamp(c.from)} --> ${stamp(c.from + c.durationInFrames + GAP_LINE / 2)}`,
    c.text,
    '',
  ]),
].join('\n');
const transcript = cues.map((c) => c.text).join(' ');
writeFileSync(path.join(outDir, `${script.id}.vtt`), vtt);
writeFileSync(path.join(outDir, `${script.id}.txt`), `${transcript}\n`);
writeFileSync(path.join(audioDir, 'timeline.json'), JSON.stringify(timeline, null, 2));

// ---------------------------------------------------------------------------------------------------------------
// 3. Render
// ---------------------------------------------------------------------------------------------------------------
const { bundle } = await import('@remotion/bundler');
const { renderMedia, selectComposition } = await import('@remotion/renderer');
const videoNodeModules = path.join(root, 'node_modules');
process.stdout.write('Bundling… ');
const serveUrl = await bundle({
  entryPoint: path.join(root, 'src', 'index.ts'),
  publicDir: path.join(root, 'public'),
  // Byte is imported from the app (../src); make sure both use this package's single copy of React.
  webpackOverride: (config) => ({
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias ?? {}),
        react: path.join(videoNodeModules, 'react'),
        'react-dom': path.join(videoNodeModules, 'react-dom'),
      },
    },
  }),
});
console.log('done');

const inputProps = { timeline };
const composition = await selectComposition({ serveUrl, id: 'Lesson', inputProps });
const output = path.join(outDir, `${script.id}.mp4`);
let last = -1;
await renderMedia({
  composition,
  serveUrl,
  codec: 'h264',
  crf: 24,
  audioBitrate: '96k',
  outputLocation: output,
  inputProps,
  // This Mac has 8 GB shared with Docker: two browser tabs at a time is the safe ceiling.
  concurrency: 2,
  onProgress: ({ progress }) => {
    const pct = Math.floor(progress * 100);
    if (pct % 10 === 0 && pct !== last) {
      last = pct;
      process.stdout.write(`${pct}% `);
    }
  },
});
console.log(`\nVideo: ${path.relative(root, output)} · captions: out/${script.id}.vtt`);

// ---------------------------------------------------------------------------------------------------------------
// 5. Attach to a lesson on the local stack
// ---------------------------------------------------------------------------------------------------------------
if (attach) {
  const status = execSync('npx supabase status -o env', {
    cwd: path.join(root, '..'),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  const read = (name) => status.match(new RegExp(`^${name}="?([^"\\n]+)"?$`, 'm'))?.[1];
  const url = read('API_URL');
  const key = read('SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Could not read the local Supabase stack. Is it running?');
  if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(url)) {
    throw new Error('--attach only works with the local stack.');
  }
  const { createClient } = await import('@supabase/supabase-js');
  const db = createClient(url, key, { auth: { persistSession: false } });

  const isId = /^[0-9a-f-]{36}$/.test(attach);
  const { data: lessons, error } = await db
    .from('lessons')
    .select('id, title, video_path, captions_path, units(course_id)')
    .eq(isId ? 'id' : 'title', attach);
  if (error) throw error;
  if (!lessons?.length) throw new Error(`No lesson found for "${attach}".`);
  if (lessons.length > 1)
    throw new Error(`"${attach}" matches ${lessons.length} lessons; pass its id.`);
  const lesson = lessons[0];
  const base = `${lesson.units.course_id}/lessons/${lesson.id}/${randomUUID()}`;
  const bucket = db.storage.from('course-media');

  const up = async (file, dest, contentType) => {
    const { error: e } = await bucket.upload(dest, readFileSync(file), {
      contentType,
      upsert: false,
    });
    if (e) throw e;
  };
  await up(output, `${base}.mp4`, 'video/mp4');
  await up(path.join(outDir, `${script.id}.vtt`), `${base}.vtt`, 'text/vtt');
  const { error: updateError } = await db
    .from('lessons')
    .update({
      video_path: `${base}.mp4`,
      captions_path: `${base}.vtt`,
      transcript,
      duration_seconds: Math.min(1800, Math.max(10, Math.round(seconds))),
    })
    .eq('id', lesson.id);
  if (updateError) throw updateError;
  const old = [lesson.video_path, lesson.captions_path].filter(Boolean);
  if (old.length) await bucket.remove(old);
  console.log(`Attached to "${lesson.title}" (${lesson.id}).`);
}
