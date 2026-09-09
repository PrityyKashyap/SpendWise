/**
 * Rate limiting (IDEA.md §28).
 *
 * Two tiers: a loose global limit that stops runaway clients, and a strict
 * limit exported for the auth routes in Phase 2, where the real risk is
 * password brute-forcing.
 */
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const json = (code, message) => ({ success: false, error: { code, message } });

/** Applied to all of /api. */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isProduction ? 100 : 1000, // generous in dev so hot reload never trips it
  standardHeaders: true,
  legacyHeaders: false,
  message: json('RATE_LIMITED', 'Too many requests. Please try again shortly.'),
});

/** Reserved for /api/auth/login and /register in Phase 2. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true, // only failed attempts count toward the limit
  standardHeaders: true,
  legacyHeaders: false,
  message: json('RATE_LIMITED', 'Too many attempts. Please try again in 15 minutes.'),
});
