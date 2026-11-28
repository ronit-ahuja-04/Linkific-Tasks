/** The other cast members: Byte (Code Reef), Nova (Starfall Lagoon), Gloom (the fog of forgetting). */
interface CharacterProps {
  size?: number;
  decorative?: boolean;
  className?: string;
}

function a11y(decorative: boolean | undefined, label: string) {
  return decorative ? { 'aria-hidden': true as const } : { role: 'img', 'aria-label': label };
}

export function Byte({ size = 120, decorative, className }: CharacterProps) {
  return (
    <svg
      {...a11y(decorative, 'Byte, the robot crab')}
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      style={{ overflow: 'visible', display: 'block' }}
    >
      <ellipse cx="60" cy="110" rx="36" ry="5" fill="#1B1640" opacity={0.12} />
      <path
        d="M38 96 L32 107 M52 99 L50 109 M68 99 L70 109 M82 96 L88 107"
        fill="none"
        stroke="#0B7A68"
        strokeWidth={4.5}
        strokeLinecap="round"
      />
      <path d="M26 68 L14 58" fill="none" stroke="#16B39A" strokeWidth={8} strokeLinecap="round" />
      <path d="M94 68 L106 58" fill="none" stroke="#16B39A" strokeWidth={8} strokeLinecap="round" />
      <circle cx="11" cy="50" r="11" fill="#16B39A" />
      <path d="M11 50 L0 43 L2 55 Z" fill="#FBFAFF" />
      <circle cx="109" cy="50" r="11" fill="#16B39A" />
      <path d="M109 50 L120 43 L118 55 Z" fill="#FBFAFF" />
      <path d="M60 38 L60 21" fill="none" stroke="#0B7A68" strokeWidth={4} strokeLinecap="round" />
      <circle cx="60" cy="16" r="6.5" fill="#FFB938" />
      <rect x="22" y="36" width="76" height="64" rx="20" fill="#16B39A" />
      <rect x="32" y="46" width="56" height="36" rx="10" fill="#1B1640" />
      <rect x="45" y="55" width="8" height="12" rx="3" fill="#7CF5DA" />
      <rect x="67" y="55" width="8" height="12" rx="3" fill="#7CF5DA" />
      <path
        d="M52 73 Q60 78 68 73"
        fill="none"
        stroke="#7CF5DA"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <rect x="44" y="87" width="32" height="6" rx="3" fill="#0E8A76" />
    </svg>
  );
}

export function Nova({ size = 120, decorative, className }: CharacterProps) {
  return (
    <svg
      {...a11y(decorative, 'Nova, the astronaut axolotl')}
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      style={{ overflow: 'visible', display: 'block' }}
    >
      <circle
        cx="60"
        cy="60"
        r="55"
        fill="#DDF1FF"
        opacity={0.45}
        stroke="#9FD3FF"
        strokeWidth={3}
      />
      <g fill="#FF5C9A">
        <ellipse cx="22" cy="44" rx="13" ry="5.5" transform="rotate(-35 22 44)" />
        <ellipse cx="16" cy="59" rx="13" ry="5.5" transform="rotate(-6 16 59)" />
        <ellipse cx="22" cy="74" rx="13" ry="5.5" transform="rotate(24 22 74)" />
        <ellipse cx="98" cy="44" rx="13" ry="5.5" transform="rotate(35 98 44)" />
        <ellipse cx="104" cy="59" rx="13" ry="5.5" transform="rotate(6 104 59)" />
        <ellipse cx="98" cy="74" rx="13" ry="5.5" transform="rotate(-24 98 74)" />
      </g>
      <ellipse cx="60" cy="64" rx="38" ry="31" fill="#FF9EC4" />
      <ellipse cx="60" cy="77" rx="24" ry="14" fill="#FFC9DD" />
      <circle cx="46" cy="60" r="5.5" fill="#1B1640" />
      <circle cx="74" cy="60" r="5.5" fill="#1B1640" />
      <circle cx="47.8" cy="58" r="1.8" fill="#FFFFFF" />
      <circle cx="75.8" cy="58" r="1.8" fill="#FFFFFF" />
      <path
        d="M48 71 Q60 80 72 71"
        fill="none"
        stroke="#1B1640"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path d="M92 16 L94 22 L100 24 L94 26 L92 32 L90 26 L84 24 L90 22 Z" fill="#FFD25E" />
    </svg>
  );
}

export function Gloom({ size = 160, decorative, className }: CharacterProps) {
  return (
    <svg
      {...a11y(decorative, 'Gloom, the fog of forgetting')}
      viewBox="0 0 160 110"
      width={size}
      height={Math.round((size * 110) / 160)}
      className={className}
      style={{ overflow: 'visible', display: 'block' }}
    >
      <path
        d="M138 72 C152 76 158 64 150 56"
        fill="none"
        stroke="#BDB6DE"
        strokeWidth={7}
        strokeLinecap="round"
      />
      <path
        d="M30 92 C10 92 6 68 24 62 C20 40 46 30 60 44 C66 20 104 18 110 42 C130 36 150 56 138 72 C152 84 140 98 124 94 C112 102 52 102 30 92 Z"
        fill="#BDB6DE"
      />
      <path
        d="M56 64 Q63 58 70 64"
        fill="none"
        stroke="#1B1640"
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <ellipse cx="63" cy="67" rx="4.2" ry="2.6" fill="#1B1640" />
      <path
        d="M90 64 Q97 58 104 64"
        fill="none"
        stroke="#1B1640"
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <ellipse cx="97" cy="67" rx="4.2" ry="2.6" fill="#1B1640" />
      <path
        d="M72 80 Q84 86 96 78"
        fill="none"
        stroke="#1B1640"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Guardian({
  guardian,
  ...props
}: CharacterProps & { guardian: 'byte' | 'nova' | 'mystery' }) {
  if (guardian === 'nova') return <Nova {...props} />;
  if (guardian === 'byte') return <Byte {...props} />;
  const size = props.size ?? 120;
  return (
    <svg
      {...a11y(props.decorative, 'A hidden guardian')}
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={props.className}
    >
      <circle
        cx="60"
        cy="60"
        r="54"
        fill="none"
        stroke="#4A4190"
        strokeWidth={3}
        strokeDasharray="6 7"
      />
      <path
        d="M60 22 C78 22 92 36 92 56 C92 80 76 96 60 96 C44 96 28 80 28 56 C28 36 42 22 60 22 Z"
        fill="#3A3274"
      />
      <path
        d="M52 50 C52 42 68 42 68 50 C68 56 60 57 60 64 M60 73 L60 75"
        fill="none"
        stroke="#C9C3EE"
        strokeWidth={5}
        strokeLinecap="round"
      />
    </svg>
  );
}
