import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
// The same characters the app draws, so the video and the app look like one world.
import { Guardian } from '../../src/components/characters/Guardians';
import type { Cue, SceneSpan, Show, Timeline } from './types';

// Lumo's design tokens (src/styles/index.css).
const C = {
  night: '#1b1640',
  night2: '#241d55',
  night3: '#2e2766',
  line: '#3a3274',
  moon: '#c9c3ee',
  glow: '#ffb938',
  violet: '#5b3de0',
  lagoon: '#0b7a68',
  lagoonSoft: '#ddf7f1',
  ember: '#c8303f',
  white: '#ffffff',
};
const DISPLAY = "'Fredoka', 'Nunito Variable', sans-serif";
const SANS = "'Nunito Variable', sans-serif";
const MONO = "'JetBrains Mono Variable', monospace";

/** Hold the render until the fonts are in, so no frame is drawn in a fallback font. */
function useFonts() {
  const [handle] = useState(() => delayRender('Loading fonts'));
  useEffect(() => {
    Promise.all([
      document.fonts.load('700 64px Fredoka'),
      document.fonts.load('600 32px Fredoka'),
      document.fonts.load('800 28px "Nunito Variable"'),
      document.fonts.load('500 34px "JetBrains Mono Variable"'),
    ]).then(
      () => continueRender(handle),
      () => continueRender(handle),
    );
  }, [handle]);
}

/** The line being spoken now; between lines the last one stays on screen. */
function currentCue(scene: SceneSpan, frame: number): Cue | undefined {
  let found: Cue | undefined;
  for (const cue of scene.cues) if (cue.from <= frame) found = cue;
  return found;
}

/** Frames since `start`, for animations that begin when something first appears. */
function since(frame: number, start: number) {
  return Math.max(0, frame - start);
}

function Sky() {
  const frame = useCurrentFrame();
  const stars = Array.from({ length: 60 }, (_, i) => ({
    x: random(`x${i}`) * 1280,
    y: random(`y${i}`) * 460,
    r: 1 + random(`r${i}`) * 2.2,
    phase: random(`p${i}`) * Math.PI * 2,
  }));
  return (
    <AbsoluteFill
      style={{ background: `radial-gradient(ellipse at 70% 0%, ${C.night3} 0%, ${C.night} 60%)` }}
    >
      <svg width={1280} height={720} style={{ position: 'absolute' }}>
        {stars.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill={C.moon}
            opacity={0.35 + 0.35 * Math.sin(frame / 25 + s.phase)}
          />
        ))}
        {/* The reef: two slow waves along the bottom. */}
        <path
          d={`M0 640 Q 160 ${615 + 8 * Math.sin(frame / 30)} 320 640 T 640 640 T 960 640 T 1280 640 V720 H0 Z`}
          fill={C.night2}
        />
        <path
          d={`M0 670 Q 160 ${650 + 6 * Math.cos(frame / 24)} 320 670 T 640 670 T 960 670 T 1280 670 V720 H0 Z`}
          fill={C.line}
          opacity={0.6}
        />
      </svg>
    </AbsoluteFill>
  );
}

// `frame` is always the absolute frame (scenes are <Sequence>s, where useCurrentFrame() restarts at 0).
function Bubble({ text, start, frame }: { text: string; start: number; frame: number }) {
  const { fps } = useVideoConfig();
  const pop = spring({ frame: since(frame, start), fps, config: { damping: 10, stiffness: 160 } });
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '92%',
        left: '58%',
        transform: `scale(${pop})`,
        transformOrigin: 'bottom left',
        background: C.white,
        color: C.night,
        fontFamily: DISPLAY,
        fontWeight: 700,
        fontSize: 40,
        padding: '14px 26px',
        borderRadius: 28,
        whiteSpace: 'nowrap',
        boxShadow: `0 6px 0 ${C.moon}`,
      }}
    >
      {text}
    </div>
  );
}

