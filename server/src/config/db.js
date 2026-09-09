/**
 * MongoDB connection (Mongoose).
 */
import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

/**
 * Connect to MongoDB. Throws on failure so the caller can decide to exit —
 * a server that is up but cannot reach its database should not accept traffic.
 */
export async function connectDB() {
  // Reject queries against fields that are not in the schema, instead of
  // silently ignoring them. Catches typos like { usrId: x } at write time.
  mongoose.set('strictQuery', true);

  const conn = await mongoose.connect(env.mongoUri, {
    // Fail a connection attempt in 10s rather than the 30s default, so a wrong
    // URI surfaces quickly during development.
    serverSelectionTimeoutMS: 10000,

    // Connection pool. Atlas' free tier caps concurrent connections, and the
    // driver default (100) will exhaust it if the app scales to more than one
    // instance. Ten is ample for this workload and leaves headroom.
    maxPoolSize: 10,
    minPoolSize: 1,

    // Close idle sockets so a restarted Atlas node does not leave the pool
    // holding connections that are dead but look open.
    socketTimeoutMS: 45000,
  });

  logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

  // Mongoose buffers and retries on its own; these are for visibility, so a
  // production incident shows up in the logs rather than as silent slowness.
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
  mongoose.connection.on('error', (err) => logger.error('MongoDB error:', err.message));

  return conn;
}

/** Human-readable state of the live connection, used by /api/health. */
export function getDBStatus() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return {
    status: states[mongoose.connection.readyState] ?? 'unknown',
    name: mongoose.connection.name ?? null,
    host: mongoose.connection.host ?? null,
  };
}

/** Close the connection cleanly (used on shutdown). */
export async function disconnectDB() {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
}
