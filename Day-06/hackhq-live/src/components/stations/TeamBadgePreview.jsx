import { HACKATHON_TRACKS } from '../../lib/validation.js';
import { Shield, MapPin } from 'lucide-react';

export default function TeamBadgePreview({ form }) {
  const currentTrack = HACKATHON_TRACKS.find((t) => t.id === form.track) || HACKATHON_TRACKS[0];

  const hasContent =
    form.teamName.trim().length > 0 || form.members.some((m) => m.name.trim().length > 0);

  return (
    <div
      className={`team-badge-card ${hasContent ? 'has-data' : 'is-empty'}`}
      aria-label="Live Team Lanyard Badge Preview"
    >
      <div className="badge-lanyard-hole" aria-hidden="true">
        <div className="badge-slot-punch" />
      </div>

      <div className="badge-track-banner" style={{ backgroundColor: currentTrack.color }}>
        <span className="badge-track-label">{currentTrack.name}</span>
        <span className="badge-year-tag">HackHQ 2026</span>
      </div>

      <div className="badge-body">
        <div className="badge-team-name-wrap">
          <span className="badge-type-label">HACKATHON TEAM</span>
          <h2 className="badge-team-name">{form.teamName.trim() || 'Your Team Name'}</h2>
        </div>

        {form.contact?.city && (
          <div className="badge-location-row">
            <MapPin size={13} className="badge-loc-icon" aria-hidden="true" />
            <span className="badge-location-text">{form.contact.city}</span>
          </div>
        )}

        <div className="badge-roster-section">
          <div className="badge-roster-header">
            <span className="roster-title">ROSTER ({form.members.length}/4)</span>
          </div>
          <ul className="badge-member-list">
            {form.members.map((member, idx) => (
              <li key={member.id || idx} className="badge-member-item">
                <span className="badge-member-name">
                  {member.name.trim() || `Member ${idx + 1}`}
                </span>
                <span className="badge-member-role">{member.role}</span>
              </li>
            ))}
          </ul>
        </div>

        {form.interests && form.interests.length > 0 && (
          <div className="badge-tags-row">
            {form.interests.slice(0, 3).map((tag) => (
              <span key={tag} className="badge-interest-pill">
                #{tag.replace(/\s+/g, '')}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="badge-footer">
        <div className="badge-security-strip">
          <Shield size={12} aria-hidden="true" />
          <span>OFFICIAL PARTICIPANT BADGE</span>
        </div>
        <div className="badge-barcode" aria-hidden="true">
          <div className="barcode-bars" />
          <span className="barcode-text">HHQ-{Math.abs(form.teamName.length * 1337)}</span>
        </div>
      </div>
    </div>
  );
}