function GuardianHost({
  cue,
  frame,
  talking,
  big,
  guardian,
}: {
  cue: Cue | undefined;
  frame: number;
  talking: boolean;
  big: boolean;
  guardian: 'byte' | 'nova' | 'mystery';
}) {
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 12 } });
  const bob = Math.sin(frame / 12) * 6;
  // While the guardian speaks, a quick bounce stands in for lip sync.
  const talk = talking ? Math.abs(Math.sin(frame / 3)) * 0.06 : 0;
  const size = big ? 320 : 240;
  return (
    <div
      style={{
        position: 'absolute',
        left: big ? 110 : 70,
        top: (big ? 250 : 360) + bob,
        transform: `scale(${enter * (1 + talk)}) rotate(${Math.sin(frame / 20) * 3}deg)`,
        transformOrigin: 'bottom center',
      }}
    >
      {cue?.show.bubble && <Bubble text={cue.show.bubble} start={cue.from} frame={frame} />}
      <Guardian guardian={guardian} size={size} decorative />
    </div>
  );
}

function CodePanel({
  timeline,
  show,
  frame,
  style,
}: {
  timeline: Timeline;
  show: Show;
  frame: number;
  style?: CSSProperties;
}) {
  const { code, parts } = timeline;
  const part = show.highlight ? parts[show.highlight] : undefined;
  const at = part ? code.indexOf(part) : -1;
  const pulse = 0.75 + 0.25 * Math.sin(frame / 6);
  const failing = show.fail && show.highlight === 'check';
  const colour = failing ? C.ember : C.glow;
  const segments: ReactNode[] =
    at >= 0 && part
      ? [
          code.slice(0, at),
          <span
            key="hl"
            style={{
              background: colour,
              color: failing ? C.white : C.night,
              borderRadius: 10,
              padding: '2px 6px',
              boxShadow: `0 0 ${24 * pulse}px ${colour}`,
            }}
          >
            {part}
          </span>,
          code.slice(at + part.length),
        ]
      : [code];
  return (
    <div
      style={{
        position: 'absolute',
        background: C.night2,
        border: `3px solid ${C.line}`,
        borderRadius: 28,
        padding: '30px 36px',
        fontFamily: MONO,
        fontSize: 34,
        lineHeight: 1.6,
        color: C.moon,
        whiteSpace: 'pre',
        opacity: show.done ? 0.55 : 1,
        ...style,
      }}
    >
      {segments}
    </div>
  );
}

function Chip({
  children,
  colour,
  start,
  frame,
  delay = 0,
}: {
  children: ReactNode;
  colour: string;
  start: number;
  frame: number;
  delay?: number;
}) {
  const { fps } = useVideoConfig();
  const s = spring({ frame: since(frame, start + delay), fps, config: { damping: 11 } });
  return (
    <span
      style={{
        display: 'inline-block',
        transform: `scale(${s})`,
        background: colour,
        color: colour === C.glow ? C.night : C.white,
        fontFamily: DISPLAY,
        fontWeight: 700,
        fontSize: 34,
        padding: '10px 24px',
        borderRadius: 999,
      }}
    >
      {children}
    </span>
  );
}

function TitleScene({ timeline, frame }: { timeline: Timeline; frame: number }) {
  const { fps } = useVideoConfig();
  const t = spring({ frame: since(frame, 6), fps, config: { damping: 14 } });
  return (
    <div style={{ position: 'absolute', left: 520, top: 210, width: 700 }}>
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 30, color: C.glow, opacity: t }}>
        {timeline.island}
      </div>
      <div
        style={{
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: 92,
          lineHeight: 1.05,
          color: C.white,
          transform: `translateY(${(1 - t) * 40}px)`,
          opacity: t,
        }}
      >
        {timeline.title}
      </div>
    </div>
  );
}

/** Finds when a value first appeared in this scene, so its pop animation starts there. */
function firstFrame(scene: SceneSpan, test: (show: Show) => boolean, fallback: number) {
  return scene.cues.find((c) => test(c.show))?.from ?? fallback;
}

