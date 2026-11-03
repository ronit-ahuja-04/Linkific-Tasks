import { useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, Mail, MapPin, Send } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader.jsx';
import {
  Card,
  Eyebrow,
  buttonClass,
  errorClass,
  inputClass,
  labelClass,
  hintClass,
  cx,
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
      <p
        id={`${baseId}-${field}-err`}
        className={cx(errorClass, 'flex items-center gap-1.5')}
        role="alert"
      >
        <AlertCircle size={14} aria-hidden="true" />
        <span>{errors[field]}</span>
      </p>
    );

  return (
    <div>
      <PageHeader breadcrumb="CONTACT" title="Contact the organizers" pill="Form" />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card as="form" className="space-y-5 p-6 sm:p-8" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor={`${baseId}-name`} className={labelClass}>
                Name <span className="text-bad">*</span>
              </label>
              <input
                type="text"
                autoComplete="name"
                placeholder="Ada Lovelace"
                className={inputClass}
                {...fieldProps('name')}
              />
              {fieldError('name')}
            </div>

            <div>
              <label htmlFor={`${baseId}-email`} className={labelClass}>
                Email <span className="text-bad">*</span>
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="ada@example.com"
                className={inputClass}
                {...fieldProps('email')}
              />
              {fieldError('email')}
            </div>
          </div>

          <div>
            <label htmlFor={`${baseId}-topic`} className={labelClass}>
              Topic
            </label>
            <select className={inputClass} {...fieldProps('topic')}>
              {CONTACT_TOPICS.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.label}
                </option>
              ))}
            </select>
            {fieldError('topic')}
          </div>

          <div>
            <label htmlFor={`${baseId}-message`} className={labelClass}>
              Message <span className="text-bad">*</span>
            </label>
            <textarea
              rows={5}
              placeholder="How can we help?"
              className={cx(inputClass, 'resize-y')}
              {...fieldProps('message')}
            />
            <span className={cx(hintClass, 'block tabular-nums')}>
              {form.message.trim().length} / {MESSAGE_MIN_LENGTH}+ characters
            </span>
            {fieldError('message')}
          </div>

          <button
            type="submit"
            className={buttonClass({
              variant: 'primary',
              size: 'lg',
              className: 'w-full sm:w-auto',
            })}
          >
            <Send size={16} aria-hidden="true" />
            <span>Send message</span>
          </button>
        </Card>

        <aside className="rounded-card bg-board p-6 text-on-board shadow-pop lg:sticky lg:top-24">
          <Eyebrow className="text-brand">Reach us directly</Eyebrow>
          <h2 className="mt-2 text-xl font-bold tracking-tight">Prefer a human?</h2>
          <ul className="mt-6 space-y-5">
            {INFO.map(({ icon: Icon, label, value }) => (
              <li key={label} className="flex gap-3">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand"
                  aria-hidden="true"
                >
                  <Icon size={16} />
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-[0.68rem] uppercase tracking-wider text-on-board/60">
                    {label}
                  </p>
                  <p className="break-words text-sm">{value}</p>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
