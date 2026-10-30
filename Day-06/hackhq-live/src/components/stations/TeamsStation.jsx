import { useState, useId } from 'react';
import { Plus, Trash2, Sparkles, AlertCircle, CheckCircle, FileText, Layers } from 'lucide-react';
import TeamBadgePreview from './TeamBadgePreview.jsx';
import StateXray from '../StateXray.jsx';
import {
  HACKATHON_TRACKS,
  AVAILABLE_INTERESTS,
  MEMBER_ROLES,
  getInitialTeamForm,
  getSampleTeamData,
  validateTeam,
} from '../../lib/validation.js';

export default function TeamsStation({ xrayOn, onToggleXray, onNotify }) {
  // Single form object state architecture (TM-8)
  const [form, setForm] = useState(getInitialTeamForm);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [registeredTeams, setRegisteredTeams] = useState([]);

  // Base useId for accessible input-label association
  const baseId = useId();

  // Pure validation check
  const validationResult = validateTeam(form, registeredTeams);
  const errors = validationResult.errors;

  // Touch tracking handler
  const handleBlur = (fieldKey) => {
    setTouched((prev) => ({ ...prev, [fieldKey]: true }));
  };

  // Helper to check if field error should be rendered
  const showError = (fieldKey) => {
    return (submitted || touched[fieldKey]) && !!errors[fieldKey];
  };

  // Top-level field change handler
  const handleFieldChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Nested contact object field change handler
  const handleContactChange = (subField, value) => {
    setForm((prev) => ({
      ...prev,
      contact: {
        ...prev.contact,
        [subField]: value,
      },
    }));
  };

  // Dynamic Members Array Handlers (TM-2)
  const handleAddMember = () => {
    if (form.members.length >= 4) return;
    const newMember = {
      id: 'm-' + Date.now().toString(36),
      name: '',
      role: 'Fullstack Engineer',
    };
    setForm((prev) => ({
      ...prev,
      members: [...prev.members, newMember],
    }));
  };

  const handleRemoveMember = (idx) => {
    if (form.members.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== idx),
    }));
  };

  const handleMemberChange = (idx, key, value) => {
    setForm((prev) => ({
      ...prev,
      members: prev.members.map((member, i) => (i === idx ? { ...member, [key]: value } : member)),
    }));
  };

  // Interests Array Checkbox Handler (TM-3)
  const handleToggleInterest = (interest) => {
    setForm((prev) => {
      const current = prev.interests || [];
      const updated = current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest];
      return { ...prev, interests: updated };
    });
  };

  // "Fill Sample Team" Action (TM-10)
  const handleFillSample = () => {
    const sample = getSampleTeamData();
    setForm(sample);
    setTouched({});
    setSubmitted(false);
    onNotify('Loaded sample team data', null, 'info');
  };

  // Form Submit Handler (TM-6)
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);

    if (!validationResult.isValid) {
      const firstErrorMessage =
        Object.values(errors)[0] || 'Please correct the highlighted errors.';
      onNotify(firstErrorMessage, null, 'error');
      return;
    }

    // Immutable addition to registered teams list
    const newTeamRecord = {
      ...form,
      id: 'team-' + Date.now().toString(36),
      registeredAt: Date.now(),
    };

    setRegisteredTeams((prev) => [newTeamRecord, ...prev]);
    setForm(getInitialTeamForm());
    setTouched({});
    setSubmitted(false);
    onNotify(`Team "${newTeamRecord.teamName}" registered successfully!`, null, 'success');
  };

  // Remove Registered Team Handler (TM-7)
  const handleRemoveTeam = (teamId) => {
    setRegisteredTeams((prev) => prev.filter((t) => t.id !== teamId));
    onNotify('Team registration removed', null, 'info');
  };

  const statePayload = {
    form,
    touched,
    submitted,
    isValid: validationResult.isValid,
    errors,
    registeredTeamsCount: registeredTeams.length,
    registeredTeams,
  };

  return (
    <div className="station-view station-teams">
      <div className="station-breadcrumb">CONTROL ROOM / TEAMS</div>

      <div className="station-header">
        <div className="station-title-row">
          <h1 className="station-title">Teams</h1>
          <span className="live-status-pill">
            <span className="pulse-dot" aria-hidden="true" />
            <span>Live</span>
          </span>
        </div>
        <div className="station-header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sample-fill"
            onClick={handleFillSample}
            title="Populate form with valid sample team"
          >
            <Sparkles size={16} aria-hidden="true" />
            <span>Fill sample team</span>
          </button>
        </div>
      </div>

      <div className="station-layout teams-station-layout">
        <div className="station-workspace">
          <div className="teams-form-badge-grid">
            {/* Main Controlled Registration Form (TM-1 to TM-8) */}
            <form onSubmit={handleSubmit} className="teams-registration-form" noValidate>
              {/* Field 1: Team Name */}
              <div className="form-field-group">
                <label htmlFor={`${baseId}-name`} className="form-label">
                  Team Name <span className="label-required">*</span>
                </label>
                <input
                  id={`${baseId}-name`}
                  type="text"
                  maxLength={30}
                  placeholder="e.g. Byte Bandits"
                  value={form.teamName}
                  onChange={(e) => handleFieldChange('teamName', e.target.value)}
                  onBlur={() => handleBlur('teamName')}
                  aria-invalid={showError('teamName')}
                  aria-describedby={showError('teamName') ? `${baseId}-name-err` : undefined}
                  className={`form-input ${showError('teamName') ? 'input-error' : ''}`}
                />
                {showError('teamName') && (
                  <p id={`${baseId}-name-err`} className="field-error-text" role="alert">
                    <AlertCircle size={14} aria-hidden="true" />
                    <span>{errors.teamName}</span>
                  </p>
                )}
              </div>

              {/* Field 2: Track Select */}
              <div className="form-field-group">
                <label htmlFor={`${baseId}-track`} className="form-label">
                  Hackathon Track <span className="label-required">*</span>
                </label>
                <select
                  id={`${baseId}-track`}
                  value={form.track}
                  onChange={(e) => handleFieldChange('track', e.target.value)}
                  onBlur={() => handleBlur('track')}
                  className="form-select"
                >
                  {HACKATHON_TRACKS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nested Contact Object Fields */}
              <div className="contact-fieldset">
                <div className="fieldset-legend">Contact Information</div>

                <div className="contact-grid">
                  <div className="form-field-group">
                    <label htmlFor={`${baseId}-email`} className="form-label">
                      Contact Email <span className="label-required">*</span>
                    </label>
                    <input
                      id={`${baseId}-email`}
                      type="email"
                      placeholder="team-lead@example.com"
                      value={form.contact.email}
                      onChange={(e) => handleContactChange('email', e.target.value)}
                      onBlur={() => handleBlur('contact.email')}
                      aria-invalid={showError('contact.email')}
                      aria-describedby={
                        showError('contact.email') ? `${baseId}-email-err` : undefined
                      }
                      className={`form-input ${showError('contact.email') ? 'input-error' : ''}`}
                    />
                    {showError('contact.email') && (
                      <p id={`${baseId}-email-err`} className="field-error-text" role="alert">
                        <AlertCircle size={14} aria-hidden="true" />
                        <span>{errors['contact.email']}</span>
                      </p>
                    )}
                  </div>

                  <div className="form-field-group">
                    <label htmlFor={`${baseId}-phone`} className="form-label">
                      Phone Number <span className="label-optional">(Optional)</span>
                    </label>
                    <input
                      id={`${baseId}-phone`}
                      type="tel"
                      placeholder="10-digit number (e.g. 9876543210)"
                      value={form.contact.phone}
                      onChange={(e) => handleContactChange('phone', e.target.value)}
                      onBlur={() => handleBlur('contact.phone')}
                      aria-invalid={showError('contact.phone')}
                      aria-describedby={
                        showError('contact.phone') ? `${baseId}-phone-err` : undefined
                      }
                      className={`form-input ${showError('contact.phone') ? 'input-error' : ''}`}
                    />
                    {showError('contact.phone') && (
                      <p id={`${baseId}-phone-err`} className="field-error-text" role="alert">
                        <AlertCircle size={14} aria-hidden="true" />
                        <span>{errors['contact.phone']}</span>
                      </p>
                    )}
                  </div>

                  <div className="form-field-group full-width">
                    <label htmlFor={`${baseId}-city`} className="form-label">
                      City / Location <span className="label-required">*</span>
                    </label>
                    <input
                      id={`${baseId}-city`}
                      type="text"
                      placeholder="e.g. Bengaluru, IN"
                      value={form.contact.city}
                      onChange={(e) => handleContactChange('city', e.target.value)}
                      onBlur={() => handleBlur('contact.city')}
                      aria-invalid={showError('contact.city')}
                      aria-describedby={
                        showError('contact.city') ? `${baseId}-city-err` : undefined
                      }
                      className={`form-input ${showError('contact.city') ? 'input-error' : ''}`}
                    />
                    {showError('contact.city') && (
                      <p id={`${baseId}-city-err`} className="field-error-text" role="alert">
                        <AlertCircle size={14} aria-hidden="true" />
                        <span>{errors['contact.city']}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Members Section (TM-2: 1 to 4 rows) */}
              <div className="members-fieldset">
                <div className="members-header">
                  <div className="members-legend">Team Members ({form.members.length}/4)</div>
                  <button
                    type="button"
                    className="btn btn-add-member"
                    onClick={handleAddMember}
                    disabled={form.members.length >= 4}
                    title={
                      form.members.length >= 4 ? 'Maximum 4 members reached' : 'Add another member'
                    }
                  >
                    <Plus size={16} aria-hidden="true" />
                    <span>Add Member</span>
                  </button>
                </div>

                <div className="members-rows-container">
                  {form.members.map((member, idx) => {
                    const memberErrKey = `members.${idx}.name`;
                    const hasMemberErr = showError(memberErrKey);

                    return (
                      <div key={member.id || idx} className="member-row">
                        <div className="member-index-badge" aria-hidden="true">
                          #{idx + 1}
                        </div>

                        <div className="member-name-field">
                          <label htmlFor={`${baseId}-mem-name-${idx}`} className="sr-only">
                            Member {idx + 1} Name
                          </label>
                          <input
                            id={`${baseId}-mem-name-${idx}`}
                            type="text"
                            placeholder="Full Name"
                            value={member.name}
                            onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                            onBlur={() => handleBlur(memberErrKey)}
                            aria-invalid={hasMemberErr}
                            className={`form-input ${hasMemberErr ? 'input-error' : ''}`}
                          />
                        </div>

                        <div className="member-role-field">
                          <label htmlFor={`${baseId}-mem-role-${idx}`} className="sr-only">
                            Member {idx + 1} Role
                          </label>
                          <select
                            id={`${baseId}-mem-role-${idx}`}
                            value={member.role}
                            onChange={(e) => handleMemberChange(idx, 'role', e.target.value)}
                            className="form-select member-select"
                          >
                            {MEMBER_ROLES.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          className="btn btn-remove-member"
                          onClick={() => handleRemoveMember(idx)}
                          disabled={form.members.length <= 1}
                          title={
                            form.members.length <= 1
                              ? 'At least 1 member is required'
                              : 'Remove member'
                          }
                          aria-label={`Remove Member ${idx + 1}`}
                        >
                          <Trash2 size={16} />
                        </button>

                        {hasMemberErr && (
                          <p className="field-error-text member-error-span" role="alert">
                            <AlertCircle size={14} aria-hidden="true" />
                            <span>{errors[memberErrKey]}</span>
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Interests Checkboxes (TM-3) */}
              <div className="interests-fieldset">
                <span className="form-label">Tech Stack & Topic Interests</span>
                <div className="interests-grid">
                  {AVAILABLE_INTERESTS.map((interest) => {
                    const isChecked = form.interests.includes(interest);
                    const chkId = `${baseId}-int-${interest.replace(/\s+/g, '-').toLowerCase()}`;

                    return (
                      <label key={interest} htmlFor={chkId} className="interest-checkbox-card">
                        <input
                          id={chkId}
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleInterest(interest)}
                          className="interest-native-chk"
                        />
                        <span className="interest-label-text">{interest}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Agreement Checkbox (TM-4) */}
              <div className="agreement-fieldset">
                <label htmlFor={`${baseId}-agreed`} className="agreement-label">
                  <input
                    id={`${baseId}-agreed`}
                    type="checkbox"
                    checked={form.agreed}
                    onChange={(e) => handleFieldChange('agreed', e.target.checked)}
                    onBlur={() => handleBlur('agreed')}
                    className="agreement-native-chk"
                  />
                  <span>
                    Our team agrees to the HackHQ Participant Code of Conduct and venue guidelines.{' '}
                    <span className="label-required">*</span>
                  </span>
                </label>
                {showError('agreed') && (
                  <p className="field-error-text" role="alert">
                    <AlertCircle size={14} aria-hidden="true" />
                    <span>{errors.agreed}</span>
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="form-submit-row">
                <button type="submit" className="btn btn-primary btn-submit-team">
                  <CheckCircle size={18} aria-hidden="true" />
                  <span>Register Team</span>
                </button>
              </div>
            </form>

            {/* Live Name Badge Preview (TM-9) */}
            <div className="team-badge-preview-column">
              <div className="badge-preview-heading">Live Badge Preview</div>
              <TeamBadgePreview form={form} />
            </div>
          </div>

          {/* Registered Teams Table / List (TM-7) */}
          <div className="registered-teams-section">
            <div className="registered-teams-header">
              <div className="registered-title-wrap">
                <Layers size={18} className="text-lanyard" aria-hidden="true" />
                <h2 className="registered-title">Registered Teams ({registeredTeams.length})</h2>
              </div>
            </div>

            {registeredTeams.length === 0 ? (
              <div className="registered-empty-card">
                <FileText size={24} className="empty-icon" aria-hidden="true" />
                <p>No teams registered yet. Submit the form above to register your squad.</p>
              </div>
            ) : (
              <div className="registered-teams-grid">
                {registeredTeams.map((team) => (
                  <div key={team.id} className="registered-team-item">
                    <div className="reg-team-header">
                      <h3 className="reg-team-name">{team.teamName}</h3>
                      <button
                        type="button"
                        onClick={() => handleRemoveTeam(team.id)}
                        className="btn btn-remove-reg-team"
                        title="Remove registered team"
                        aria-label={`Remove team ${team.teamName}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="reg-team-meta">
                      <span className="reg-track-badge">
                        {HACKATHON_TRACKS.find((t) => t.id === team.track)?.name}
                      </span>
                      <span className="reg-city-badge">{team.contact.city}</span>
                    </div>
                    <div className="reg-members-summary">
                      <strong>Members ({team.members.length}):</strong>{' '}
                      {team.members
                        .map((m) => m.name)
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <StateXray
          isOpen={xrayOn}
          stationName="Teams"
          statePayload={statePayload}
          onClose={onToggleXray}
        />
      </div>
    </div>
  );
}
