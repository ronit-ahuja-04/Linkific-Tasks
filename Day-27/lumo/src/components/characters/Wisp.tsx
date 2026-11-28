/** Wisp, the AI guide. Its colours follow its growth stage; its face follows its mood. */
export type WispMood = 'happy' | 'cheer' | 'think' | 'sad' | 'wow';
export type WispStage = 'spark' | 'wisp' | 'lantern' | 'beacon';

export interface WispProps {
  size?: number;
  mood?: WispMood;
  stage?: WispStage;
  /** Soft halo behind Wisp; turn off on busy backgrounds. */
  glow?: boolean;
  /** Decorative when the surrounding text already says who is speaking. */
  decorative?: boolean;
  className?: string;
}

const STAGE_COLOURS: Record<WispStage, { body: string; deep: string; belly: string }> = {
  spark: { body: '#FFD978', deep: '#E0A930', belly: '#FFF1C6' },
  wisp: { body: '#FFB938', deep: '#D08209', belly: '#FFE7A8' },
  lantern: { body: '#FF9B3D', deep: '#C9630E', belly: '#FFD9A8' },
  beacon: { body: '#9B7BFF', deep: '#6A4BE0', belly: '#FFE7A8' },
};

interface Face {
  mouth: string;
  mouthFill: string;
  armLeft: string;
  armRight: string;
  browLeft: string;
  browRight: string;
  brows: number;
  sparkles: number;
  thinking: number;
  eyeY: number;
}

const FACES: Record<WispMood, Face> = {
  happy: {
    mouth: 'M52 90 Q60 99 68 90',
    mouthFill: 'none',
    armLeft: 'M24 84 Q12 88 10 98',
    armRight: 'M96 84 Q108 88 110 98',
    browLeft: 'M40 62 L52 62',
    browRight: 'M68 62 L80 62',
    brows: 0,
    sparkles: 0,
    thinking: 0,
    eyeY: 74,
  },
  cheer: {
    mouth: 'M50 87 Q60 104 70 87 Z',
    mouthFill: '#1B1640',
    armLeft: 'M22 74 Q8 62 12 44',
    armRight: 'M98 74 Q112 62 108 44',
    browLeft: 'M40 62 L52 60',
    browRight: 'M68 60 L80 62',
    brows: 0,
    sparkles: 1,
    thinking: 0,
    eyeY: 74,
  },
  think: {
    mouth: 'M54 93 Q61 90 67 92',
    mouthFill: 'none',
    armLeft: 'M24 84 Q12 88 10 98',
    armRight: 'M97 82 Q110 76 108 62',
    browLeft: 'M40 62 L52 63',
    browRight: 'M68 57 L80 59',
    brows: 1,
    sparkles: 0,
    thinking: 1,
    eyeY: 72,
  },
  sad: {
    mouth: 'M52 96 Q60 88 68 96',
    mouthFill: 'none',
    armLeft: 'M22 88 Q16 98 20 108',
    armRight: 'M98 88 Q104 98 100 108',
    browLeft: 'M40 64 L52 59',
    browRight: 'M68 59 L80 64',
    brows: 1,
    sparkles: 0,
    thinking: 0,
    eyeY: 76,
  },
  wow: {
    mouth: 'M60 86 a5.5 6.5 0 1 0 0.01 0 Z',
    mouthFill: '#1B1640',
    armLeft: 'M22 78 Q6 72 8 58',
    armRight: 'M98 78 Q114 72 112 58',
    browLeft: 'M40 58 L52 58',
    browRight: 'M68 58 L80 58',
    brows: 1,
    sparkles: 1,
    thinking: 0,
    eyeY: 74,
  },
};

const MOOD_WORDS: Record<WispMood, string> = {
  happy: 'happy',
  cheer: 'cheering',
  think: 'thinking',
  sad: 'worried',
  wow: 'amazed',
};

export function Wisp({
  size = 120,
  mood = 'happy',
  stage = 'wisp',
  glow = true,
  decorative = false,
  className,
}: WispProps) {
  const c = STAGE_COLOURS[stage];
  const f = FACES[mood];
  const a11y = decorative
    ? { 'aria-hidden': true as const }
    : { role: 'img', 'aria-label': `Wisp, ${MOOD_WORDS[mood]}` };
  return (
    <svg
      {...a11y}
      viewBox="0 0 120 130"
      width={size}
      height={Math.round((size * 130) / 120)}
      className={className}
      style={{ overflow: 'visible', display: 'block' }}
      data-mood={mood}
      data-stage={stage}
    >
      {glow && (
        <>
          <circle cx="60" cy="72" r="56" fill={c.body} opacity={0.18} />
          <circle cx="60" cy="72" r="44" fill={c.body} opacity={0.18} />
        </>
      )}
      <path d={f.armLeft} fill="none" stroke={c.deep} strokeWidth={7} strokeLinecap="round" />
      <path d={f.armRight} fill="none" stroke={c.deep} strokeWidth={7} strokeLinecap="round" />
      <ellipse cx="48" cy="117" rx="9" ry="4.5" fill={c.deep} />
      <ellipse cx="72" cy="117" rx="9" ry="4.5" fill={c.deep} />
      <path
        d="M60 8 C70 26 86 30 94 48 C106 72 100 106 60 116 C20 106 14 72 26 48 C34 30 50 26 60 8 Z"
        fill={c.body}
      />
      <ellipse cx="60" cy="88" rx="27" ry="23" fill={c.belly} />
      <path
        d="M60 20 C65 31 73 37 71 48 C69 55 63 57 60 53 C57 57 51 55 49 48 C47 37 55 31 60 20 Z"
        fill="#FFF6D8"
        opacity={0.9}
      />
      <path
        d={f.browLeft}
        fill="none"
        stroke="#1B1640"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={f.brows}
      />
      <path
        d={f.browRight}
        fill="none"
        stroke="#1B1640"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={f.brows}
      />
      <ellipse cx="46" cy={f.eyeY} rx="6.5" ry="8.5" fill="#1B1640" />
      <ellipse cx="74" cy={f.eyeY} rx="6.5" ry="8.5" fill="#1B1640" />
      <circle cx="48.5" cy={f.eyeY - 3} r="2.4" fill="#FFFFFF" />
      <circle cx="76.5" cy={f.eyeY - 3} r="2.4" fill="#FFFFFF" />
      <ellipse cx="36" cy="89" rx="6" ry="3.5" fill="#FF7A8A" opacity={0.55} />
      <ellipse cx="84" cy="89" rx="6" ry="3.5" fill="#FF7A8A" opacity={0.55} />
      <path
        d={f.mouth}
        fill={f.mouthFill}
        stroke="#1B1640"
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g opacity={f.sparkles} fill="#FFD25E">
        <path d="M10 18 L12.5 25 L19 27 L12.5 29 L10 36 L7.5 29 L1 27 L7.5 25 Z" />
        <path d="M110 12 L112 18 L118 20 L112 22 L110 28 L108 22 L102 20 L108 18 Z" />
        <path d="M114 46 L115.5 50 L119.5 51.5 L115.5 53 L114 57 L112.5 53 L108.5 51.5 L112.5 50 Z" />
      </g>
      <g opacity={f.thinking} fill="#D9D1FF">
        <circle cx="100" cy="40" r="3" />
        <circle cx="108" cy="29" r="4.5" />
        <circle cx="115" cy="14" r="6.5" />
      </g>
    </svg>
  );
}
