// Lumo's product demo: screenshots of the real app (scripts/demo/capture.mjs) in a browser window that zooms to
// what the narration is talking about, with title cards, chapter labels and burned-in captions.
import { useEffect, useState, type ReactNode } from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  OffthreadVideo,
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
import { Byte, Gloom, Nova, Wisp } from '../../src/components/characters';

export interface DemoCue {
  text: string;
  audio: string;
  from: number;
  durationInFrames: number;
}
export interface DemoShot {
  file: string;
  path: string;
  /** The element the narration is about, in the app's 1280×720 CSS pixels. */
  box: { x: number; y: number; w: number; h: number } | null;
}
export interface DemoSegment {
  card: 'intro' | 'fog' | 'tech' | 'outro' | null;
  shot: DemoShot | null;
  chapter: string | null;
  video: string | null;
  videoStart: number;
  from: number;
  durationInFrames: number;
  cues: DemoCue[];
}
export interface DemoTimeline {
  id: string;
  title: string;
  fps: number;
  durationInFrames: number;
  segments: DemoSegment[];
}

const C = {
  night: '#1b1640',
  night2: '#241d55',
  night3: '#2e2766',
  line: '#3a3274',
  moon: '#c9c3ee',
  glow: '#ffb938',
  violet: '#5b3de0',
  violetSoft: '#9b7bff',
  lagoon: '#2fd3b0',
  white: '#ffffff',
};
const DISPLAY = "'Fredoka', 'Nunito Variable', sans-serif";
const SANS = "'Nunito Variable', sans-serif";

// The browser window: the app's 1280×720 viewport shown 1500 px wide.
const WIN = { x: 210, y: 34, w: 1500, bar: 46 };
const VIEW_H = (WIN.w * 720) / 1280;
const XFADE = 12;
const CHAPTERS = ['Visitors', 'Learners', 'Memory', 'Instructors', 'Admins'];

function useFonts() {
  const [handle] = useState(() => delayRender('Loading fonts'));
  useEffect(() => {
    Promise.all([
      document.fonts.load('700 64px Fredoka'),
      document.fonts.load('600 32px Fredoka'),
      document.fonts.load('700 28px "Nunito Variable"'),
    ]).then(
      () => continueRender(handle),
      () => continueRender(handle),
    );
  }, [handle]);
}

const ease = (frame: number, start: number, length: number) =>
  interpolate(frame, [start, start + length], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

function Sky({ fog = 0 }: { fog?: number }) {
  const frame = useCurrentFrame();
  const stars = Array.from({ length: 90 }, (_, i) => ({
    x: random(`x${i}`) * 1920,
    y: random(`y${i}`) * 760,
    r: 1.2 + random(`r${i}`) * 2.6,
    phase: random(`p${i}`) * Math.PI * 2,
  }));
  return (
    <AbsoluteFill
      style={{ background: `radial-gradient(ellipse at 70% 0%, ${C.night3} 0%, ${C.night} 62%)` }}
    >
      <svg width={1920} height={1080} style={{ position: 'absolute' }}>
        {stars.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill={C.moon}
            opacity={(0.3 + 0.35 * Math.sin(frame / 28 + s.phase)) * (1 - fog * 0.7)}
          />
        ))}
        <path
          d={`M0 980 Q 240 ${955 + 10 * Math.sin(frame / 32)} 480 980 T 960 980 T 1440 980 T 1920 980 V1080 H0 Z`}
          fill={C.night2}
        />
        <path
          d={`M0 1020 Q 240 ${1000 + 8 * Math.cos(frame / 26)} 480 1020 T 960 1020 T 1440 1020 T 1920 1020 V1080 H0 Z`}
          fill={C.line}
          opacity={0.6}
        />
      </svg>
    </AbsoluteFill>
  );
}

function Wordmark({ size }: { size: number }) {
  return (
    <span
      style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: size, color: C.glow, lineHeight: 1 }}
    >
      lumo
    </span>
  );
}

