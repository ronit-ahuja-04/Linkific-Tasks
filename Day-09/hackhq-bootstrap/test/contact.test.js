import { describe, it, expect } from 'vitest';
import { getInitialContactForm, validateContact, MESSAGE_MIN_LENGTH } from '../src/lib/contact.js';

const VALID = {
  name: 'Ronit',
  email: 'ronit@hackhq.dev',
  topic: 'sponsor',
  message: 'We would love to sponsor the AI track this year.',
};

describe('Contact form validation (src/lib/contact.js)', () => {
  it('starts with empty fields and the general topic', () => {
    expect(getInitialContactForm()).toEqual({
      name: '',
      email: '',
      topic: 'general',
      message: '',
    });
  });

  it('accepts a complete form', () => {
    expect(validateContact(VALID)).toEqual({});
  });

  it('flags every empty field on an untouched form', () => {
    const errors = validateContact(getInitialContactForm());
    expect(Object.keys(errors).sort()).toEqual(['email', 'message', 'name']);
  });

  it('rejects malformed email and unknown topics', () => {
    expect(validateContact({ ...VALID, email: 'nope' }).email).toMatch(/does not look right/);
    expect(validateContact({ ...VALID, topic: 'pizza' }).topic).toBeDefined();
  });

  it('requires a minimum message length after trimming', () => {
    const short = ' '.repeat(10) + 'x'.repeat(MESSAGE_MIN_LENGTH - 1) + ' '.repeat(10);
    expect(validateContact({ ...VALID, message: short }).message).toBeDefined();
    expect(validateContact({ ...VALID, message: 'x'.repeat(MESSAGE_MIN_LENGTH) })).toEqual({});
  });
});
