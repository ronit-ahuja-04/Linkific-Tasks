import { ImageResponse } from 'next/og';
import { PIP_TINTS } from '@/components/pip-palette';
import { computeStats, stageFor, topSkills, CLASS_INFO, SKILL_LABELS } from '@/lib/game';
import { getPublicSheet } from '@/lib/server/public';

/**
 * The share card: what a link to /c/<handle> shows on LinkedIn, Slack, X or WhatsApp. Drawn in code with ImageResponse
 * (HTML and CSS turned into a PNG on the server), from the same cached data as the page.
 */
export const alt = 'An Intern Quest character card: name, level, XP and top skills, with Pip';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const INK = '#2A1E3B';

export default async function Image({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const sheet = await getPublicSheet(handle.toLowerCase());
  if (!sheet) {
    return new ImageResponse(
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#6C4DF5', color: '#fff', fontSize: 64, fontWeight: 700 }}>Intern Quest</div>,
      size,
    );
  }
  const { character, quests } = sheet;
  const stats = computeStats(character.class, quests);
  const skills = topSkills(stats, 3);
  const stage = stageFor(stats.progress.level);
  const body = PIP_TINTS[character.avatar.colour % PIP_TINTS.length] ?? PIP_TINTS[0];
  const percent = Math.round(stats.progress.fraction * 100);

  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', background: '#6C4DF5', color: '#fff', padding: 64, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, opacity: 0.9 }}>Intern Quest</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>{character.displayName}</div>
          <div style={{ display: 'flex', fontSize: 52, fontWeight: 800, color: '#FFD54A', marginTop: 8 }}>Level {stats.progress.level} {stats.title}</div>
          <div style={{ display: 'flex', fontSize: 30, marginTop: 14, opacity: 0.9 }}>{CLASS_INFO[character.class].label} · {stats.publishedCount} quests · {stats.totalXp.toLocaleString('en-US')} XP</div>
          <div style={{ display: 'flex', width: 620, height: 22, background: 'rgba(255,255,255,0.25)', borderRadius: 999, marginTop: 26 }}>
            <div style={{ display: 'flex', width: `${percent}%`, height: 22, background: '#FFD54A', borderRadius: 999 }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          {skills.map((s) => (
            <div key={s.skill} style={{ display: 'flex', background: '#fff', color: INK, fontSize: 26, fontWeight: 700, padding: '10px 22px', borderRadius: 999 }}>
              {SKILL_LABELS[s.skill]} · Lv {s.level}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 380 }}>
        {/* a still Pip: the same shapes as the animated one, for the share card */}
        <svg width="340" height="357" viewBox="0 0 200 210">
          <ellipse cx="100" cy="196" rx="52" ry="8" fill={INK} opacity="0.2" />
          {stage === 'egg' ? (
            <path d="M100 48 C140 48 160 108 160 140 C160 172 134 190 100 190 C66 190 40 172 40 140 C40 108 60 48 100 48 Z" fill={body} stroke={INK} strokeWidth="5" />
          ) : (
            <path d="M100 52 C146 52 168 92 166 132 C164 170 136 188 100 188 C64 188 36 170 34 132 C32 92 54 52 100 52 Z" fill={body} stroke={INK} strokeWidth="5" />
          )}
          {stage !== 'egg' && <path d="M104 30 C110 16 128 14 134 20 C128 32 114 36 104 30 Z" fill="#3DBE6B" stroke={INK} strokeWidth="4" />}
          {stage !== 'egg' && <path d="M100 54 C100 44 101 36 104 28" stroke={INK} strokeWidth="4" fill="none" />}
          {stage === 'guardian' && <path d="M124 52 L128 30 L138 42 L146 26 L152 44 L160 34 L158 58 Z" fill="#FFC531" stroke={INK} strokeWidth="4" />}
          <ellipse cx="62" cy="144" rx="11" ry="7" fill="#FF9DB5" />
          <ellipse cx="138" cy="144" rx="11" ry="7" fill="#FF9DB5" />
          <ellipse cx="78" cy="122" rx="9" ry="12" fill={INK} />
          <ellipse cx="122" cy="122" rx="9" ry="12" fill={INK} />
          <circle cx="81" cy="117" r="3.2" fill="#fff" />
          <circle cx="125" cy="117" r="3.2" fill="#fff" />
          <path d="M86 146 Q100 162 114 146 Z" fill={INK} stroke={INK} strokeWidth="4" />
        </svg>
      </div>
    </div>,
    size,
  );
}
