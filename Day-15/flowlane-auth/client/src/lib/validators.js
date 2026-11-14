// Client-side validation. The same rules as the server so most mistakes are caught without a request,
// but the server is still the authority (a client check can always be bypassed).
// Each function returns { field: message }; an empty object means valid.
import { isCommonPassword } from './password';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emailError(email) {
  const value = String(email ?? '').trim();
  if (!value) return 'Enter your email address.';
  if (!EMAIL.test(value)) return 'Enter a valid email address.';
  return null;
}

function passwordPolicyError(password) {
  const value = String(password ?? '');
  if (!value) return 'Enter a password.';
  if (value.length < 8) return 'Use at least 8 characters.';
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Include at least one letter and one number.';
  if (isCommonPassword(value)) return 'That password is too common. Choose a different one.';
  return null;
}

function confirmError(password, confirm) {
  if (!confirm) return 'Confirm your password.';
  if (password !== confirm) return 'Passwords do not match.';
  return null;
}

const compact = (errors) => Object.fromEntries(Object.entries(errors).filter(([, message]) => message));

export function validateLogin({ email, password } = {}) {
  return compact({
    email: emailError(email),
    // On login we only require that something was typed: the policy applies when CHOOSING a password.
    password: password ? null : 'Enter your password.',
  });
}

export function validateRegister({ name, email, password, confirmPassword } = {}) {
  const trimmed = String(name ?? '').trim();
  let nameMessage = null;
  if (!trimmed) nameMessage = 'Enter your name.';
  else if (trimmed.length < 2) nameMessage = 'Your name must be at least 2 characters.';
  else if (trimmed.length > 60) nameMessage = 'Your name must be 60 characters or fewer.';
  return compact({
    name: nameMessage,
    email: emailError(email),
    password: passwordPolicyError(password),
    confirmPassword: confirmError(password, confirmPassword),
  });
}

export function validateForgot({ email } = {}) {
  return compact({ email: emailError(email) });
}

export function validateReset({ password, confirmPassword } = {}) {
  return compact({
    password: passwordPolicyError(password),
    confirmPassword: confirmError(password, confirmPassword),
  });
}
