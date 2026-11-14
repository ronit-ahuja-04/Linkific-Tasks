// One error type for everything we deliberately reject. The central error handler turns it
// into the contract shape: { error: { code, message, fields? } }.
export class AppError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export const validationFailed = (fields, message = 'Please check the highlighted fields.') =>
  new AppError(400, 'validation_failed', message, fields);
export const notFound = (message = 'Not found.') => new AppError(404, 'not_found', message);
export const unauthorized = (message = 'Please sign in.') => new AppError(401, 'unauthorized', message);
