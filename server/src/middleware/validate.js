/**
 * Request validation from a zod schema.
 *
 * Returns 422 with a `fields` map so the client can render each message next
 * to the input that caused it, rather than showing one generic banner
 * (ARCHITECTURE.md §3.1).
 */
import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';

/**
 * @param {import('zod').ZodType} schema
 * @param {'body'|'query'|'params'} source
 */
export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      // flattenError gives { fieldErrors: { email: ['...'] } }; we keep the
      // first message per field, which is what a form can actually display.
      const { fieldErrors } = z.flattenError(result.error);
      const fields = Object.fromEntries(
        Object.entries(fieldErrors).map(([key, messages]) => [key, messages[0]])
      );

      return next(
        new ApiError(422, 'VALIDATION_ERROR', 'Please correct the highlighted fields.', fields)
      );
    }

    // Replace the raw input with the parsed value: unknown keys are stripped
    // and types are coerced, so controllers receive exactly what the schema
    // describes and nothing else.
    if (source === 'body') req.body = result.data;
    else req.validated = result.data;

    next();
  };
}

export default validate;
