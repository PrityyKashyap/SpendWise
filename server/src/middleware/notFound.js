/**
 * Catches any request that matched no route and hands it to the error handler,
 * so unknown paths return the same JSON envelope as every other error rather
 * than Express's default HTML page.
 *
 * Registered with `app.use(notFound)` and no path string: Express 5 uses
 * path-to-regexp v8, where a bare '*' is no longer a valid path pattern.
 */
import { ApiError } from '../utils/ApiError.js';

export function notFound(req, _res, next) {
  next(new ApiError(404, 'NOT_FOUND', `Route not found: ${req.method} ${req.originalUrl}`));
}

export default notFound;
