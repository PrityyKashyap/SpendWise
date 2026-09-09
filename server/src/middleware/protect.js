/**
 * Authentication gate: verify the access token and attach the user.
 *
 * This establishes *who* the caller is. It does not establish what they may
 * touch — that is ownership, and it belongs in each query's filter
 * (ARCHITECTURE.md §5.6). Both layers are always required.
 */
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/tokens.js';

export async function protect(req, _res, next) {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'UNAUTHORIZED', 'You must be logged in to do that.'));
  }

  const token = header.slice(7).trim();
  if (!token) {
    return next(new ApiError(401, 'UNAUTHORIZED', 'You must be logged in to do that.'));
  }

  // Throws ApiError('TOKEN_EXPIRED' | 'TOKEN_INVALID'). Express 5 forwards the
  // rejection to the error handler, so no try/catch is needed.
  const payload = verifyAccessToken(token);

  // Load the user on every request rather than trusting the token payload
  // alone: a deleted account must stop working immediately, not in 15 minutes.
  const user = await User.findById(payload.sub);
  if (!user) {
    return next(new ApiError(401, 'UNAUTHORIZED', 'This account no longer exists.'));
  }

  req.user = user;
  next();
}

export default protect;
