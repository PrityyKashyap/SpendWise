/**
 * JWT signing, verification and refresh-token hashing (ARCHITECTURE.md §5.1).
 *
 * Two separate secrets are used on purpose: if the access secret ever leaks,
 * an attacker can forge 15-minute access tokens but cannot forge refresh
 * tokens, so they cannot establish a durable session.
 */
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from './ApiError.js';

/**
 * Sign a short-lived access token.
 *
 * The payload carries only the user id. A JWT is signed, not encrypted —
 * anyone holding it can read the payload — so no name, email or financial
 * data goes in here.
 */
export function signAccessToken(userId) {
  return jwt.sign({ sub: String(userId) }, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpires,
  });
}

/**
 * Sign a long-lived refresh token.
 *
 * The random `jti` is what makes rotation reliable. A JWT's `iat` claim has
 * only one-second resolution, so without it two refresh tokens issued to the
 * same user in the same second are byte-identical — and since rotation works
 * by storing a hash of the current token, an identical token would still match
 * after rotation. That would leave a one-second window in which a stolen
 * refresh token could be replayed successfully. A unique id per token closes
 * it and makes every rotation strict.
 */
export function signRefreshToken(userId) {
  return jwt.sign({ sub: String(userId), jti: crypto.randomUUID() }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpires,
  });
}

/** Verify an access token, or throw a 401 the client can act on. */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.jwtAccessSecret);
  } catch (err) {
    // TOKEN_EXPIRED is what tells the client to attempt a silent refresh;
    // TOKEN_INVALID means the token is malformed or forged, so don't bother.
    if (err.name === 'TokenExpiredError') {
      throw new ApiError(401, 'TOKEN_EXPIRED', 'Your session has expired.');
    }
    throw new ApiError(401, 'TOKEN_INVALID', 'Invalid authentication token.');
  }
}

/** Verify a refresh token. Any failure means "log in again". */
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, env.jwtRefreshSecret);
  } catch {
    throw new ApiError(401, 'TOKEN_INVALID', 'Your session has expired. Please log in again.');
  }
}

/**
 * Hash a refresh token for storage.
 *
 * SHA-256 rather than bcrypt is the right choice here: the input is a
 * high-entropy random token, not a guessable human password, so the slow
 * key-derivation bcrypt provides buys nothing — and this runs on every token
 * refresh, where speed matters.
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Cookie options for the refresh token.
 *
 * The production/development split is the one real deployment trap in this
 * project (ARCHITECTURE.md §5.7). In production the client and API sit on
 * different origins, which requires SameSite=None — and browsers only accept
 * SameSite=None together with Secure.
 */
export function refreshCookieOptions() {
  return {
    httpOnly: true,                                  // invisible to JavaScript
    secure: env.isProduction,                        // HTTPS only in production
    sameSite: env.isProduction ? 'none' : 'lax',
    path: '/api/auth',                               // not sent to unrelated routes
    maxAge: 7 * 24 * 60 * 60 * 1000,                 // 7 days, matches the JWT
  };
}

export const REFRESH_COOKIE = 'refreshToken';
