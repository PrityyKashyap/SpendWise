/**
 * Express application: middleware chain, routes, error handling.
 *
 * Kept separate from server.js (which connects to the database and listens) so
 * the app can be imported by tests without opening a port.
 *
 * Order matters. Security headers first, then CORS, then rate limiting, then
 * body parsing, then routes, and error handling last.
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { env } from './config/env.js';
import routes from './routes/index.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

/**
 * Trust the hosting platform's reverse proxy.
 *
 * This is not cosmetic. Render, Railway, Fly and Heroku all terminate TLS at a
 * proxy and forward the real client IP in X-Forwarded-For. Without this,
 * `req.ip` is the PROXY's address for every request — so express-rate-limit
 * puts the entire user base in one bucket and the global 100-requests/15-min
 * limit locks everybody out at once. It also makes `secure` cookies work,
 * because Express would otherwise see the internal hop as plain HTTP.
 *
 * `1` rather than `true`: trusting every hop lets a client forge
 * X-Forwarded-For and evade rate limiting entirely. One hop is what these
 * platforms actually use.
 */
if (env.isProduction) {
  app.set('trust proxy', 1);
}

// Security headers.
app.use(helmet());

// CORS. The origin is explicit rather than '*' because Phase 2 sends the
// refresh token as a credentialed cookie, and browsers refuse to send
// credentials to a wildcard origin (ARCHITECTURE.md §5.7).
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);

// Request logging — concise in dev, standard combined format in production.
app.use(morgan(env.isProduction ? 'combined' : 'dev'));

// Body parsing. The size limit stops a client posting a huge payload to
// exhaust memory.
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Parses the httpOnly refresh cookie into req.cookies.
app.use(cookieParser());

// Rate limiting across the API surface.
app.use('/api', globalLimiter);

// Routes.
app.use('/api', routes);

// No route matched → 404 in the standard error envelope.
app.use(notFound);

// Error handler must be registered last.
app.use(errorHandler);

export default app;
