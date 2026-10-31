import { isValidEmail } from './validation.js';

/**
 * Pure helpers for the Contact form (APP-5). Same touched + derived-errors
 * pattern as the Day 5 Teams form: errors are computed, never stored.
 */
export const CONTACT_TOPICS = [
  { id: 'general', label: 'General question' },
  { id: 'sponsor', label: 'Sponsorship' },
  { id: 'judge', label: 'Judging & mentoring' },
  { id: 'access', label: 'Accessibility request' },
];

export const MESSAGE_MIN_LENGTH = 20;

export function getInitialContactForm() {
  return { name: '', email: '', topic: 'general', message: '' };
}

export function validateContact(values) {
  const errors = {};

  if (!values.name.trim()) {
    errors.name = 'Tell us who you are.';
  }

  if (!values.email.trim()) {
    errors.email = 'Email is required so we can reply.';
  } else if (!isValidEmail(values.email)) {
    errors.email = 'That email does not look right.';
  }

  if (!CONTACT_TOPICS.some((topic) => topic.id === values.topic)) {
    errors.topic = 'Pick a topic.';
  }

  if (values.message.trim().length < MESSAGE_MIN_LENGTH) {
    errors.message = `Write at least ${MESSAGE_MIN_LENGTH} characters.`;
  }

  return errors;
}
