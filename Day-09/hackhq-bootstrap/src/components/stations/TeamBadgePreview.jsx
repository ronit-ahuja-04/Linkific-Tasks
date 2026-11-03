import { HACKATHON_TRACKS } from '../../lib/validation.js';
import { Shield, MapPin } from 'lucide-react';
import { cx } from '../ui.jsx';

const MONO_LABEL = 'font-monospace text-uppercase ls-wider opacity-75';

export default function TeamBadgePreview({ form }) {
  const currentTrack = HACKATHON_TRACKS.find((t) => t.id === form.track) || HACKATHON_TRACKS[0];

  const hasContent =
    form.teamName.trim().length > 0 || form.members.some((m) => m.name.trim().length > 0);

  return (
    <div
      className={cx(
        'position-relative mx-auto w-100 overflow-hidden rounded-4 shadow text-bg-dark',
        hasContent ? 'opacity-100' : 'opacity-75'
      )}
      style={{ maxWidth: '24rem', background: 'var(--board)', color: 'var(--on-board)' }}
      aria-label="Live Team Lanyard Badge Preview"
    >
      <div className="d-flex justify-content-center pt-3" aria-hidden="true">
        <div
          className="d-flex align-items-center justify-content-center rounded-pill bg-body-secondary"
          style={{ width: '4rem', height: '0.75rem' }}
        >
          <div
            className="rounded-pill"
            style={{ width: '2rem', height: '0.25rem', background: 'var(--board)' }}
          />
        </div>
      </div>

      <div
        className="mt-3 d-flex align-items-center justify-content-between gap-3 px-4 py-2"
        style={{ backgroundColor: currentTrack.color, color: '#0b0b0f' }}
      >
        <span className="font-monospace small fw-semibold text-uppercase ls-wide">
          {currentTrack.name}
        </span>
        <span className="font-monospace small fw-medium text-uppercase ls-wide opacity-75">
          HackHQ 2026
        </span>
      </div>

      <div className="p-4">
        <div>
          <span className={cx(MONO_LABEL, 'small')}>HACKATHON TEAM</span>
          <h2 className="mt-1 fs-2 fw-bold lh-sm text-break">
            {form.teamName.trim() || 'Your Team Name'}
          </h2>
        </div>

        {form.contact?.city && (
          <div className="mt-2 d-flex align-items-center gap-2 small opacity-75">
            <MapPin size={13} className="text-brand" aria-hidden="true" />
            <span>{form.contact.city}</span>
          </div>
        )}

        <div className="mt-4 border-top border-secondary pt-3" style={{ borderTopStyle: 'dashed' }}>
          <div className="mb-2">
            <span className={cx(MONO_LABEL, 'small')}>ROSTER ({form.members.length}/4)</span>
          </div>
          <ul className="list-unstyled d-flex flex-column gap-1 mb-0">
            {form.members.map((member, idx) => (
              <li
                key={member.id || idx}
                className="d-flex align-items-baseline justify-content-between gap-3 small"
              >
                <span className="text-truncate fw-medium">
                  {member.name.trim() || `Member ${idx + 1}`}
                </span>
                <span className={cx(MONO_LABEL, 'flex-shrink-0')} style={{ fontSize: '0.65rem' }}>
                  {member.role}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {form.interests && form.interests.length > 0 && (
          <div className="mt-3 d-flex flex-wrap gap-2">
            {form.interests.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-pill border border-secondary px-2 py-1 font-monospace text-brand"
                style={{ fontSize: '0.65rem' }}
              >
                #{tag.replace(/\s+/g, '')}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="d-flex align-items-center justify-content-between gap-3 border-top border-secondary px-4 py-3">
        <div
          className={cx(MONO_LABEL, 'd-flex align-items-center gap-2')}
          style={{ fontSize: '0.6rem' }}
        >
          <Shield size={12} aria-hidden="true" />
          <span>OFFICIAL PARTICIPANT BADGE</span>
        </div>
        <span
          className="font-monospace opacity-75"
          style={{ fontSize: '0.6rem' }}
          aria-hidden="true"
        >
          HHQ-{Math.abs(form.teamName.length * 1337)}
        </span>
      </div>
    </div>
  );
}
