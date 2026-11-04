import { useState, useId } from 'react';
import { Plus, Trash2, Sparkles, AlertCircle, CheckCircle, FileText, Layers } from 'lucide-react';
import TeamBadgePreview from './TeamBadgePreview.jsx';
import StateXray from '../StateXray.jsx';
import PageHeader from '../layout/PageHeader.jsx';
import styled, { css } from 'styled-components';
import {
  Badge,
  Button,
  Card,
  CheckRow,
  Eyebrow,
  FormGroup,
  Grid,
  Input,
  Label,
  Muted,
  Select,
  Stack,
} from '../ui.jsx';
import { animateFade, animatePop } from '../../styles/animations.js';
import {
  HACKATHON_TRACKS,
  AVAILABLE_INTERESTS,
  MEMBER_ROLES,
  getInitialTeamForm,
  getSampleTeamData,
  validateTeam,
} from '../../lib/validation.js';

const hidden = css`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
const Page = styled.div`
  ${animateFade}
`;
const Layout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  ${({ theme }) => theme.media.up('lg')} {
    flex-direction: row;
    align-items: flex-start;
  }
`;
const Main = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;
const FormGrid = styled.div`
  display: grid;
  gap: 1rem;
  align-items: start;
  grid-template-columns: minmax(0, 1fr);
  ${({ theme }) => theme.media.up('xl')} {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  }
`;
const FormCard = styled(Card)`
  padding: 1rem;
  ${({ theme }) => theme.media.up('sm')} {
    padding: 1.5rem;
  }
`;
const Req = styled.span`
  color: ${({ theme }) => theme.colors.bad};
`;
const FieldLabel = styled(Label)`
  font-weight: 500;
`;
const Optional = styled(Muted)`
  font-weight: 400;
`;
const Fieldset = styled.fieldset`
  margin: 0;
  min-width: 0;
  border-radius: 1rem;
  padding: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.line};
  background: ${({ theme }) => theme.colors.surface2};
  > p {
    margin-bottom: 0.75rem;
  }
`;
const SpanAll = styled.div`
  grid-column: 1 / -1;
  min-width: 0;
`;
const SectionHead = styled.div`
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
`;
const MemberRow = styled.div`
  display: grid;
  gap: 0.5rem;
  align-items: start;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas: 'num name del' 'role role role' 'err err err';
  ${({ theme }) => theme.media.up('sm')} {
    grid-template-columns: auto minmax(0, 1fr) minmax(0, 1fr) auto;
    grid-template-areas: 'num name role del' 'err err err err';
  }
`;
const MemberNum = styled.div`
  grid-area: num;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.375rem;
  height: 2.375rem;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface2};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.muted};
`;
const HiddenLabel = styled.label`
  ${hidden}
`;
const DelBtn = styled(Button)`
  grid-area: del;
  padding: 0;
  width: 2.375rem;
  height: 2.375rem;
`;
const InterestGrid = styled.div`
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  ${({ theme }) => theme.media.up('sm')} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;
const InterestChip = styled(CheckRow)`
  height: 100%;
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 0.5rem;
  font-size: 0.875rem;
  border: 1px solid ${({ theme, $checked }) => ($checked ? theme.colors.accent : theme.colors.line)};
  background: ${({ theme, $checked }) => ($checked ? theme.colors.accentSoft : theme.colors.surface)};
`;
const SubmitRow = styled.div`
  display: grid;
  border-top: 1px solid ${({ theme }) => theme.colors.line};
  padding-top: 1.5rem;
  ${({ theme }) => theme.media.up('sm')} {
    display: flex;
    justify-content: flex-end;
  }
`;
const Sticky = styled.div`
  ${({ theme }) => theme.media.up('xl')} {
    position: sticky;
    top: 1rem;
  }
  > p {
    margin-bottom: 0.75rem;
  }
`;
const ListHead = styled.div`
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  svg {
    color: ${({ theme }) => theme.colors.accent};
  }
  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
  }
