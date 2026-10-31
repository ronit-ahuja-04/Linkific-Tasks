import { useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Send } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader.jsx';
import {
  CONTACT_TOPICS,
  MESSAGE_MIN_LENGTH,
  getInitialContactForm,
  validateContact,
} from '../lib/contact.js';

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
    'aria-invalid': showError(field),
    'aria-describedby': showError(field) ? `${baseId}-${field}-err` : undefined,
  });

  const fieldError = (field) =>
    showError(field) && (
      <p id={`${baseId}-${field}-err`} className="field-error-text" role="alert">
        <AlertCircle size={14} aria-hidden="true" />
        <span>{errors[field]}</span>
      </p>
    );

  return (
    <div className="station-view contact-view">
      <PageHeader breadcrumb="CONTACT" title="Contact the organizers" pill="Form" />

      <form className="contact-card" onSubmit={handleSubmit} noValidate>
        <div className="contact-grid">
          <div className="form-field-group">
            <label htmlFor={`${baseId}-name`} className="form-label">
              Name <span className="label-required">*</span>
            </label>
            <input
              type="text"
              autoComplete="name"
              placeholder="Ada Lovelace"
              className={`form-input ${showError('name') ? 'input-error' : ''}`}
              {...fieldProps('name')}
            />
            {fieldError('name')}
          </div>

          <div className="form-field-group">
            <label htmlFor={`${baseId}-email`} className="form-label">
              Email <span className="label-required">*</span>
            </label>
            <input
              type="email"
              autoComplete="email"
              placeholder="ada@example.com"
              className={`form-input ${showError('email') ? 'input-error' : ''}`}
              {...fieldProps('email')}
            />
            {fieldError('email')}
          </div>
        </div>

        <div className="form-field-group">
          <label htmlFor={`${baseId}-topic`} className="form-label">
            Topic
          </label>
          <select
            className={`form-select ${showError('topic') ? 'input-error' : ''}`}
            {...fieldProps('topic')}
          >
            {CONTACT_TOPICS.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.label}
              </option>
            ))}
          </select>
          {fieldError('topic')}
        </div>

        <div className="form-field-group">
          <label htmlFor={`${baseId}-message`} className="form-label">
            Message <span className="label-required">*</span>
          </label>
          <textarea
            rows={5}
            placeholder="How can we help?"
            className={`form-input contact-textarea ${showError('message') ? 'input-error' : ''}`}
            {...fieldProps('message')}
          />
          <span className="contact-counter tabular-nums">
            {form.message.trim().length} / {MESSAGE_MIN_LENGTH}+ characters
          </span>
          {fieldError('message')}
        </div>

        <button type="submit" className="btn btn-primary contact-submit">
          <Send size={16} aria-hidden="true" />
          <span>Send message</span>
        </button>
      </form>
    </div>
  );
}