// ---------------------------------------------------------------------------------------------------------------
// A screenshot in the browser window
// ---------------------------------------------------------------------------------------------------------------
function ShotScene({ seg }: { seg: DemoSegment }) {
  const frame = useCurrentFrame();
  const shot = seg.shot!;
  const box = shot.box;
  // Zoom from the whole page to a view around the focus box, keeping the box comfortably inside.
  let target = { x: 0, y: 0, w: 1280, h: 720 };
  if (box) {
    const z = Math.min(Math.max(Math.min((0.62 * 1280) / box.w, (0.6 * 720) / box.h), 1), 1.75);
    const w = 1280 / z;
    const h = 720 / z;
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    target = {
      x: Math.min(Math.max(cx - w / 2, 0), 1280 - w),
      y: Math.min(Math.max(cy - h / 2, 0), 720 - h),
      w,
      h,
    };
  }
  const p = ease(frame, 14, 40);
  const view = {
    x: target.x * p,
    y: target.y * p,
    w: 1280 + (target.w - 1280) * p,
  };
  const zoom = 1280 / view.w;
  const scale = (WIN.w / 1280) * zoom;
  const ring = ease(frame, 44, 14);
  const pop = spring({ frame, fps: 30, config: { damping: 16, stiffness: 120 } });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: WIN.x,
          top: WIN.y,
          width: WIN.w,
          height: WIN.bar + VIEW_H,
          borderRadius: 18,
          overflow: 'hidden',
          background: C.white,
          boxShadow: '0 30px 80px rgba(0,0,0,0.45), 0 0 0 2px rgba(201,195,238,0.25)',
          transform: `translateY(${(1 - pop) * 14}px)`,
        }}
      >
        <BrowserBar path={shot.path} chapter={seg.chapter} />
        <div style={{ position: 'relative', width: WIN.w, height: VIEW_H, overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              width: 1280,
              height: 720,
              transformOrigin: '0 0',
              transform: `scale(${scale}) translate(${-view.x}px, ${-view.y}px)`,
            }}
          >
            <Img
              src={staticFile(shot.file)}
              style={{ width: 1280, height: 720, display: 'block' }}
            />
            {seg.video && box && (
              <div
                style={{
                  position: 'absolute',
                  left: box.x,
                  top: box.y,
                  width: box.w,
                  height: box.h,
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: C.night,
                }}
              >
                <OffthreadVideo
                  src={staticFile(seg.video)}
                  startFrom={Math.round(seg.videoStart * 30)}
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}
            {box && !seg.video && (
              <div
                style={{
                  position: 'absolute',
                  left: box.x - 8,
                  top: box.y - 8,
                  width: box.w + 16,
                  height: box.h + 16,
                  borderRadius: 16,
                  border: `${4.5 / scale}px solid ${C.glow}`,
                  boxShadow: `0 0 ${24 / scale}px ${C.glow}`,
                  opacity: ring * (0.75 + 0.25 * Math.sin(frame / 9)),
                }}
              />
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

function BrowserBar({ path, chapter }: { path: string; chapter: string | null }) {
  const n = chapter ? CHAPTERS.indexOf(chapter) + 1 : 0;
  return (
    <div
      style={{
        height: WIN.bar,
        background: '#ece9fb',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 18px',
        borderBottom: '1px solid #d9d4f5',
      }}
    >
      {['#ff6b6b', '#ffc84a', '#3ccf91'].map((c) => (
        <span key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />
      ))}
      <div
        style={{
          marginLeft: 22,
          flex: 1,
          maxWidth: 700,
          height: 30,
          borderRadius: 15,
          background: C.white,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: 17,
          color: '#5d5790',
        }}
      >
        lumo.app{path === '/' ? '' : path}
      </div>
      <div style={{ flex: 1 }} />
      {chapter && (
        <span
          style={{
            fontFamily: DISPLAY,
            fontWeight: 600,
            fontSize: 19,
            color: C.white,
            background: C.violet,
            borderRadius: 999,
            padding: '4px 16px',
          }}
        >
          {n} · {chapter}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Title cards
// ---------------------------------------------------------------------------------------------------------------
function Rise({
  at,
  children,
  style,
}: {
  at: number;
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const s = spring({
    frame: Math.max(0, frame - at),
    fps: 30,
    config: { damping: 14, stiffness: 110 },
  });
  return (
    <div
      style={{ opacity: frame < at ? 0 : s, transform: `translateY(${(1 - s) * 30}px)`, ...style }}
    >
      {children}
    </div>
  );
}

function IntroCard({ seg }: { seg: DemoSegment }) {
  const frame = useCurrentFrame();
  const second = seg.cues[1] ? seg.cues[1].from - seg.from : 9999;
  return (
    <AbsoluteFill>
      <Sky />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 140 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 70 }}>
          <Rise at={4}>
            <div style={{ transform: `translateY(${Math.sin(frame / 14) * 12}px)` }}>
              <Wisp size={330} mood={frame > second ? 'cheer' : 'happy'} stage="wisp" decorative />
            </div>
          </Rise>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Rise at={12}>
              <Wordmark size={220} />
            </Rise>
            <Rise at={24}>
              <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 52, color: C.white }}>
                Learn it once. Keep it for good.
              </span>
            </Rise>
            <Rise
              at={second}
              style={{ display: 'flex', gap: 22, alignItems: 'center', marginTop: 16 }}
            >
              <Byte size={96} decorative />
              <Nova size={96} decorative />
              <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 30, color: C.moon }}>
                The real app · made with Lumo&apos;s own video pipeline
              </span>
            </Rise>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function FogCard({ seg }: { seg: DemoSegment }) {
  const frame = useCurrentFrame();
  const second = seg.cues[1] ? seg.cues[1].from - seg.from : 9999;
  // The forgetting curve: memory falls fast without review.
  const draw = ease(frame, 10, 70);
  const curve = 'M 0 20 C 60 210, 160 300, 620 330';
  const fog = ease(frame, second, 40);
  return (
    <AbsoluteFill>
      <Sky fog={fog} />
      {Array.from({ length: 7 }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: ((random(`fx${i}`) * 2200 + frame * (0.6 + random(`fs${i}`))) % 2400) - 300,
            top: 120 + random(`fy${i}`) * 700,
            width: 520,
            height: 220,
            borderRadius: '50%',
            background: C.moon,
            filter: 'blur(60px)',
            opacity: 0.16 * fog,
          }}
        />
      ))}
      <AbsoluteFill
        style={{ padding: '120px 170px', flexDirection: 'row', alignItems: 'center', gap: 110 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28, width: 760 }}>
          <Rise at={4}>
            <span
              style={{
                fontFamily: DISPLAY,
                fontWeight: 700,
                fontSize: 84,
                color: C.white,
                lineHeight: 1.05,
              }}
            >
              Forgetting is the real enemy.
            </span>
          </Rise>
          <Rise at={second}>
            <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 44, color: C.glow }}>
              Meet Gloom, the fog of forgetting.
            </span>
          </Rise>
        </div>
        <div style={{ position: 'relative', width: 700, height: 420 }}>
          <svg width={700} height={420} style={{ position: 'absolute', opacity: 1 - fog * 0.75 }}>
            <line x1={40} y1={20} x2={40} y2={370} stroke={C.line} strokeWidth={4} />
            <line x1={40} y1={370} x2={680} y2={370} stroke={C.line} strokeWidth={4} />
            <text x={50} y={14} fill={C.moon} fontFamily={SANS} fontWeight={700} fontSize={24}>
              memory
            </text>
            <text x={600} y={404} fill={C.moon} fontFamily={SANS} fontWeight={700} fontSize={24}>
              weeks
            </text>
            <path
              d={curve}
              transform="translate(50, 10)"
              fill="none"
              stroke={C.violetSoft}
              strokeWidth={8}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - draw}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              right: 30,
              top: 40,
              opacity: fog,
              transform: `scale(${0.7 + 0.3 * fog}) translateY(${Math.sin(frame / 16) * 10}px)`,
            }}
          >
            <Gloom size={330} decorative />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function TechCard({ seg }: { seg: DemoSegment }) {
  const rows = [
    ['Row Level Security on every table', 'Postgres decides who sees what'],
    ['Answers graded inside the database', 'the key never reaches the browser'],
    ['163 automated tests', '118 database tests · 45 app tests'],
    ['Zero cost to run', 'free tiers · local voice · local video'],
  ];
  const second = seg.cues[1] ? seg.cues[1].from - seg.from : seg.durationInFrames / 2;
  const at = [20, 70, second, second + 70];
  return (
    <AbsoluteFill>
      <Sky />
      <AbsoluteFill style={{ padding: '90px 260px 200px', gap: 26, justifyContent: 'center' }}>
        <Rise at={2}>
          <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 80, color: C.white }}>
            Under the hood
          </span>
        </Rise>
        {rows.map(([title, sub], i) => (
          <Rise key={title} at={at[i] ?? 0}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 28,
                background: 'rgba(46,39,102,0.85)',
                border: `2px solid ${C.line}`,
                borderRadius: 24,
                padding: '20px 30px',
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  background: C.glow,
                  boxShadow: `0 0 20px ${C.glow}`,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 44, color: C.white }}>
                {title}
              </span>
              <span
                style={{
                  fontFamily: SANS,
                  fontWeight: 600,
                  fontSize: 30,
                  color: C.moon,
                  marginLeft: 'auto',
                }}
              >
                {sub}
              </span>
            </div>
          </Rise>
        ))}
        <Rise at={second + 120}>
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 28, color: C.lagoon }}>
            React 19 · TypeScript · Supabase · Remotion · Kokoro voice · FSRS
          </span>
        </Rise>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function OutroCard({ seg }: { seg: DemoSegment }) {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [seg.durationInFrames - 24, seg.durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{ opacity: fadeOut, background: C.night }}>
      <Sky />
      <AbsoluteFill
        style={{ alignItems: 'center', justifyContent: 'center', gap: 26, paddingBottom: 120 }}
      >
        <Rise at={2}>
          <div style={{ transform: `translateY(${Math.sin(frame / 14) * 10}px)` }}>
            <Wisp size={250} mood="cheer" stage="beacon" decorative />
          </div>
        </Rise>
        <Rise at={10}>
          <Wordmark size={170} />
        </Rise>
        <Rise at={18}>
          <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 50, color: C.white }}>
            Learn it once. Keep it for good.
          </span>
        </Rise>
        <Rise at={40}>
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 30, color: C.moon }}>
            Built by Ronit Ahuja · Linkific internship
          </span>
        </Rise>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Captions with Wisp narrating
