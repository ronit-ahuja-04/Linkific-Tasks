import { useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, Mail, MapPin, Send } from 'lucide-react';
import styled from 'styled-components';
import PageHeader from '../components/layout/PageHeader.jsx';
import {
  Button,
  Card,
  ErrorText,
  Eyebrow,
  FormGroup,
  Grid,
  Hint,
  Input,
  Label,
  Select,
  Textarea,
} from '../components/ui.jsx';
import {
  CONTACT_TOPICS,
  MESSAGE_MIN_LENGTH,
  getInitialContactForm,
  validateContact,
} from '../lib/contact.js';

const INFO = [
  { icon: Mail, label: 'Email', value: 'organizers@example.com (demo)' },
  { icon: Clock, label: 'Response time', value: 'Demo content: replies are not sent' },
  { icon: MapPin, label: 'Find us', value: 'Demo content: no real venue' },
];

const Layout = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(6)};
  align-items: start;
  grid-template-columns: minmax(0, 1fr);
  ${({ theme }) => theme.media.up('lg')} {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  }
  ${({ theme }) => theme.media.up('xl')} {
    grid-template-columns: minmax(0, 3fr) minmax(0, 1fr);
  }
`;
const FormCard = styled(Card).attrs({ as: 'form', $padded: false })`
  padding: ${({ theme }) => theme.space(4)};
  ${({ theme }) => theme.media.up('sm')} {
    padding: ${({ theme }) => theme.space(12)};
  }
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(4)};
`;
const Required = styled.span`
  color: ${({ theme }) => theme.colors.bad};
`;
const FieldError = styled(ErrorText)`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;
const Aside = styled.aside`
  background: ${({ theme }) => theme.colors.board};
  color: ${({ theme }) => theme.colors.onBoard};
  border-radius: 1.5rem;
  padding: ${({ theme }) => theme.space(4)};
  box-shadow: ${({ theme }) => theme.shadow};
`;
const BrandEyebrow = styled(Eyebrow)`
  color: ${({ theme }) => theme.colors.brand};
`;
const AsideTitle = styled.h2`
  margin: ${({ theme }) => theme.space(2)} 0 0;
  font-size: 1.5rem;
  font-weight: 700;
`;
const InfoList = styled.ul`
  list-style: none;
  padding: 0;
  margin: ${({ theme }) => theme.space(4)} 0 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(4)};
  li {
    display: flex;
    gap: ${({ theme }) => theme.space(3)};
  }
`;
const IconBox = styled.span`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.brand};
  background: rgba(255, 255, 255, 0.1);
`;
const InfoText = styled.div`
  min-width: 0;
`;
const InfoLabel = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.68rem;
  text-transform: uppercase;
  opacity: 0.75;
`;
const InfoValue = styled.p`
  margin: 0;
  font-size: 0.875rem;
  overflow-wrap: anywhere;
`;

export default function Contact({ onNotify }) {
  const navigate = useNavigate();
  const baseId = useId();

  const [form, setForm] = useState(getInitialContactForm);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Derived during render, never stored
  const errors = validateContact(form);
  const showError = (field) => (submitted || touched[field]) && Boolean(errors[field]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // CONCEPT: Navigate on an event - useNavigate inside the submit handler, never during render
  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;

    onNotify(`Thanks ${form.name.trim()}, the organizers will reply soon.`, null, 'success');
    // replace: Back from the confirmation skips the already-sent form
    navigate('/contact/sent', { replace: true });
  };

  const fieldProps = (field) => ({
    id: `${baseId}-${field}`,
    value: form[field],
    onChange: (event) => handleChange(field, event.target.value),
    onBlur: () => handleBlur(field),
    $invalid: showError(field),
    'aria-invalid': showError(field),
    'aria-describedby': showError(field) ? `${baseId}-${field}-err` : undefined,
  });

  // Shown only for fields that were left or submitted invalid
  const fieldError = (field) =>
    showError(field) ? (
      <FieldError id={`${baseId}-${field}-err`} role="alert">
        <AlertCircle size={14} aria-hidden="true" />
        <span>{errors[field]}</span>
      </FieldError>
    ) : null;

  return (
    <div>
      <PageHeader breadcrumb="CONTACT" title="Contact the organizers" pill="Form" />

      <Layout>
        <FormCard onSubmit={handleSubmit} noValidate>
          <Grid $cols={{ base: 1, sm: 2 }} $gap={3}>
            <FormGroup>
              <Label htmlFor={`${baseId}-name`}>
                Name <Required>*</Required>
              </Label>
              <Input
                type="text"
                autoComplete="name"
                placeholder="Ada Lovelace"
                {...fieldProps('name')}
              />
              {fieldError('name')}
            </FormGroup>

            <FormGroup>
              <Label htmlFor={`${baseId}-email`}>
                Email <Required>*</Required>
              </Label>
              <Input
                type="email"
                autoComplete="email"
                placeholder="ada@example.com"
                {...fieldProps('email')}
              />
              {fieldError('email')}
            </FormGroup>
          </Grid>

          <FormGroup>
            <Label htmlFor={`${baseId}-topic`}>Topic</Label>
            <Select {...fieldProps('topic')}>
              {CONTACT_TOPICS.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.label}
                </option>
              ))}
            </Select>
            {fieldError('topic')}
          </FormGroup>

          <FormGroup>
            <Label htmlFor={`${baseId}-message`}>
              Message <Required>*</Required>
            </Label>
            <Textarea rows={5} placeholder="How can we help?" {...fieldProps('message')} />
            <Hint>
              {form.message.trim().length} / {MESSAGE_MIN_LENGTH}+ characters
            </Hint>
            {fieldError('message')}
          </FormGroup>

          <div>
            <Button type="submit" $variant="primary" $size="lg" $block>
              <Send size={16} aria-hidden="true" />
              <span>Send message</span>
            </Button>
          </div>
        </FormCard>

        <Aside>
          <BrandEyebrow>Reach us directly</BrandEyebrow>
          <AsideTitle>Prefer a human?</AsideTitle>
          <InfoList>
            {INFO.map(({ icon: Icon, label, value }) => (
              <li key={label}>
                <IconBox aria-hidden="true">
                  <Icon size={16} />
                </IconBox>
                <InfoText>
                  <InfoLabel>{label}</InfoLabel>
                  <InfoValue>{value}</InfoValue>
                </InfoText>
              </li>
            ))}
          </InfoList>
        </Aside>
      </Layout>
    </div>
  );
}
