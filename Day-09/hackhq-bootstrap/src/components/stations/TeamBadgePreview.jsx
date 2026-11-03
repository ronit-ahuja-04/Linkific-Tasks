import { HACKATHON_TRACKS } from '../../lib/validation.js';
import { Shield, MapPin } from 'lucide-react';
import { cx } from '../ui.jsx';

export default function TeamBadgePreview({ form }) {
  const currentTrack = HACKATHON_TRACKS.find((t) => t.id === form.track) || HACKATHON_TRACKS[0];

  const hasContent =
    form.teamName.trim().length > 0 || form.members.some((m) => m.name.trim().length > 0);

  return (
    <div
      className={cx(
        'relative mx-auto w-full max-w-sm overflow-hidden rounded-card border border-white/10 bg-board text-on-board shadow-pop transition-opacity duration-300',
        hasContent ? 'opacity-100' : 'opacity-80'
      )}
      aria-label="Live Team Lanyard Badge Preview"
    >
      <div className="flex justify-center pt-3" aria-hidden="true">
        <div className="flex h-3 w-16 items-center justify-center rounded-full bg-bg/90 shadow-inner">
          <div className="h-1 w-8 rounded-full bg-board" />
        </div>
      </div>

      <div
        className="mt-3 flex items-center justify-between gap-3 px-5 py-2 text-[#0b0b0f]"
        style={{ backgroundColor: currentTrack.color }}
      >
        <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider">
          {currentTrack.name}
        </span>
        <span className="font-mono text-[0.65rem] font-medium uppercase tracking-wider opacity-80">
          HackHQ 2026
        </span>
      </div>

      <div className="px-5 pb-5 pt-5">
        <div>
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-on-board/60">
            HACKATHON TEAM
          </span>
          <h2 className="mt-1 break-words font-display text-3xl font-bold leading-tight tracking-tight">
            {form.teamName.trim() || 'Your Team Name'}
          </h2>
        </div>

        {form.contact?.city && (
          <div className="mt-2 flex items-center gap-1.5 text-sm text-on-board/70">
            <MapPin size={13} className="text-brand" aria-hidden="true" />
            <span>{form.contact.city}</span>
          </div>
        )}

        <div className="mt-5 border-t border-dashed border-white/15 pt-4">
          <div className="mb-2">
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-on-board/60">
              ROSTER ({form.members.length}/4)
            </span>
          </div>
          <ul className="space-y-1.5">
            {form.members.map((member, idx) => (
              <li
                key={member.id || idx}
                className="flex items-baseline justify-between gap-3 text-sm"
              >
                <span className="min-w-0 truncate font-medium">
                  {member.name.trim() || `Member ${idx + 1}`}
                </span>
                <span className="shrink-0 font-mono text-[0.65rem] uppercase tracking-wider text-on-board/60">
                  {member.role}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {form.interests && form.interests.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {form.interests.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-brand/40 px-2.5 py-0.5 font-mono text-[0.65rem] text-brand"
              >
                #{tag.replace(/\s+/g, '')}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-white/5 px-5 py-3">
        <div className="flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-wider text-on-board/60">
          <Shield size={12} aria-hidden="true" />
          <span>OFFICIAL PARTICIPANT BADGE</span>
        </div>
        <div className="flex flex-col items-end gap-1" aria-hidden="true">
          <div className="h-5 w-20 bg-[repeating-linear-gradient(90deg,currentColor_0_2px,transparent_2px_4px,currentColor_4px_5px,transparent_5px_8px)] opacity-80" />
          <span className="font-mono text-[0.55rem] tracking-widest text-on-board/60">
            HHQ-{Math.abs(form.teamName.length * 1337)}
          </span>
        </div>
      </div>
    </div>
  );
}
