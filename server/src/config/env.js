/**
 * Environment configuration — validated once, at boot.
 *
 * Why fail fast: if MONGO_URI is missing, the alternative is a server that
 * starts "successfully" and then throws on the first database request, which
 * looks like a broken feature rather than a broken config. Crashing at boot
 * with a clear message turns a confusing runtime bug into an obvious setup bug.
 */
import dotenv from 'dotenv';

dotenv.config();

/** Variables the app cannot run without. */
const REQUIRED = ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

const missing = REQUIRED.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `\n  Missing required environment variable(s): ${missing.join(', ')}\n` +
      `  Copy server/.env.example to server/.env and fill in the values.\n`
  );
  process.exit(1);
}

const nodeEnv = process.env.NODE_ENV || 'development';

export const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  // 5001, not 5000: on macOS, AirPlay Receiver (ControlCenter) already listens
  // on 5000 with SO_REUSEPORT, so Node reports a successful bind but never
  // receives any requests — a silent failure that looks like broken code.
  port: Number(process.env.PORT) || 5001,
  mongoUri: process.env.MONGO_URI,

  // The exact browser origin allowed to call this API.
  // Never "*": ARCHITECTURE.md §5.7 — a wildcard origin is incompatible with
  // credentialed requests, which the Phase 2 refresh cookie depends on.
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  // Two DIFFERENT secrets — see utils/tokens.js for why.
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
};

// A short or shared secret defeats the point of signing tokens at all, so
// refuse to start rather than running in a state that only looks secure.
if (env.jwtAccessSecret === env.jwtRefreshSecret) {
  console.error('\n  JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different values.\n');
  process.exit(1);
}
for (const [key, value] of Object.entries({
  JWT_ACCESS_SECRET: env.jwtAccessSecret,
  JWT_REFRESH_SECRET: env.jwtRefreshSecret,
})) {
  if (value.length < 32) {
    console.error(`\n  ${key} is too short (${value.length} chars). Use at least 32.\n`);
    process.exit(1);
  }
}

/**
 * Production-only guards.
 *
 * Each of these is a misconfiguration that would leave the app running but
 * broken in a way that is hard to diagnose from the outside — so it fails at
 * boot instead, with a message naming the fix.
 */
if (env.isProduction) {
  const problems = [];

  // A cloud host cannot reach the developer's laptop. Every request would 500
  // with a database timeout that looks like an application bug.
  if (/localhost|127\.0\.0\.1/.test(env.mongoUri)) {
    problems.push(
      'MONGO_URI points at localhost. Use a MongoDB Atlas connection string in production.'
    );
  }

  // Without HTTPS the refresh cookie is set with Secure and the browser drops
  // it, so users appear to log in and are then immediately logged out.
  if (!env.clientUrl.startsWith('https://')) {
    problems.push(
      `CLIENT_URL must be an https:// origin in production (got "${env.clientUrl}"). ` +
        'The refresh cookie is Secure and browsers will not send it over http.'
    );
  }

  if (env.clientUrl.includes('localhost')) {
    problems.push('CLIENT_URL still points at localhost — set it to the deployed client origin.');
  }

  if (problems.length > 0) {
    console.error('\n  Production configuration problems:\n');
    for (const problem of problems) console.error(`    - ${problem}`);
    console.error('');
    process.exit(1);
  }
}

export default env;
