import { describe, it, expect } from 'vitest';
import { DEMO_PASSCODE, isValidPasscode } from '../src/lib/auth.js';

describe('Demo organizer passcode (src/lib/auth.js)', () => {
  it('accepts the demo passcode, ignoring surrounding spaces', () => {
    expect(isValidPasscode(DEMO_PASSCODE)).toBe(true);
    expect(isValidPasscode(`  ${DEMO_PASSCODE} `)).toBe(true);
  });

  it('rejects anything else, including case changes', () => {
    expect(isValidPasscode('')).toBe(false);
    expect(isValidPasscode('HACKHQ')).toBe(false);
    expect(isValidPasscode('hack')).toBe(false);
    expect(isValidPasscode(undefined)).toBe(false);
  });
});
