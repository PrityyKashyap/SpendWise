/**
 * An error we raised deliberately, with an HTTP status and a stable code.
 *
 * The distinction that matters: `throw new ApiError(...)` means "an expected
 * situation the client should be told about" (validation failed, not found).
 * Any *other* error reaching the error handler is a bug, and the handler
 * responds with a generic 500 rather than leaking internals — ARCHITECTURE.md §3.1.
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode  HTTP status, e.g. 404
   * @param {string} code        stable machine-readable code, e.g. 'NOT_FOUND'
   * @param {string} message     human-readable, safe to show the user
   * @param {object} [fields]    optional per-field messages for form errors
   */
  constructor(statusCode, code, message, fields = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