function TraceScene({
  timeline,
  scene,
  cue,
  frame,
}: {
  timeline: Timeline;
  scene: SceneSpan;
  cue: Cue | undefined;
  frame: number;
}) {
  const { fps } = useVideoConfig();
  const show = cue?.show ?? {};
  const iStart = firstFrame(scene, (s) => s.i === show.i, cue?.from ?? 0);
  const iPop = spring({ frame: since(frame, iStart), fps, config: { damping: 9, stiffness: 180 } });
  const doneStart = firstFrame(scene, (s) => Boolean(s.done), frame);
  return (
    <>
      <CodePanel timeline={timeline} show={show} frame={frame} style={{ left: 430, top: 70 }} />
      {show.i !== undefined && (
        <div
          style={{
            position: 'absolute',
            left: 430,
            top: 330,
            display: 'flex',
            gap: 28,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              background: C.violet,
              color: C.white,
              borderRadius: 22,
              padding: '14px 28px',
              fontFamily: MONO,
              fontSize: 44,
              transform: `scale(${0.8 + 0.2 * iPop})`,
            }}
          >
            <span style={{ opacity: 0.8 }}>i =</span>
            <b>{show.i}</b>
          </div>
          {show.fail && (
            <span style={{ fontFamily: MONO, fontSize: 36, color: C.white }}>
              {show.i} &lt; 3 → <b style={{ color: '#ff8a96' }}>false</b>
            </span>
          )}
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          left: 430,
          top: 470,
          width: 560,
          background: '#0f0b2a',
          borderRadius: 22,
          padding: '18px 28px',
          fontFamily: MONO,
          fontSize: 32,
          color: C.lagoonSoft,
          minHeight: 72,
        }}
      >
        <div
          style={{
            fontFamily: SANS,
            fontSize: 18,
            fontWeight: 800,
            color: C.moon,
            marginBottom: 6,
          }}
        >
          Console
        </div>
        {(show.out ?? []).map((line, n) => (
          <span key={n} style={{ marginRight: 28 }}>
            {line}
          </span>
        ))}
      </div>
      {show.done && (
        <div style={{ position: 'absolute', left: 1020, top: 480, transform: 'rotate(-8deg)' }}>
          <Chip colour={C.ember} start={doneStart} frame={frame}>
            Loop ends
          </Chip>
        </div>
      )}
    </>
  );
}

/** The frame each revealed point first appeared, so every point pops in once, when it's said. */
function pointStarts(scene: SceneSpan): number[] {
  const starts: number[] = [];
  for (const cue of scene.cues) {
    const n = cue.show.points?.length ?? 0;
    while (starts.length < n) starts.push(cue.from);
  }
  return starts;
}