`;
const EmptyBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem;
  text-align: center;
  border: 1px dashed ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface2};
  color: ${({ theme }) => theme.colors.muted};
  p {
    margin: 0;
  }
`;
const TeamCard = styled(Card)`
  height: 100%;
  padding: 1rem;
  ${animatePop}
  h3 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
    overflow-wrap: anywhere;
  }
`;
const RemoveBtn = styled(Button)`
  flex-shrink: 0;
`;
const Members = styled.div`
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.muted};
  strong {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.ink};
  }
`;
const FieldErr = styled.p`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.bad};
`;

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

  const textField = ({
    key,
    id,
    label,
    required,
    optional,
    type = 'text',
    placeholder,
    value,
    onChange,
    maxLength,
  }) => {
    const err = showError(key);
    return (
      <FormGroup>
        <FieldLabel htmlFor={id}>
          {label} {required && <Req>*</Req>}
          {optional && <Optional>(Optional)</Optional>}
        </FieldLabel>
        <Input
          id={id}
          type={type}
          maxLength={maxLength}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => handleBlur(key)}
          $invalid={err}
          aria-invalid={err}
          aria-describedby={err ? `${id}-err` : undefined}
        />
        {err && <FieldError id={`${id}-err`}>{errors[key]}</FieldError>}
      </FormGroup>
    );
  };

  return (
    <Page>
      <PageHeader breadcrumb="Teams" title="Teams" pill="Live">
        <Button
          $variant="secondary"
          onClick={handleFillSample}
          title="Populate form with valid sample team"
        >
          <Sparkles size={16} aria-hidden="true" />
          <span>Fill sample team</span>
        </Button>
      </PageHeader>

      <Layout>
        <Main>
          <FormGrid>
            {/* Main Controlled Registration Form (TM-1 to TM-8) */}
            <FormCard as="form" onSubmit={handleSubmit} noValidate>
              <Stack $gap={4}>
                {/* Field 1: Team Name */}
                {textField({
                  key: 'teamName',
                  id: `${baseId}-name`,
                  label: 'Team Name',
                  required: true,
                  maxLength: 30,
                  placeholder: 'e.g. Byte Bandits',
                  value: form.teamName,
                  onChange: (v) => handleFieldChange('teamName', v),
                })}

                {/* Field 2: Track Select */}
                <FormGroup>
                  <FieldLabel htmlFor={`${baseId}-track`}>
                    Hackathon Track <Req>*</Req>
                  </FieldLabel>
                  <Select
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
                  </Select>
                </FormGroup>

                {/* Nested Contact Object Fields */}
                <Fieldset>
                  <Eyebrow>Contact Information</Eyebrow>

                  <Grid $cols={{ base: 1, sm: 2 }} $gap={3}>
                    {textField({
                      key: 'contact.email',
                      id: `${baseId}-email`,
                      label: 'Contact Email',
                      required: true,
                      type: 'email',
                      placeholder: 'team-lead@example.com',
                      value: form.contact.email,
                      onChange: (v) => handleContactChange('email', v),
                    })}
                    {textField({
                      key: 'contact.phone',
                      id: `${baseId}-phone`,
                      label: 'Phone Number',
                      optional: true,
                      type: 'tel',
                      placeholder: '10-digit number (e.g. 9876543210)',
                      value: form.contact.phone,
                      onChange: (v) => handleContactChange('phone', v),
                    })}
                    <SpanAll>
                      {textField({
                        key: 'contact.city',
                        id: `${baseId}-city`,
                        label: 'City / Location',
                        required: true,
                        placeholder: 'e.g. Bengaluru, IN',
                        value: form.contact.city,
                        onChange: (v) => handleContactChange('city', v),
                      })}
                    </SpanAll>
                  </Grid>
                </Fieldset>

                {/* Dynamic Members Section (TM-2: 1 to 4 rows) */}
                <div>
                  <SectionHead>
                    <Eyebrow>Team Members ({form.members.length}/4)</Eyebrow>
                    <Button
                      $variant="secondary"
                      $size="sm"
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
                  </SectionHead>

                  <Stack $gap={3}>
                    {form.members.map((member, idx) => {
                      const memberErrKey = `members.${idx}.name`;
                      const hasMemberErr = showError(memberErrKey);

                      return (
                        <MemberRow key={member.id || idx}>
                          <MemberNum aria-hidden="true">#{idx + 1}</MemberNum>

                          <div style={{ gridArea: 'name', minWidth: 0 }}>
                            <HiddenLabel htmlFor={`${baseId}-mem-name-${idx}`}>
                              Member {idx + 1} Name
                            </HiddenLabel>
                            <Input
                              id={`${baseId}-mem-name-${idx}`}
                              type="text"
                              placeholder="Full Name"
                              value={member.name}
                              onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                              onBlur={() => handleBlur(memberErrKey)}
                              $invalid={hasMemberErr}
                              aria-invalid={hasMemberErr}
                            />
                          </div>

                          <DelBtn
                            $variant="danger"
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
                          </DelBtn>

                          <div style={{ gridArea: 'role', minWidth: 0 }}>
                            <HiddenLabel htmlFor={`${baseId}-mem-role-${idx}`}>
                              Member {idx + 1} Role
                            </HiddenLabel>
                            <Select
                              id={`${baseId}-mem-role-${idx}`}
                              value={member.role}
                              onChange={(e) => handleMemberChange(idx, 'role', e.target.value)}
                            >
                              {MEMBER_ROLES.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </Select>
                          </div>

                          {hasMemberErr && (
                            <div style={{ gridArea: 'err' }}>
                              <FieldError>{errors[memberErrKey]}</FieldError>
                            </div>
                          )}
                        </MemberRow>
                      );
                    })}
                  </Stack>
                </div>

                {/* Interests Checkboxes (TM-3) */}
                <div>
                  <span style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Tech Stack & Topic Interests
                  </span>
                  <InterestGrid>
                    {AVAILABLE_INTERESTS.map((interest) => {
                      const isChecked = form.interests.includes(interest);
                      const chkId = `${baseId}-int-${interest.replace(/\s+/g, '-').toLowerCase()}`;

                      return (
                        <InterestChip key={interest} htmlFor={chkId} $checked={isChecked}>
                          <input
                            id={chkId}
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleInterest(interest)}
                          />
                          {interest}
                        </InterestChip>
                      );
                    })}
                  </InterestGrid>
                </div>

                {/* Agreement Checkbox (TM-4) */}
                <FormGroup>
                  <CheckRow htmlFor={`${baseId}-agreed`} style={{ alignItems: 'flex-start' }}>
                    <input
                      id={`${baseId}-agreed`}
                      type="checkbox"
                      checked={form.agreed}
                      onChange={(e) => handleFieldChange('agreed', e.target.checked)}
                      onBlur={() => handleBlur('agreed')}
                      aria-invalid={showError('agreed')}
                    />
                    <span>
                      Our team agrees to the HackHQ Participant Code of Conduct and venue
                      guidelines. <Req>*</Req>
                    </span>
                  </CheckRow>
                  {showError('agreed') && <FieldError>{errors.agreed}</FieldError>}
                </FormGroup>

                {/* Submit Button */}
                <SubmitRow>
                  <Button type="submit" $variant="primary" $size="lg">
                    <CheckCircle size={18} aria-hidden="true" />
                    <span>Register Team</span>
                  </Button>
                </SubmitRow>
              </Stack>
            </FormCard>

            {/* Live Name Badge Preview (TM-9) */}
            <Sticky>
              <Eyebrow>Live Badge Preview</Eyebrow>
              <TeamBadgePreview form={form} />
            </Sticky>
          </FormGrid>

          {/* Registered Teams Table / List (TM-7) */}
          <section>
            <ListHead>
              <Layers size={18} aria-hidden="true" />
              <h2>Registered Teams ({registeredTeams.length})</h2>
            </ListHead>

            {registeredTeams.length === 0 ? (
              <EmptyBox>
                <FileText size={24} aria-hidden="true" />
                <p>No teams registered yet. Submit the form above to register your squad.</p>
              </EmptyBox>
            ) : (
              <Grid $cols={{ base: 1, md: 2 }} $gap={3}>
                {registeredTeams.map((team) => (
                  <TeamCard key={team.id}>
                    <Stack $dir="row" $align="flex-start" $justify="space-between" $gap={3}>
                      <h3>{team.teamName}</h3>
                      <RemoveBtn
                        $variant="danger"
                        $size="sm"
                        onClick={() => handleRemoveTeam(team.id)}
                        title="Remove registered team"
                        aria-label={`Remove team ${team.teamName}`}
                      >
                        <Trash2 size={15} />
                      </RemoveBtn>
                    </Stack>
                    <Stack $dir="row" $wrap $gap={2} style={{ marginTop: '0.75rem' }}>
                      <Badge $tone="accent">
                        {HACKATHON_TRACKS.find((t) => t.id === team.track)?.name}
                      </Badge>
                      <Badge>{team.contact.city}</Badge>
                    </Stack>
                    <Members>
                      <strong>Members ({team.members.length}):</strong>{' '}
                      {team.members
                        .map((m) => m.name)
                        .filter(Boolean)
                        .join(', ')}
                    </Members>
                  </TeamCard>
                ))}
              </Grid>
            )}
          </section>
        </Main>

        <StateXray
          isOpen={xrayOn}
          stationName="Teams"
          statePayload={statePayload}
          onClose={onToggleXray}
        />
      </Layout>
    </Page>
  );
}

function FieldError({ id, children }) {
  return (
    <FieldErr id={id} role="alert">
      <AlertCircle size={14} aria-hidden="true" />
      <span>{children}</span>
    </FieldErr>
  );
}