// ---------------------------------------------------------------------------------------------------------------
function Captions({ timeline }: { timeline: DemoTimeline }) {
  const frame = useCurrentFrame();
  const cues = timeline.segments.flatMap((s) => s.cues);
  let cue: DemoCue | undefined;
  for (const c of cues) if (c.from <= frame) cue = c;
  const seg = [...timeline.segments].reverse().find((s) => s.from <= frame);
  if (!cue || !seg) return null;
  const talking = frame < cue.from + cue.durationInFrames;
  const fadeIn = ease(frame, cue.from, 6);
  const end = timeline.durationInFrames;
  const out = interpolate(frame, [end - 40, end - 20], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const showWisp = seg.card !== 'intro' && seg.card !== 'outro';
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <div
        style={{
          position: 'absolute',
          left: WIN.x,
          width: WIN.w,
          top: WIN.y + WIN.bar + VIEW_H + 18,
          height: 1080 - (WIN.y + WIN.bar + VIEW_H + 18) - 14,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
        }}
      >
        {showWisp && (
          <div
            style={{
              transform: `translateY(${talking ? Math.sin(frame / 4) * 4 : Math.sin(frame / 18) * 3}px)`,
            }}
          >
            <Wisp
              size={104}
              mood={talking ? 'happy' : 'think'}
              stage="wisp"
              glow={false}
              decorative
            />
          </div>
        )}
        <div
          style={{
            flex: 1,
            textAlign: showWisp ? 'left' : 'center',
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 35,
            lineHeight: 1.3,
            color: C.white,
            opacity: 0.35 + 0.65 * fadeIn,
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          {cue.text}
        </div>
      </div>
    </AbsoluteFill>
  );
}

export function Demo({ timeline }: { timeline: DemoTimeline }) {
  useFonts();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Sky />
      {timeline.segments.map((seg, i) => (
        <Sequence
          key={i}
          from={seg.from}
          durationInFrames={seg.durationInFrames + XFADE}
          layout="none"
        >
          <Fade first={i === 0}>
            {seg.card === 'intro' && <IntroCard seg={seg} />}
            {seg.card === 'fog' && <FogCard seg={seg} />}
            {seg.card === 'tech' && <TechCard seg={seg} />}
            {seg.card === 'outro' && <OutroCard seg={seg} />}
            {seg.shot && <ShotScene seg={seg} />}
          </Fade>
        </Sequence>
      ))}
      <Captions timeline={timeline} />
      {timeline.segments.flatMap((seg) =>
        seg.cues.map((cue) => (
          <Sequence
            key={cue.audio + cue.from}
            from={cue.from}
            durationInFrames={cue.durationInFrames + fps}
          >
            <Audio src={staticFile(cue.audio)} />
          </Sequence>
        )),
      )}
    </AbsoluteFill>
  );
}

function Fade({ first, children }: { first: boolean; children: ReactNode }) {
  const frame = useCurrentFrame();
  const opacity = first ? 1 : ease(frame, 0, XFADE);
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
}
