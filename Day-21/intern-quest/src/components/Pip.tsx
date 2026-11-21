'use client';

import { m, useAnimationControls } from 'motion/react';
import { useEffect } from 'react';
import type { PipMood, PipStage } from '@/lib/game';

/**
 * Pip, drawn as SVG and animated with Motion. One body; the STAGE adds parts (a sprout, wings, a crown) and the
 * MOOD changes the eyes, brows and mouth and adds an effect (sparkles, floating z's, flames).
 * Pivot points (originX / originY) are fractions of each shape's OWN box: Motion measures SVG transforms from the
 * element's bounding box (transform-box: fill-box), so page coordinates like '122px' would pivot far off the shape.
 * Animations are transform and opacity only (cheap for the browser), and Motion turns them off for visitors who
 * ask for reduced motion (see <MotionConfig reducedMotion="user"> in the app screen).
 */
const INK = '#2A1E3B';

/** Pip's look, chosen in the character editor (stored as avatar.colour and avatar.accessory) */
import { PIP_TINTS } from './pip-palette';
export { PIP_ACCESSORIES, PIP_TINT_NAMES, PIP_TINTS } from './pip-palette';
const tintOf = (n: number): string => PIP_TINTS[((n % PIP_TINTS.length) + PIP_TINTS.length) % PIP_TINTS.length] ?? PIP_TINTS[0];

interface PipProps {
  stage: PipStage;
  mood: PipMood;
  /** changes on every tap: Pip hops */
  hop: number;
  /** index into PIP_TINTS */
  tint?: number;
  /** index into PIP_ACCESSORIES */
  accessory?: number;
}

export default function Pip({ stage, mood, hop, tint = 0, accessory = 0 }: PipProps) {
  const body = tintOf(tint);
  const jump = useAnimationControls();
  useEffect(() => {
    if (hop === 0) return;
    void jump.start({ y: [0, -46, 0], scaleY: [1, 1.08, 0.86, 1], scaleX: [1, 0.94, 1.12, 1], transition: { duration: 0.6, ease: 'easeOut' } });
  }, [hop, jump]);

  const sleepy = mood === 'sleepy';
  return (
    <svg viewBox="0 0 200 210" className="pip-svg" role="img" aria-label={`Pip, a ${stage}, looking ${mood.replace('_', ' ')}`} style={{ overflow: 'visible' }}>
      {/* ground shadow breathes with the bob */}
      <m.ellipse cx="100" cy="196" rx="52" ry="8" fill={INK} opacity={0.18}
        animate={{ scaleX: sleepy ? [1, 1.04, 1] : [1, 0.82, 1] }} transition={{ duration: sleepy ? 3.6 : 2.4, repeat: Infinity, ease: 'easeInOut' }} />

      <m.g animate={jump} style={{ originX: 0.5, originY: 1 }}>
        <m.g
          animate={sleepy ? { scale: [1, 1.03, 1] } : { y: [0, -10, 0] }}
          transition={{ duration: sleepy ? 3.6 : 2.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: 0.5, originY: 1 }}
        >
          {mood === 'fired_up' && <Flames />}
          {(stage === 'sprite' || stage === 'guardian') && <Wings fast={mood === 'fired_up' || mood === 'proud'} />}

          {accessory === 4 && <Headphones back />}
          {stage === 'egg' ? <EggBody fill={body} /> : <BlobBody big={stage === 'guardian'} fill={body} />}
          {stage !== 'egg' && <Sprout />}
          {stage === 'guardian' && <Crown />}

          <Face mood={mood} />
          <Accessory kind={accessory} />
        </m.g>
      </m.g>

      {mood === 'proud' && <Sparkles />}
      {sleepy && <Zs />}
    </svg>
  );
}

function BlobBody({ big, fill }: { big: boolean; fill: string }) {
  const s = big ? 1.06 : 1;
  return (
    <g transform={`translate(100 120) scale(${s}) translate(-100 -120)`}>
      <path d="M100 52 C146 52 168 92 166 132 C164 170 136 188 100 188 C64 188 36 170 34 132 C32 92 54 52 100 52 Z" fill={fill} stroke={INK} strokeWidth="5" />
      <path d="M60 100 C62 84 74 70 90 64" stroke="#fff" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.9" />
    </g>
  );
}

function EggBody({ fill }: { fill: string }) {
  return (
    <g>
      <path d="M100 48 C140 48 160 108 160 140 C160 172 134 190 100 190 C66 190 40 172 40 140 C40 108 60 48 100 48 Z" fill={fill} stroke={INK} strokeWidth="5" />
      {/* the crack Pip is peeking through */}
      <path d="M44 118 L62 108 L76 122 L92 106 L108 122 L124 106 L140 122 L156 112" stroke={INK} strokeWidth="4" fill="none" strokeLinejoin="round" />
      <path d="M68 70 C74 60 84 54 94 52" stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" />
    </g>
  );
}

