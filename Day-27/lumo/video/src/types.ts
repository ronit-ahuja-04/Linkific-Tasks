/** What the screen shows while one line is spoken. Every field is optional; the lesson script sets what it needs. */
export interface Show {
  /** Short text in Byte's speech bubble. */
  bubble?: string;
  /** Which named part of the code to light up (a key of `parts`). */
  highlight?: string;
  /** A label chip above the code ("Start"). */
  label?: string;
  /** The loop variable's current value. */
  i?: number;
  /** Console output so far. */
  out?: string[];
  /** The check just failed (shown in red). */
  fail?: boolean;
  /** The loop has finished. */
  done?: boolean;
  /** Show the Start / Check / Step recap chips. */
  steps?: boolean;
}

export type Visual = 'title' | 'code' | 'trace' | 'recap';

/** One spoken line, placed on the timeline by scripts/make-video.mjs after its audio is generated. */
export interface Cue {
  text: string;
  /** Path under public/ (for staticFile). */
  audio: string;
  from: number;
  durationInFrames: number;
  show: Show;
}

export interface SceneSpan {
  visual: Visual;
  from: number;
  durationInFrames: number;
  cues: Cue[];
}

export interface Timeline {
  id: string;
  title: string;
  island: string;
  code: string;
  parts: Record<string, string>;
  fps: number;
  durationInFrames: number;
  scenes: SceneSpan[];
}
