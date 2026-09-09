/**
 * Health check.
 *
 * Controllers do HTTP only: read the request, call a service, send a response
 * (ARCHITECTURE.md §1.2). This one has no service because there is no business
 * logic — it reports live process and database state.
 */
import { getDBStatus } from '../config/db.js';
import { env } from '../config/env.js';

export function getHealth(_req, res) {
  const db = getDBStatus();

  // The API is only genuinely usable if the database is reachable, so an
  // unhealthy DB is reported as 503 rather than a cheerful 200.
  const isHealthy = db.status === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    data: {
      service: 'spendwise-api',
      status: isHealthy ? 'ok' : 'degraded',
      environment: env.nodeEnv,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: db,
    },
  });
}
