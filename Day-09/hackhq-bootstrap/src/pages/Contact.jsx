import { useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, Mail, MapPin, Send } from 'lucide-react';
import { Col, Form, Row } from 'react-bootstrap';
import PageHeader from '../components/layout/PageHeader.jsx';
import { Card, Eyebrow, buttonClass } from '../components/ui.jsx';
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
    isInvalid: showError(field),
    'aria-invalid': showError(field),
    'aria-describedby': showError(field) ? `${baseId}-${field}-err` : undefined,
  });

  // CONCEPT: Form.Control.Feedback - Bootstrap only reveals it after an .is-invalid sibling
  const fieldError = (field) => (
    <Form.Control.Feedback type="invalid" id={`${baseId}-${field}-err`} role="alert">
      <AlertCircle size={14} aria-hidden="true" className="me-1" />
      <span>{errors[field]}</span>
    </Form.Control.Feedback>
  );

  return (
    <div>
      <PageHeader breadcrumb="CONTACT" title="Contact the organizers" pill="Form" />

      <Row className="g-4 align-items-start">
        <Col lg={8} xl={9}>
          <Card as="form" className="p-4 p-sm-5" onSubmit={handleSubmit} noValidate>
            <Row className="g-3 mb-3">
              <Col sm={6}>
                <Form.Group>
                  <Form.Label htmlFor={`${baseId}-name`} className="fw-medium">
                    Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    autoComplete="name"
                    placeholder="Ada Lovelace"
                    {...fieldProps('name')}
                  />
                  {fieldError('name')}
                </Form.Group>
              </Col>

              <Col sm={6}>
                <Form.Group>
                  <Form.Label htmlFor={`${baseId}-email`} className="fw-medium">
                    Email <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="email"
                    autoComplete="email"
                    placeholder="ada@example.com"
                    {...fieldProps('email')}
                  />
                  {fieldError('email')}
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label htmlFor={`${baseId}-topic`} className="fw-medium">
                Topic
              </Form.Label>
              <Form.Select {...fieldProps('topic')}>
                {CONTACT_TOPICS.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.label}
                  </option>
                ))}
              </Form.Select>
              {fieldError('topic')}
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label htmlFor={`${baseId}-message`} className="fw-medium">
                Message <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder="How can we help?"
                {...fieldProps('message')}
              />
              <Form.Text className="d-block">
                {form.message.trim().length} / {MESSAGE_MIN_LENGTH}+ characters
              </Form.Text>
              {fieldError('message')}
            </Form.Group>

            <div>
              <button
                type="submit"
                className={buttonClass({
                  variant: 'primary',
                  size: 'lg',
                  className: 'w-100',
                })}
              >
                <Send size={16} aria-hidden="true" />
                <span>Send message</span>
              </button>
            </div>
          </Card>
        </Col>

        <Col lg={4} xl={3}>
          <aside
            className="rounded-4 p-4 shadow"
            style={{ background: 'var(--board)', color: 'var(--on-board)', top: '6rem' }}
          >
            <Eyebrow className="text-brand">Reach us directly</Eyebrow>
            <h2 className="mt-2 fs-4 fw-bold">Prefer a human?</h2>
            <ul className="list-unstyled mt-4 mb-0 d-flex flex-column gap-4">
              {INFO.map(({ icon: Icon, label, value }) => (
                <li key={label} className="d-flex gap-3">
                  <span
                    className="d-flex flex-shrink-0 align-items-center justify-content-center rounded-3 text-brand"
                    style={{
                      width: '2.25rem',
                      height: '2.25rem',
                      background: 'rgba(255,255,255,0.1)',
                    }}
                    aria-hidden="true"
                  >
                    <Icon size={16} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p
                      className="mb-0 font-monospace text-uppercase opacity-75"
                      style={{ fontSize: '0.68rem' }}
                    >
                      {label}
                    </p>
                    <p className="mb-0 small text-break">{value}</p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </Col>
      </Row>
    </div>
  );
}
