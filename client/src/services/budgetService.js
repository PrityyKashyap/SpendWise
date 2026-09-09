import api from './api.js';

/** GET /budgets → every budget with its progress for the month. */
export function getBudgets(month) {
  return api.get('/budgets', { params: month ? { month } : {} });
}

export function createBudget(data) {
  return api.post('/budgets', data);
}

export function updateBudget(budgetId, data) {
  return api.patch(`/budgets/${budgetId}`, data);
}

export function deleteBudget(budgetId) {
  return api.delete(`/budgets/${budgetId}`);
}

/** GET /insights → spending insights computed from the user's own data. */
export function getInsights(month) {
  return api.get('/insights', { params: month ? { month } : {} });
}
