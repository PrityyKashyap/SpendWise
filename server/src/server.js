/**
 * Entry point: connect to MongoDB, then start listening.
 *
 * The order is deliberate — the server does not accept traffic until the
 * database is reachable, so there is no window where requests fail confusingly.
 */
import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { logger } from './utils/logger.js';

async function start() {
  try {
    await connectDB();
  } catch (err) {
    logger.error('Could not connect to MongoDB — server not started.', err.message);
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    logger.info(`SpendWise API listening on http://localhost:${env.port} [${env.nodeEnv}]`);
    logger.info(`Health check: http://localhost:${env.port}/api/health`);
  });

  /**
   * Finish in-flight requests, close the DB, then exit.
   *
   * Hosting platforms send SIGTERM on every deploy and give a grace period
   * (Render allows 30s) before killing the process. The timeout matters: if a
   * keep-alive connection never closes, `server.close()` never fires its
   * callback, the database connection is left open, and the platform SIGKILLs
   * us mid-request. Ten seconds is well inside every provider's window.
   */
  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down.`);

    const forceExit = setTimeout(() => {
      logger.error('Shutdown timed out after 10s — forcing exit.');
      process.exit(1);
    }, 10_000);
    // Do not let this timer alone keep the process alive.
    forceExit.unref();

    server.close(async () => {
      await disconnectDB();
      clearTimeout(forceExit);
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // A rejected promise nobody handled means a bug we have not accounted for.
  // Log it loudly rather than letting Node exit silently.
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection:', reason);
  });
}

start();
