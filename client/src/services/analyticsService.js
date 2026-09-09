import api from './api.js';

/** GET /analytics/trends → monthly income / expense / savings series. */
export function getTrends({ months = 6, month } = {}) {
  return api.get('/analytics/trends', { params: { months, ...(month ? { month } : {}) } });
}

/** GET /analytics/daily → per-day money in, out and net (IDEA.md §22). */
export function getDailyFlow(month) {
  return api.get('/analytics/daily', { params: month ? { month } : {} });
}

/** GET /analytics/report → the monthly report (IDEA.md §19). */
export function getReport(month) {
  return api.get('/analytics/report', { params: month ? { month } : {} });
}
