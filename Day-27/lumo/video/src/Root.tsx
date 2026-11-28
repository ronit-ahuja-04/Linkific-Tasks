import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '@fontsource-variable/nunito';
import '@fontsource-variable/jetbrains-mono';
import { Composition } from 'remotion';
import { Demo, type DemoTimeline } from './Demo';
import { Lesson } from './Lesson';
import type { Timeline } from './types';

// A tiny placeholder so Remotion Studio opens before any narration has been generated.
const placeholder: Timeline = {
  id: 'placeholder',
  title: 'Run npm run make first',
  island: 'Code Reef',
  code: 'for (let i = 0; i < 3; i++) {\n  console.log(i)\n}',
  parts: {},
  fps: 30,
  durationInFrames: 90,
  scenes: [{ visual: 'title', from: 0, durationInFrames: 90, cues: [] }],
};

const demoPlaceholder: DemoTimeline = {
  id: 'placeholder',
  title: 'Run npm run demo first',
  fps: 30,
  durationInFrames: 90,
  segments: [
    {
      card: 'intro',
      shot: null,
      chapter: null,
      video: null,
      videoStart: 0,
      from: 0,
      durationInFrames: 90,
      cues: [],
    },
  ],
};

export function Root() {
  return (
    <>
      <Composition
        id="Lesson"
        component={Lesson}
        width={1280}
        height={720}
        fps={30}
        durationInFrames={90}
        defaultProps={{ timeline: placeholder }}
        calculateMetadata={({ props }) => ({
          durationInFrames: props.timeline.durationInFrames,
          fps: props.timeline.fps,
        })}
      />
      <Composition
        id="Demo"
        component={Demo}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={90}
        defaultProps={{ timeline: demoPlaceholder }}
        calculateMetadata={({ props }) => ({
          durationInFrames: props.timeline.durationInFrames,
          fps: props.timeline.fps,
        })}
      />
    </>
  );
}
