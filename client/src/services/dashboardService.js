import api from './api.js';

/** GET /dashboard/summary → the five headline figures (IDEA.md §8). */
export function getSummary(month) {
  return api.get('/dashboard/summary', { params: month ? { month } : {} });
}

/** GET /dashboard/spending → category breakdown for the chart. */
export function getSpending(month) {
  return api.get('/dashboard/spending', { params: month ? { month } : {} });
}

/** GET /dashboard/recent → most recent transactions. */
export function getRecent(limit = 5) {
  return api.get('/dashboard/recent', { params: { limit } });
}