function Sprout() {
  return (
    <m.g animate={{ rotate: [-6, 6, -6] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} style={{ originX: 0.5, originY: 1 }}>
      <path d="M100 54 C100 44 101 36 104 28" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M104 30 C110 16 128 14 134 20 C128 32 114 36 104 30 Z" fill="#3DBE6B" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M102 34 C92 24 76 26 72 32 C80 42 94 42 102 34 Z" fill="#59D987" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
    </m.g>
  );
}

function Wings({ fast }: { fast: boolean }) {
  const flap = { duration: fast ? 0.35 : 0.9, repeat: Infinity, ease: 'easeInOut' as const };
  return (
    <>
      <m.path d="M40 116 C14 96 6 120 14 136 C22 150 38 142 44 134 Z" fill="#CFE6FF" stroke={INK} strokeWidth="4" strokeLinejoin="round"
        animate={{ rotate: [0, -16, 0] }} transition={flap} style={{ originX: 1, originY: 0.6 }} />
      <m.path d="M160 116 C186 96 194 120 186 136 C178 150 162 142 156 134 Z" fill="#CFE6FF" stroke={INK} strokeWidth="4" strokeLinejoin="round"
        animate={{ rotate: [0, 16, 0] }} transition={flap} style={{ originX: 0, originY: 0.6 }} />
    </>
  );
}

function Crown() {
  return (
    <m.g animate={{ y: [0, -3, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}>
      <path d="M124 52 L128 30 L138 42 L146 26 L152 44 L160 34 L158 58 Z" fill="#FFC531" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
    </m.g>
  );
}

function Eye({ x, mood }: { x: number; mood: PipMood }) {
  if (mood === 'sleepy') return <path d={`M${x - 11} 124 Q${x} 132 ${x + 11} 124`} stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />;
  if (mood === 'proud') {
    return (
      <m.path d={star(x, 122, 13, 6)} fill="#FFC531" stroke={INK} strokeWidth="3.5" strokeLinejoin="round"
        animate={{ rotate: [0, 18, 0], scale: [1, 1.12, 1] }} transition={{ duration: 1.6, repeat: Infinity }} style={{ originX: 0.5, originY: 0.5 }} />
    );
  }
  return (
    <m.g animate={{ scaleY: [1, 1, 0.1, 1] }} transition={{ duration: 3.8, times: [0, 0.92, 0.96, 1], repeat: Infinity }} style={{ originX: 0.5, originY: 0.5 }}>
      <ellipse cx={x} cy="122" rx="9" ry={mood === 'fired_up' ? 10 : 12} fill={INK} />
      <circle cx={x + 3} cy="117" r="3.2" fill="#fff" />
    </m.g>
  );
}

function Face({ mood }: { mood: PipMood }) {
  return (
    <g>
      <ellipse cx="62" cy="144" rx="11" ry="7" fill="#FF9DB5" opacity={mood === 'sleepy' ? 0.4 : 0.75} />
      <ellipse cx="138" cy="144" rx="11" ry="7" fill="#FF9DB5" opacity={mood === 'sleepy' ? 0.4 : 0.75} />
      <Eye x={78} mood={mood} />
      <Eye x={122} mood={mood} />
      {mood === 'worried' && (
        <>
          <path d="M66 106 L88 97" stroke={INK} strokeWidth="5" strokeLinecap="round" />
          <path d="M134 106 L112 97" stroke={INK} strokeWidth="5" strokeLinecap="round" />
        </>
      )}
      {mood === 'fired_up' && (
        <>
          <path d="M66 100 L90 110" stroke={INK} strokeWidth="6" strokeLinecap="round" />
          <path d="M134 100 L110 110" stroke={INK} strokeWidth="6" strokeLinecap="round" />
        </>
      )}
      <Mouth mood={mood} />
    </g>
  );
}

function Mouth({ mood }: { mood: PipMood }) {
  switch (mood) {
    case 'happy':
      return <path d="M86 146 Q100 162 114 146 Z" fill={INK} stroke={INK} strokeWidth="4" strokeLinejoin="round" />;
    case 'proud':
      return (
        <g>
          <path d="M80 144 Q100 172 120 144 Z" fill={INK} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <path d="M90 156 Q100 164 110 156" fill="#FF7A9A" />
        </g>
      );
    case 'worried':
      return <path d="M86 154 Q93 147 100 154 Q107 161 114 154" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />;
    case 'sleepy':
      return (
        <m.ellipse cx="100" cy="152" rx="6" ry="5" fill={INK}
          animate={{ ry: [4, 7, 4] }} transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }} />
      );
    case 'fired_up':
      return <path d="M84 146 L116 146 Q112 166 100 166 Q88 166 84 146 Z" fill={INK} stroke={INK} strokeWidth="4" strokeLinejoin="round" />;
  }
}

function Sparkles() {
  const spots = [[30, 60, 0], [172, 70, 0.5], [160, 170, 1], [26, 160, 1.4]] as const;
  return (
    <>
      {spots.map(([x, y, delay]) => (
        <m.path key={`${x}-${y}`} d={star(x, y, 9, 3.5)} fill="#FFD54A" stroke={INK} strokeWidth="2.5"
          animate={{ scale: [0, 1.1, 0], opacity: [0, 1, 0], rotate: [0, 45] }} transition={{ duration: 1.8, repeat: Infinity, delay }} style={{ originX: 0.5, originY: 0.5 }} />
      ))}
    </>
  );
}

function Zs() {
  return (
    <>
      {[0, 1.2, 2.4].map((delay, i) => (
        <m.text key={delay} x={150 + i * 8} y={70} fontSize={18 + i * 6} fontWeight={800} fill="#fff" stroke={INK} strokeWidth="1.2" fontFamily="var(--font-display), sans-serif"
          animate={{ y: [0, -46], x: [0, 14], opacity: [0, 1, 0] }} transition={{ duration: 3.6, repeat: Infinity, delay, ease: 'easeOut' }}>
          z
        </m.text>
      ))}
    </>
  );
}

function Flames() {
  return (
    <>
      {[[46, 0], [154, 0.25]].map(([x, delay]) => (
        <m.path key={x} d={`M${x} 104 C${x - 14} 84 ${x - 4} 66 ${x} 54 C${x + 6} 70 ${x + 16} 82 ${x} 104 Z`} fill="#FFB020" stroke={INK} strokeWidth="3.5" strokeLinejoin="round"
          animate={{ scaleY: [1, 1.18, 0.94, 1], opacity: [0.9, 1, 0.85, 0.9] }} transition={{ duration: 0.7, repeat: Infinity, delay }} style={{ originX: 0.5, originY: 1 }} />
      ))}
    </>
  );
}

function Headphones({ back = false }: { back?: boolean }) {
  // drawn in two parts: the band behind the head, the ear cups in front
  if (back) return <path d="M40 120 Q38 38 100 36 Q162 38 160 120" stroke={INK} strokeWidth="8" fill="none" strokeLinecap="round" />;
  return (
    <g>
      <rect x="26" y="104" width="22" height="36" rx="10" fill="#6C4DF5" stroke={INK} strokeWidth="4" />
      <rect x="152" y="104" width="22" height="36" rx="10" fill="#6C4DF5" stroke={INK} strokeWidth="4" />
    </g>
  );
}

function Accessory({ kind }: { kind: number }) {
  switch (kind) {
    case 1: // glasses
      return (
        <g fill="rgba(255,255,255,0.25)" stroke={INK} strokeWidth="4">
          <circle cx="78" cy="122" r="17" />
          <circle cx="122" cy="122" r="17" />
          <path d="M95 120 Q100 116 105 120" fill="none" />
        </g>
      );
    case 2: // scarf
      return (
        <g stroke={INK} strokeWidth="4" strokeLinejoin="round">
          <path d="M46 162 Q100 184 154 162 L152 178 Q100 198 48 178 Z" fill="#E5484D" />
          <path d="M126 180 L140 206 L118 204 Z" fill="#E5484D" />
        </g>
      );
    case 3: // bow
      return (
        <g stroke={INK} strokeWidth="4" strokeLinejoin="round" fill="#FF6FA5">
          <path d="M140 70 L122 58 L124 84 Z" />
          <path d="M140 70 L158 58 L156 84 Z" />
          <circle cx="140" cy="71" r="5" />
        </g>
      );
    case 4:
      return <Headphones />;
    case 5: // freckles
      return (
        <g fill="#C9785A">
          {[[56, 136], [64, 140], [58, 146], [136, 136], [144, 140], [142, 146]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.4" />)}
        </g>
      );
    default:
      return null;
  }
}

/** A five-pointed star path centred on (cx, cy) */
function star(cx: number, cy: number, outer: number, inner: number): string {
  const points = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
  });
  return `M${points.join(' L')} Z`;
}
