import { useState, useId } from 'react';
import { Plus, Trash2, Sparkles, AlertCircle, CheckCircle, FileText, Layers } from 'lucide-react';
import TeamBadgePreview from './TeamBadgePreview.jsx';
import StateXray from '../StateXray.jsx';
import PageHeader from '../layout/PageHeader.jsx';
import { Badge, Button, Card, Eyebrow, cx, errorClass, inputClass, labelClass } from '../ui.jsx';
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
    <div className="animate-fade">
      <PageHeader breadcrumb="Teams" title="Teams" pill="Live">
        <Button
          variant="secondary"
          onClick={handleFillSample}
          title="Populate form with valid sample team"
        >
          <Sparkles size={16} aria-hidden="true" />
          <span>Fill sample team</span>
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-8">
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            {/* Main Controlled Registration Form (TM-1 to TM-8) */}
            <Card as="form" onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-7" noValidate>
              {/* Field 1: Team Name */}
              <div>
                <label htmlFor={`${baseId}-name`} className={labelClass}>
                  Team Name <span className="text-bad">*</span>
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
                  className={inputClass}
                />
                {showError('teamName') && (
                  <FieldError id={`${baseId}-name-err`}>{errors.teamName}</FieldError>
                )}
              </div>

              {/* Field 2: Track Select */}
              <div>
                <label htmlFor={`${baseId}-track`} className={labelClass}>
                  Hackathon Track <span className="text-bad">*</span>
                </label>
                <select
                  id={`${baseId}-track`}
                  value={form.track}
                  onChange={(e) => handleFieldChange('track', e.target.value)}
                  onBlur={() => handleBlur('track')}
                  className={inputClass}
                >
                  {HACKATHON_TRACKS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nested Contact Object Fields */}
              <div className="rounded-2xl border border-line bg-surface-2/50 p-4 sm:p-5">
                <Eyebrow className="mb-4">Contact Information</Eyebrow>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`${baseId}-email`} className={labelClass}>
                      Contact Email <span className="text-bad">*</span>
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
                      className={inputClass}
                    />
                    {showError('contact.email') && (
                      <FieldError id={`${baseId}-email-err`}>{errors['contact.email']}</FieldError>
                    )}
                  </div>

                  <div>
                    <label htmlFor={`${baseId}-phone`} className={labelClass}>
                      Phone Number <span className="font-normal text-muted">(Optional)</span>
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
                      className={inputClass}
                    />
                    {showError('contact.phone') && (
                      <FieldError id={`${baseId}-phone-err`}>{errors['contact.phone']}</FieldError>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor={`${baseId}-city`} className={labelClass}>
                      City / Location <span className="text-bad">*</span>
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
                      className={inputClass}
                    />
                    {showError('contact.city') && (
                      <FieldError id={`${baseId}-city-err`}>{errors['contact.city']}</FieldError>
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Members Section (TM-2: 1 to 4 rows) */}
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <Eyebrow>Team Members ({form.members.length}/4)</Eyebrow>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleAddMember}
                    disabled={form.members.length >= 4}
                    title={
                      form.members.length >= 4 ? 'Maximum 4 members reached' : 'Add another member'
                    }
                  >
                    <Plus size={16} aria-hidden="true" />
                    <span>Add Member</span>
                  </Button>
                </div>

                <div className="space-y-3">
                  {form.members.map((member, idx) => {
                    const memberErrKey = `members.${idx}.name`;
                    const hasMemberErr = showError(memberErrKey);

                    return (
                      <div
                        key={member.id || idx}
                        className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,12rem)_auto] sm:gap-3"
                      >
                        <div
                          className="flex size-9 items-center justify-center rounded-lg bg-surface-2 font-mono text-xs text-muted"
                          aria-hidden="true"
                        >
                          #{idx + 1}
                        </div>

                        <div>
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
                            className={inputClass}
                          />
                        </div>

                        <div className="order-last col-span-3 sm:order-none sm:col-span-1">
                          <label htmlFor={`${baseId}-mem-role-${idx}`} className="sr-only">
                            Member {idx + 1} Role
                          </label>
                          <select
                            id={`${baseId}-mem-role-${idx}`}
                            value={member.role}
                            onChange={(e) => handleMemberChange(idx, 'role', e.target.value)}
                            className={inputClass}
                          >
                            {MEMBER_ROLES.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        </div>

                        <Button
                          variant="danger"
                          className="size-9 !p-0"
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
                        </Button>

                        {hasMemberErr && (
                          <FieldError className="col-span-full">{errors[memberErrKey]}</FieldError>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Interests Checkboxes (TM-3) */}
              <div>
                <span className={labelClass}>Tech Stack & Topic Interests</span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {AVAILABLE_INTERESTS.map((interest) => {
                    const isChecked = form.interests.includes(interest);
                    const chkId = `${baseId}-int-${interest.replace(/\s+/g, '-').toLowerCase()}`;

                    return (
                      <label
                        key={interest}
                        htmlFor={chkId}
                        className="flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink transition hover:bg-surface-2 has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-accent-soft"
                      >
                        <input
                          id={chkId}
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleInterest(interest)}
                          className="size-4 shrink-0 accent-[var(--color-accent)]"
                        />
                        <span>{interest}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Agreement Checkbox (TM-4) */}
              <div>
                <label
                  htmlFor={`${baseId}-agreed`}
                  className="flex cursor-pointer items-start gap-3 text-sm text-ink"
                >
                  <input
                    id={`${baseId}-agreed`}
                    type="checkbox"
                    checked={form.agreed}
                    onChange={(e) => handleFieldChange('agreed', e.target.checked)}
                    onBlur={() => handleBlur('agreed')}
                    className="mt-0.5 size-4 shrink-0 accent-[var(--color-accent)]"
                  />
                  <span>
                    Our team agrees to the HackHQ Participant Code of Conduct and venue guidelines.{' '}
                    <span className="text-bad">*</span>
                  </span>
                </label>
                {showError('agreed') && <FieldError>{errors.agreed}</FieldError>}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end border-t border-line pt-5">
                <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto">
                  <CheckCircle size={18} aria-hidden="true" />
                  <span>Register Team</span>
                </Button>
              </div>
            </Card>

            {/* Live Name Badge Preview (TM-9) */}
            <div className="xl:sticky xl:top-6">
              <Eyebrow className="mb-3">Live Badge Preview</Eyebrow>
              <TeamBadgePreview form={form} />
            </div>
          </div>

          {/* Registered Teams Table / List (TM-7) */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Layers size={18} className="text-accent" aria-hidden="true" />
              <h2 className="text-xl font-bold">Registered Teams ({registeredTeams.length})</h2>
            </div>

            {registeredTeams.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line px-6 py-10 text-center text-sm text-muted">
                <FileText size={24} aria-hidden="true" />
                <p>No teams registered yet. Submit the form above to register your squad.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {registeredTeams.map((team) => (
                  <Card key={team.id} className="animate-pop p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="min-w-0 break-words text-lg font-bold">{team.teamName}</h3>
                      <Button
                        variant="danger"
                        size="sm"
                        className="shrink-0"
                        onClick={() => handleRemoveTeam(team.id)}
                        title="Remove registered team"
                        aria-label={`Remove team ${team.teamName}`}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge tone="accent">
                        {HACKATHON_TRACKS.find((t) => t.id === team.track)?.name}
                      </Badge>
                      <Badge>{team.contact.city}</Badge>
                    </div>
                    <div className="mt-3 text-sm text-muted">
                      <strong className="font-semibold text-ink">
                        Members ({team.members.length}):
                      </strong>{' '}
                      {team.members
                        .map((m) => m.name)
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
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

function FieldError({ id, className, children }) {
  return (
    <p id={id} className={cx(errorClass, 'flex items-center gap-1.5', className)} role="alert">
      <AlertCircle size={14} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
