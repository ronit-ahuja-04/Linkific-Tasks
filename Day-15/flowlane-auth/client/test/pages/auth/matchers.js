import { computeAccessibleDescription } from 'dom-accessibility-api';
import { expect } from 'vitest';

// jest-dom is not installed in this project, so these are the few DOM matchers the auth tests need.
const text = (el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim();

expect.extend({
  toBeInTheDocument(received) {
    const pass = Boolean(received) && received.ownerDocument.contains(received);
    return { pass, message: () => `expected element ${pass ? 'not ' : ''}to be in the document` };
  },
  toHaveAttribute(received, name, value) {
    const actual = received.getAttribute(name);
    const pass = value === undefined ? actual !== null : actual === value;
    return { pass, message: () => `expected ${name}=${JSON.stringify(actual)} ${pass ? 'not ' : ''}to match ${JSON.stringify(value)}` };
  },
  toHaveTextContent(received, expected) {
    const actual = text(received);
    const pass = expected instanceof RegExp ? expected.test(actual) : actual.includes(expected);
    return { pass, message: () => `expected text ${JSON.stringify(actual)} ${pass ? 'not ' : ''}to contain ${String(expected)}` };
  },
  toHaveFocus(received) {
    const pass = received.ownerDocument.activeElement === received;
    return { pass, message: () => `expected element ${pass ? 'not ' : ''}to have focus` };
  },
  toBeDisabled(received) {
    return { pass: received.disabled === true, message: () => 'expected element to be disabled' };
  },
  toBeEnabled(received) {
    return { pass: received.disabled === false, message: () => 'expected element to be enabled' };
  },
  toContainElement(received, child) {
    return { pass: received.contains(child), message: () => 'expected element to contain the other element' };
  },
  toHaveAccessibleDescription(received, expected) {
    const actual = computeAccessibleDescription(received);
    return { pass: actual === expected, message: () => `expected description ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}` };
  },
});
