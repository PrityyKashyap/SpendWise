/**
 * Health check API calls.
 *
 * One service module per resource. Components import these functions and never
 * import axios directly.
 */
import api from './api.js';

/** GET /api/health → live service and database status. */
export function getHealth() {
  return api.get('/health');
}
