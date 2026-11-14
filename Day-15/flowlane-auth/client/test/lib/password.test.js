import { describe, expect, it } from 'vitest';
import { isCommonPassword, passwordStrength } from '../../src/lib/password';

describe('passwordStrength scores', () => {
  const table = [
    ['', 0, 'Too weak'],
    ['abc', 0, 'Too weak'],
    ['Ab1!', 1, 'Weak'],
    ['hdjkwpqz', 1, 'Weak'],
    ['hdjkwpqz1', 1, 'Weak'],
    ['Hdjkwpqz1', 2, 'Fair'],
    ['Hdjkwpqz1xyzw', 3, 'Good'],
    ['Hdjkwpqz1xyzw!Q9', 4, 'Strong'],
    ['correct horse battery staple', 3, 'Good'],
  ];
  it.each(table)('%j scores %i (%s)', (password, score, label) => {
    const result = passwordStrength(password);
    expect(result.score).toBe(score);
    expect(result.label).toBe(label);
  });

  it('always rates common passwords as Too weak', () => {
    for (const password of ['password', 'Password1', 'PASSWORD', '12345678', 'qwerty123', 'letmein', 'iloveyou', 'admin123', 'welcome1', 'password1']) {
      expect(passwordStrength(password).score).toBe(0);
      expect(passwordStrength(password).label).toBe('Too weak');
      expect(passwordStrength(password).checks.common).toBe(false);
    }
  });

  it('penalises repeated characters and sequences', () => {
    const plain = passwordStrength('Hdjkwpqz1xyzw').score;
    expect(passwordStrength('Hdjkwaaaa1xyzw').score).toBeLessThan(plain + 1);
    expect(passwordStrength('Hdjkw1234xyzw').suggestions.join(' ')).toMatch(/sequences/);
    expect(passwordStrength('Hdjkwdcba9xyzw').suggestions.join(' ')).toMatch(/sequences/);
    expect(passwordStrength('Zqpmaaaaxkw7').suggestions.join(' ')).toMatch(/repeated/);
  });

  it('penalises containing the email local part or the name', () => {
    const base = passwordStrength('Hdjkwpqz1xyzw');
    const byEmail = passwordStrength('Hdjkwpqz1ronit', { email: 'ronit@example.com' });
    expect(byEmail.checks.personal).toBe(false);
    expect(byEmail.suggestions.join(' ')).toMatch(/name or email/);
    expect(base.checks.personal).toBe(true);
    expect(passwordStrength('Hdjkwpqz1ahuja', { name: 'Ronit Ahuja' }).checks.personal).toBe(false);
    expect(passwordStrength('Hdjkwpqz1xyzw', { name: 'Al' }).checks.personal).toBe(true);
  });
});

describe('passwordStrength checks and suggestions', () => {
  it('reports each character class', () => {
    expect(passwordStrength('abcXYZ12!').checks).toMatchObject({ length: true, lower: true, upper: true, digit: true, symbol: true });
    expect(passwordStrength('abc').checks).toMatchObject({ length: false, lower: true, upper: false, digit: false, symbol: false });
  });
  it('gives no suggestions for an empty password and some for a short one', () => {
    expect(passwordStrength('').suggestions).toEqual([]);
    expect(passwordStrength('abc').suggestions).toContain('Use at least 8 characters.');
  });
  it('tolerates undefined input', () => {
    expect(passwordStrength(undefined).score).toBe(0);
  });
  it('isCommonPassword is case-insensitive', () => {
    expect(isCommonPassword('PassWord1')).toBe(true);
    expect(isCommonPassword('Zk3!vq9xLm')).toBe(false);
  });
});
