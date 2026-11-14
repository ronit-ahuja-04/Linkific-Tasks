import { describe, expect, it } from 'vitest';
import { validateForgot, validateLogin, validateRegister, validateReset } from '../../src/lib/validators';

const good = { name: 'Ronit Ahuja', email: 'ronit@example.com', password: 'Zk3-vq9xLm', confirmPassword: 'Zk3-vq9xLm' };

describe('validateLogin', () => {
  it('accepts a valid pair', () => {
    expect(validateLogin({ email: 'a@b.co', password: 'x' })).toEqual({});
  });
  it('requires both fields', () => {
    expect(Object.keys(validateLogin({}))).toEqual(['email', 'password']);
  });
  it('rejects a malformed email', () => {
    expect(validateLogin({ email: 'nope', password: 'x' }).email).toMatch(/valid email/);
    expect(validateLogin({ email: 'a@b', password: 'x' }).email).toBeTruthy();
  });
  it('does not apply the password policy on login', () => {
    expect(validateLogin({ email: 'a@b.co', password: 'abc' })).toEqual({});
  });
  it('trims the email', () => {
    expect(validateLogin({ email: '  a@b.co ', password: 'x' })).toEqual({});
  });
});

describe('validateRegister', () => {
  it('accepts valid input', () => {
    expect(validateRegister(good)).toEqual({});
  });
  it('validates the name length', () => {
    expect(validateRegister({ ...good, name: '' }).name).toMatch(/Enter your name/);
    expect(validateRegister({ ...good, name: 'A' }).name).toMatch(/at least 2/);
    expect(validateRegister({ ...good, name: ' A ' }).name).toMatch(/at least 2/);
    expect(validateRegister({ ...good, name: 'x'.repeat(61) }).name).toMatch(/60/);
    expect(validateRegister({ ...good, name: 'x'.repeat(60) }).name).toBeUndefined();
  });
  it('enforces the password policy', () => {
    const run = (password) => validateRegister({ ...good, password, confirmPassword: password }).password;
    expect(run('')).toBeTruthy();
    expect(run('Ab1')).toMatch(/at least 8/);
    expect(run('abcdefghij')).toMatch(/letter and one number/);
    expect(run('1234567890')).toMatch(/letter and one number/);
    expect(run('Password1')).toMatch(/common/);
    expect(run('Zk3-vq9xLm')).toBeUndefined();
  });
  it('requires a matching confirmation', () => {
    expect(validateRegister({ ...good, confirmPassword: '' }).confirmPassword).toMatch(/Confirm/);
    expect(validateRegister({ ...good, confirmPassword: 'other' }).confirmPassword).toMatch(/do not match/);
  });
  it('reports several errors at once', () => {
    expect(Object.keys(validateRegister({}))).toEqual(['name', 'email', 'password', 'confirmPassword']);
  });
});

describe('validateForgot and validateReset', () => {
  it('validates the email', () => {
    expect(validateForgot({ email: '' }).email).toBeTruthy();
    expect(validateForgot({ email: 'a@b.co' })).toEqual({});
  });
  it('validates the new password and confirmation', () => {
    expect(validateReset({ password: 'Zk3-vq9xLm', confirmPassword: 'Zk3-vq9xLm' })).toEqual({});
    expect(validateReset({ password: 'short', confirmPassword: 'short' }).password).toBeTruthy();
    expect(validateReset({ password: 'Zk3-vq9xLm', confirmPassword: 'Zk3-vq9xLn' }).confirmPassword).toMatch(/do not match/);
  });
});
