/**
 * Central error handler. Must be registered LAST, and must take four
 * parameters — that arity is how Express recognises an error handler.
 *
 * Express 5 forwards rejected promises from async handlers here automatically,
 * so route handlers can simply `throw` and do not need a try/catch or an
 * asyncHandler wrapper (that was an Express 4 requirement).
 */
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/ApiError.js';

// eslint-disable-next-line no-unused-vars -- `next` is required for arity
export function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Something went wrong. Please try again.';
  let fields;

  if (err instanceof ApiError) {
    // An error we raised on purpose — safe to show the client verbatim.
    ({ statusCode, code, message, fields } = err);
  } else if (err.name === 'ValidationError') {
    // Mongoose schema validation
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    message = 'Some fields are invalid.';
    fields = Object.fromEntries(
      Object.entries(err.errors).map(([key, e]) => [key, e.message])
    );
  } else if (err.name === 'CastError') {
    // e.g. a malformed ObjectId in the URL
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'That identifier is not valid.';
  } else if (typeof err.type === 'string' && err.type.startsWith('entity.')) {
    // body-parser rejected the request body — malformed JSON, too large, or an
    // unsupported charset. These carry their own status code and are the
    // caller's mistake; reporting them as 500 both misleads the client and
    // buries genuine server bugs in the error log.
    statusCode = err.status ?? err.statusCode ?? 400;
    const tooLarge = err.type === 'entity.too.large';
    code = tooLarge ? 'PAYLOAD_TOO_LARGE' : 'INVALID_BODY';
    message = tooLarge
      ? 'That request was too large.'
      : 'The request body could not be read.';
  } else if (err.code === 11000) {
    // Mongo duplicate key
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'value';
    message = `That ${field} is already in use.`;
    fields = field ? { [field]: 'Already in use' } : undefined;
  }

  // Log the full error server-side. Unexpected errors (500) are bugs, so they
  // get a stack trace; expected ones are just noted.
  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} → ${statusCode}`, err);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} → ${statusCode} ${code}: ${err.message}`);
  }

  const body = { success: false, error: { code, message } };
  if (fields) body.error.fields = fields;

  // Stack traces go to the client in development only. Leaking internals in
  // production hands an attacker a map of the codebase (IDEA.md §28).
  if (!env.isProduction && statusCode >= 500) {
    body.error.stack = err.stack;
  }

  res.status(statusCode).json(body);
}

export default errorHandler;
