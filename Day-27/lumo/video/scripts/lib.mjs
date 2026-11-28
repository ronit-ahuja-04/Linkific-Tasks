// Shared by the lesson videos (make-video.mjs) and the product demo (make-demo.mjs).
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const FPS = 30;

/**
 * Speak lines with Kokoro, an open-source voice model that runs on this machine (free, no account; the model
 * downloads once, ~90 MB). Each line is cached under public/generated/<folder>, so re-renders are quick.
 */
export function createVoice(folder) {
  const audioDir = path.join(root, 'public', 'generated', folder);
  mkdirSync(audioDir, { recursive: true });
  let tts = null;
  return {
    audioDir,
    async speak(text, voice) {
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
      return { rel: `generated/${folder}/${name}`, seconds: wavSeconds(file) };
    },
    /** Free the voice model's memory before rendering. */
    release() {
      tts = null;
    },
  };
}

/** Length of a PCM WAV file from its header (sample rate, channels, bits) and data size. */
export function wavSeconds(file) {
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

/** WebVTT text from cues placed in frames. */
export function toVtt(cues, tail = 4) {
  const stamp = (frames) => {
    const ms = Math.round((frames / FPS) * 1000);
    const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
    const m = String(Math.floor(ms / 60000) % 60).padStart(2, '0');
    const s = String(Math.floor(ms / 1000) % 60).padStart(2, '0');
    return `${h}:${m}:${s}.${String(ms % 1000).padStart(3, '0')}`;
  };
  return [
    'WEBVTT',
    '',
    ...cues.flatMap((c, n) => [
      String(n + 1),
      `${stamp(c.from)} --> ${stamp(c.from + c.durationInFrames + tail)}`,
      c.text,
      '',
    ]),
  ].join('\n');
}

/** Bundle the Remotion project. The characters are imported from the app (../src), so pin one copy of React. */
export async function bundleVideo() {
  const { bundle } = await import('@remotion/bundler');
  const videoNodeModules = path.join(root, 'node_modules');
  process.stdout.write('Bundling… ');
  const serveUrl = await bundle({
    entryPoint: path.join(root, 'src', 'index.ts'),
    publicDir: path.join(root, 'public'),
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
  return serveUrl;
}

/** Render a composition to an H.264 MP4, printing progress every 10%. */
export async function renderTo({ serveUrl, id, inputProps, output, crf = 24, scale = 1 }) {
  const { renderMedia, selectComposition } = await import('@remotion/renderer');
  const composition = await selectComposition({ serveUrl, id, inputProps });
  let last = -1;
  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    crf,
    scale,
    audioBitrate: '128k',
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
  console.log('');
}