function PointsScene({
  scene,
  cue,
  frame,
}: {
  scene: SceneSpan;
  cue: Cue | undefined;
  frame: number;
}) {
  const { fps } = useVideoConfig();
  const points = cue?.show.points ?? [];
  const starts = pointStarts(scene);
  return (
    <div
      style={{
        position: 'absolute',
        left: 440,
        top: 120,
        width: 760,
        display: 'flex',
        flexDirection: 'column',
        gap: 26,
      }}
    >
      <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 60, color: C.white }}>
        {scene.heading || 'Key ideas'}
      </div>
      {points.map((p, i) => {
        const s = spring({ frame: since(frame, starts[i] ?? 0), fps, config: { damping: 13 } });
        const latest = i === points.length - 1;
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              transform: `translateX(${(1 - s) * 60}px)`,
              opacity: s,
            }}
          >
            <span
              style={{
                width: 52,
                height: 52,
                borderRadius: 999,
                background: latest ? C.glow : C.violet,
                color: latest ? C.night : C.white,
                fontFamily: DISPLAY,
                fontWeight: 700,
                fontSize: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {i + 1}
            </span>
            <span
              style={{
                fontFamily: SANS,
                fontWeight: 800,
                fontSize: 40,
                color: latest ? C.white : C.moon,
              }}
            >
              {p}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function RecapScene({
  scene,
  cue,
  frame,
}: {
  scene: SceneSpan;
  cue: Cue | undefined;
  frame: number;
}) {
  const show = cue?.show ?? {};
  const starts = pointStarts(scene);
  return (
    <div
      style={{
        position: 'absolute',
        left: 600,
        top: 270,
        display: 'flex',
        flexDirection: 'column',
        gap: 30,
        maxWidth: 640,
      }}
    >
      <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 64, color: C.white }}>
        Remember
      </div>
      {show.steps ? (
        <div style={{ display: 'flex', gap: 18 }}>
          <Chip colour={C.glow} start={cue?.from ?? 0} frame={frame}>
            Start
          </Chip>
          <Chip colour={C.violet} start={cue?.from ?? 0} frame={frame} delay={8}>
            Check
          </Chip>
          <Chip colour={C.lagoon} start={cue?.from ?? 0} frame={frame} delay={16}>
            Step
          </Chip>
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {(show.points ?? []).map((p, i) => (
            <Chip
              key={i}
              colour={[C.glow, C.violet, C.lagoon][i % 3]!}
              start={starts[i] ?? 0}
              frame={frame}
            >
              {p}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}

function SceneView({ scene, timeline }: { scene: SceneSpan; timeline: Timeline }) {
  // Inside a <Sequence>, frames count from the scene's start; cue times are absolute, so add the offset.
  const local = useCurrentFrame();
  const frame = local + scene.from;
  const cue = currentCue(scene, frame);
  const show = cue?.show ?? {};
  const talking = Boolean(cue && frame < cue.from + cue.durationInFrames);
  const fade = interpolate(
    local,
    [0, 8, scene.durationInFrames - 6, scene.durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const big = scene.visual === 'title' || scene.visual === 'recap';
  // The recap's Start / Check / Step chips stay once shown (and don't re-pop on the next line).
  const stepsCue =
    scene.visual === 'recap' ? scene.cues.find((c) => c.show.steps && c.from <= frame) : undefined;
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      {scene.visual === 'title' && <TitleScene timeline={timeline} frame={local} />}
      {scene.visual === 'code' && (
        <>
          <CodePanel
            timeline={timeline}
            show={show}
            frame={frame}
            style={{ left: 430, top: 200 }}
          />
          {show.label && cue && (
            <div style={{ position: 'absolute', left: 430, top: 120 }}>
              <Chip colour={C.glow} start={cue.from} frame={frame}>
                {show.label}
              </Chip>
            </div>
          )}
        </>
      )}
      {scene.visual === 'trace' && (
        <TraceScene timeline={timeline} scene={scene} cue={cue} frame={frame} />
      )}
      {scene.visual === 'points' && <PointsScene scene={scene} cue={cue} frame={frame} />}
      {scene.visual === 'recap' && <RecapScene scene={scene} cue={stepsCue ?? cue} frame={frame} />}
      <GuardianHost
        cue={cue}
        frame={frame}
        talking={talking}
        big={big}
        guardian={timeline.guardian ?? 'byte'}
      />
    </AbsoluteFill>
  );
}

export function Lesson({ timeline }: { timeline: Timeline }) {
  useFonts();
  const frame = useCurrentFrame();
  const progress = frame / Math.max(1, timeline.durationInFrames - 1);
  return (
    <AbsoluteFill style={{ backgroundColor: C.night }}>
      <Sky />
      {timeline.scenes.map((scene, i) => (
        <Sequence key={i} from={scene.from} durationInFrames={scene.durationInFrames}>
          <SceneView scene={scene} timeline={timeline} />
        </Sequence>
      ))}
      {timeline.scenes.flatMap((scene) =>
        scene.cues.map((cue) => (
          <Sequence key={cue.audio} from={cue.from} durationInFrames={cue.durationInFrames}>
            <Audio src={staticFile(cue.audio)} />
          </Sequence>
        )),
      )}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: 8,
          width: `${progress * 100}%`,
          background: C.glow,
        }}
      />
    </AbsoluteFill>
  );
}
