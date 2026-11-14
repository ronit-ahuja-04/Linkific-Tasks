// Turns whatever a page caught into something it can show. The API layer throws ApiError objects
// ({ status, code, message, fields }); we only duck-type them so a plain Error works too.

export function describeError(error) {
  return {
    code: error?.code ?? null,
    message: typeof error?.message === 'string' ? error.message : '',
    fields: error?.fields && typeof error.fields === 'object' ? error.fields : null,
  };
}

/**
 * Maps an error to { fields, formError }:
 *  - fields: messages for inputs this form actually has (`knownFields`), shown under each input
 *  - formError: one message for a role="alert" box above the form
 * invalid_credentials is deliberately generic: it never says WHICH of email/password was wrong,
 * otherwise attackers could use the form to find out which emails have accounts.
 */
export function toFormErrors(error, knownFields = []) {
  const { code, message, fields } = describeError(error);
  const result = { fields: {}, formError: null };
  if (code === 'email_taken' && knownFields.includes('email')) {
    result.fields.email = 'An account with this email already exists. Try signing in.';
    return result;
  }
  if (fields && Object.keys(fields).length > 0) {
    const leftovers = [];
    for (const [field, text] of Object.entries(fields)) {
      if (knownFields.includes(field)) result.fields[field] = text;
      else leftovers.push(text);
    }
    if (leftovers.length > 0) result.formError = leftovers.join(' ');
    return result;
  }
  if (code === 'invalid_credentials') result.formError = 'Email or password is incorrect.';
  else if (code === 'rate_limited') result.formError = 'Too many attempts. Wait a minute and try again.';
  else result.formError = message || 'Something went wrong. Please try again.';
  return result;
}

// Focus the first input (in visual order) that has an error. Called from submit handlers with the
// <form> element; inputs are found by their `name`, so no refs need to be threaded through.
export function focusFirstInvalid(errors, order, form) {
  const first = order.find((field) => errors[field]);
  if (first) form?.elements?.namedItem(first)?.focus();
}
