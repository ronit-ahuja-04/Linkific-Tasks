import { useState, useId } from 'react';
import { Plus, Trash2, Sparkles, AlertCircle, CheckCircle, FileText, Layers } from 'lucide-react';
import TeamBadgePreview from './TeamBadgePreview.jsx';
import StateXray from '../StateXray.jsx';
import PageHeader from '../layout/PageHeader.jsx';
import { Form, Row, Col, Alert } from 'react-bootstrap';
import { Badge, Button, Card, Eyebrow, cx } from '../ui.jsx';
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

      <div className="d-flex flex-column flex-lg-row align-items-lg-start gap-4">
        <div className="flex-grow-1 min-w-0 d-flex flex-column gap-4">
          <Row className="g-4 align-items-start">
            {/* Main Controlled Registration Form (TM-1 to TM-8) */}
            <Col xs={12} xl={8}>
              <Card as="form" onSubmit={handleSubmit} className="p-3 p-sm-4" noValidate>
                <div className="d-flex flex-column gap-4">
                  {/* Field 1: Team Name */}
                  <Form.Group>
                    <Form.Label htmlFor={`${baseId}-name`} className="fw-medium">
                      Team Name <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      id={`${baseId}-name`}
                      type="text"
                      maxLength={30}
                      placeholder="e.g. Byte Bandits"
                      value={form.teamName}
                      onChange={(e) => handleFieldChange('teamName', e.target.value)}
                      onBlur={() => handleBlur('teamName')}
                      isInvalid={showError('teamName')}
                      aria-invalid={showError('teamName')}
                      aria-describedby={showError('teamName') ? `${baseId}-name-err` : undefined}
                    />
                    {showError('teamName') && (
                      <FieldError id={`${baseId}-name-err`}>{errors.teamName}</FieldError>
                    )}
                  </Form.Group>

                  {/* Field 2: Track Select */}
                  <Form.Group>
                    <Form.Label htmlFor={`${baseId}-track`} className="fw-medium">
                      Hackathon Track <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      id={`${baseId}-track`}
                      value={form.track}
                      onChange={(e) => handleFieldChange('track', e.target.value)}
                      onBlur={() => handleBlur('track')}
                    >
                      {HACKATHON_TRACKS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  {/* Nested Contact Object Fields */}
                  <fieldset className="rounded-4 border bg-body-tertiary p-3">
                    <Eyebrow className="mb-3">Contact Information</Eyebrow>

                    <Row className="g-3">
                      <Col xs={12} sm={6}>
                        <Form.Group>
                          <Form.Label htmlFor={`${baseId}-email`} className="fw-medium">
                            Contact Email <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            id={`${baseId}-email`}
                            type="email"
                            placeholder="team-lead@example.com"
                            value={form.contact.email}
                            onChange={(e) => handleContactChange('email', e.target.value)}
                            onBlur={() => handleBlur('contact.email')}
                            isInvalid={showError('contact.email')}
                            aria-invalid={showError('contact.email')}
                            aria-describedby={
                              showError('contact.email') ? `${baseId}-email-err` : undefined
                            }
                          />
                          {showError('contact.email') && (
                            <FieldError id={`${baseId}-email-err`}>
                              {errors['contact.email']}
                            </FieldError>
                          )}
                        </Form.Group>
                      </Col>

                      <Col xs={12} sm={6}>
                        <Form.Group>
                          <Form.Label htmlFor={`${baseId}-phone`} className="fw-medium">
                            Phone Number{' '}
                            <span className="fw-normal text-body-secondary">(Optional)</span>
                          </Form.Label>
                          <Form.Control
                            id={`${baseId}-phone`}
                            type="tel"
                            placeholder="10-digit number (e.g. 9876543210)"
                            value={form.contact.phone}
                            onChange={(e) => handleContactChange('phone', e.target.value)}
                            onBlur={() => handleBlur('contact.phone')}
                            isInvalid={showError('contact.phone')}
                            aria-invalid={showError('contact.phone')}
                            aria-describedby={
                              showError('contact.phone') ? `${baseId}-phone-err` : undefined
                            }
                          />
                          {showError('contact.phone') && (
                            <FieldError id={`${baseId}-phone-err`}>
                              {errors['contact.phone']}
                            </FieldError>
                          )}
                        </Form.Group>
                      </Col>

                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label htmlFor={`${baseId}-city`} className="fw-medium">
                            City / Location <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            id={`${baseId}-city`}
                            type="text"
                            placeholder="e.g. Bengaluru, IN"
                            value={form.contact.city}
                            onChange={(e) => handleContactChange('city', e.target.value)}
                            onBlur={() => handleBlur('contact.city')}
                            isInvalid={showError('contact.city')}
                            aria-invalid={showError('contact.city')}
                            aria-describedby={
                              showError('contact.city') ? `${baseId}-city-err` : undefined
                            }
                          />
                          {showError('contact.city') && (
                            <FieldError id={`${baseId}-city-err`}>
                              {errors['contact.city']}
                            </FieldError>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>
                  </fieldset>

                  {/* Dynamic Members Section (TM-2: 1 to 4 rows) */}
                  <div>
                    <div className="mb-3 d-flex align-items-center justify-content-between gap-3">
                      <Eyebrow>Team Members ({form.members.length}/4)</Eyebrow>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleAddMember}
                        disabled={form.members.length >= 4}
                        title={
                          form.members.length >= 4
                            ? 'Maximum 4 members reached'
                            : 'Add another member'
                        }
                      >
                        <Plus size={16} aria-hidden="true" />
                        <span>Add Member</span>
                      </Button>
                    </div>

                    <div className="d-flex flex-column gap-3">
                      {form.members.map((member, idx) => {
                        const memberErrKey = `members.${idx}.name`;
                        const hasMemberErr = showError(memberErrKey);

                        return (
                          <Row key={member.id || idx} className="g-2 align-items-start">
                            <Col xs="auto">
                              <div
                                className="d-flex align-items-center justify-content-center rounded-3 bg-body-secondary font-monospace small text-body-secondary"
                                style={{ width: '2.375rem', height: '2.375rem' }}
                                aria-hidden="true"
                              >
                                #{idx + 1}
                              </div>
                            </Col>

                            <Col>
                              <Form.Label htmlFor={`${baseId}-mem-name-${idx}`} visuallyHidden>
                                Member {idx + 1} Name
                              </Form.Label>
                              <Form.Control
                                id={`${baseId}-mem-name-${idx}`}
                                type="text"
                                placeholder="Full Name"
                                value={member.name}
                                onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                                onBlur={() => handleBlur(memberErrKey)}
                                isInvalid={hasMemberErr}
                                aria-invalid={hasMemberErr}
                              />
                            </Col>

                            <Col xs="auto" className="order-sm-last">
                              <Button
                                variant="danger"
                                className="p-0"
                                style={{ width: '2.375rem', height: '2.375rem' }}
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
                            </Col>

                            <Col xs={12} sm={4} className="order-last order-sm-0">
                              <Form.Label htmlFor={`${baseId}-mem-role-${idx}`} visuallyHidden>
                                Member {idx + 1} Role
                              </Form.Label>
                              <Form.Select
                                id={`${baseId}-mem-role-${idx}`}
                                value={member.role}
                                onChange={(e) => handleMemberChange(idx, 'role', e.target.value)}
                              >
                                {MEMBER_ROLES.map((role) => (
                                  <option key={role} value={role}>
                                    {role}
                                  </option>
                                ))}
                              </Form.Select>
                            </Col>

                            {hasMemberErr && (
                              <Col xs={12}>
                                <FieldError>{errors[memberErrKey]}</FieldError>
                              </Col>
                            )}
                          </Row>
                        );
                      })}
                    </div>
                  </div>

                  {/* Interests Checkboxes (TM-3) */}
                  <div>
                    <span className="d-block mb-2 fw-medium">Tech Stack & Topic Interests</span>
                    <Row className="row-cols-2 row-cols-sm-3 g-2">
                      {AVAILABLE_INTERESTS.map((interest) => {
                        const isChecked = form.interests.includes(interest);
                        const chkId = `${baseId}-int-${interest
                          .replace(/\s+/g, '-')
                          .toLowerCase()}`;

                        return (
                          <Col key={interest}>
                            <Form.Check
                              id={chkId}
                              type="checkbox"
                              label={interest}
                              checked={isChecked}
                              onChange={() => handleToggleInterest(interest)}
                              className={cx(
                                'h-100 rounded-3 border py-2 pe-2 small',
                                isChecked ? 'border-primary bg-primary-subtle' : 'bg-body'
                              )}
                              style={{ paddingLeft: '2.25rem' }}
                            />
                          </Col>
                        );
                      })}
                    </Row>
                  </div>

                  {/* Agreement Checkbox (TM-4) */}
                  <Form.Group>
                    <Form.Check
                      id={`${baseId}-agreed`}
                      type="checkbox"
                      checked={form.agreed}
                      onChange={(e) => handleFieldChange('agreed', e.target.checked)}
                      onBlur={() => handleBlur('agreed')}
                      isInvalid={showError('agreed')}
                      label={
                        <>
                          Our team agrees to the HackHQ Participant Code of Conduct and venue
                          guidelines. <span className="text-danger">*</span>
                        </>
                      }
                    />
                    {showError('agreed') && <FieldError>{errors.agreed}</FieldError>}
                  </Form.Group>

                  {/* Submit Button */}
                  <div className="d-grid d-sm-flex justify-content-sm-end border-top pt-4">
                    <Button type="submit" variant="primary" size="lg">
                      <CheckCircle size={18} aria-hidden="true" />
                      <span>Register Team</span>
                    </Button>
                  </div>
                </div>
              </Card>
            </Col>

            {/* Live Name Badge Preview (TM-9) */}
            <Col xs={12} xl={4}>
              <div className="sticky-xl-top" style={{ top: '1rem' }}>
                <Eyebrow className="mb-3">Live Badge Preview</Eyebrow>
                <TeamBadgePreview form={form} />
              </div>
            </Col>
          </Row>

          {/* Registered Teams Table / List (TM-7) */}
          <section>
            <div className="mb-3 d-flex align-items-center gap-2">
              <Layers size={18} className="text-primary" aria-hidden="true" />
              <h2 className="fs-4 fw-bold mb-0">Registered Teams ({registeredTeams.length})</h2>
            </div>

            {registeredTeams.length === 0 ? (
              <Alert
                variant="secondary"
                className="d-flex flex-column align-items-center gap-2 py-4 text-center mb-0"
                style={{ borderStyle: 'dashed' }}
              >
                <FileText size={24} aria-hidden="true" />
                <p className="mb-0">
                  No teams registered yet. Submit the form above to register your squad.
                </p>
              </Alert>
            ) : (
              <Row className="row-cols-1 row-cols-md-2 g-3">
                {registeredTeams.map((team) => (
                  <Col key={team.id}>
                    <Card className="animate-pop h-100 p-3">
                      <div className="d-flex align-items-start justify-content-between gap-3">
                        <h3 className="fs-5 fw-bold mb-0 text-break">{team.teamName}</h3>
                        <Button
                          variant="danger"
                          size="sm"
                          className="flex-shrink-0"
                          onClick={() => handleRemoveTeam(team.id)}
                          title="Remove registered team"
                          aria-label={`Remove team ${team.teamName}`}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                      <div className="mt-3 d-flex flex-wrap gap-2">
                        <Badge tone="accent">
                          {HACKATHON_TRACKS.find((t) => t.id === team.track)?.name}
                        </Badge>
                        <Badge>{team.contact.city}</Badge>
                      </div>
                      <div className="mt-3 small text-body-secondary">
                        <strong className="fw-semibold text-body">
                          Members ({team.members.length}):
                        </strong>{' '}
                        {team.members
                          .map((m) => m.name)
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
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
    <Form.Control.Feedback
      type="invalid"
      id={id}
      role="alert"
      className={cx('d-flex align-items-center gap-2 fw-medium', className)}
    >
      <AlertCircle size={14} aria-hidden="true" />
      <span>{children}</span>
    </Form.Control.Feedback>
  );
}
