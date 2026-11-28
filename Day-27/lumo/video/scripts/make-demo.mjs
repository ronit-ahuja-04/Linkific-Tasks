// Lumo's product demo, made by Lumo's own video pipeline: npm run demo [-- --skip-capture] [-- --preview]
//
//   1. Screenshots: scripts/demo/capture.mjs walks every role through the real local app (skip with --skip-capture
//      to reuse the last set).
//   2. Narration: every line of scripts/demo/demo.json is spoken by Kokoro on this machine (cached).
//   3. Timing: real audio lengths place each line, screenshot and caption on the timeline.
//   4. Video: Remotion renders src/Demo.tsx to out/lumo-demo.mp4 (1080p) with captions (.vtt) and a transcript.
//      --preview renders at half size, for a quick look.
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { FPS, bundleVideo, createVoice, renderTo, root, toVtt } from './lib.mjs';

const args = process.argv.slice(2);
const script = JSON.parse(readFileSync(path.join(root, 'scripts/demo/demo.json'), 'utf8'));
const demoDir = path.join(root, 'public', 'generated', 'demo');

if (!args.includes('--skip-capture')) {
  execFileSync(process.execPath, [path.join(root, 'scripts/demo/capture.mjs')], {
    stdio: 'inherit',
  });
}
const shots = JSON.parse(readFileSync(path.join(demoDir, 'shots.json'), 'utf8'));
// The lesson the visitor and the learner watch, played inside the app's own player.
const lessonVideo = path.join(root, 'out', 'for-loops.mp4');
if (!existsSync(lessonVideo))
  throw new Error('Render the lesson first: npm run make -- scripts/lessons/for-loops.json');
copyFileSync(lessonVideo, path.join(demoDir, 'lesson.mp4'));

const GAP_LINE = 9;
const GAP_SEGMENT = 12;
const voice = createVoice('demo-voice');
let t = 15;
const segments = [];
for (const [i, seg] of script.segments.entries()) {
  const from = i === 0 ? 0 : t;
  const cues = [];
  for (const text of seg.lines) {
    const { rel, seconds } = await voice.speak(text, script.voice);
    const durationInFrames = Math.ceil(seconds * FPS);
    cues.push({ text, audio: rel, from: t, durationInFrames });
    t += durationInFrames + GAP_LINE;
  }
  t += i === script.segments.length - 1 ? 75 : GAP_SEGMENT;
  const shot = seg.shot ? shots[seg.shot] : null;
  if (seg.shot && !shot) throw new Error(`No screenshot "${seg.shot}" in shots.json`);
  segments.push({
    card: seg.card ?? null,
    shot,
    chapter: seg.chapter ?? null,
    video: seg.video ?? null,
    videoStart: seg.videoStart ?? 0,
    from,
    durationInFrames: t - from,
    cues,
  });
}
voice.release();

const timeline = { id: script.id, title: script.title, fps: FPS, durationInFrames: t, segments };
console.log(`Timeline: ${(t / FPS).toFixed(1)} s, ${segments.length} segments`);

const outDir = path.join(root, 'out');
mkdirSync(outDir, { recursive: true });
const cues = segments.flatMap((s) => s.cues);
writeFileSync(path.join(outDir, `${script.id}.vtt`), toVtt(cues, GAP_LINE / 2));
writeFileSync(path.join(outDir, `${script.id}.txt`), `${cues.map((c) => c.text).join(' ')}\n`);
writeFileSync(path.join(demoDir, 'timeline.json'), JSON.stringify(timeline, null, 2));

const preview = args.includes('--preview');
const serveUrl = await bundleVideo();
const output = path.join(outDir, `${script.id}${preview ? '-preview' : ''}.mp4`);
await renderTo({
  serveUrl,
  id: 'Demo',
  inputProps: { timeline },
  output,
  crf: preview ? 28 : 20,
  scale: preview ? 0.5 : 1,
});
console.log(`Video: ${path.relative(root, output)} · captions: out/${script.id}.vtt`);
