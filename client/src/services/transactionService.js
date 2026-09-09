import api from './api.js';

/**
 * GET /transactions with filters.
 *
 * Returns the axios response unwrapped by the interceptor. Because this
 * endpoint also carries pagination in `meta`, it is requested raw so callers
 * get both the rows and the page info.
 */
export function listTransactions(params = {}) {
  // Strip empty values so the URL stays clean and the server sees only real
  // filters — '' would otherwise fail enum validation.
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v != null)
  );
  return api.get('/transactions', { params: clean, fullResponse: true });
}

export function getTransaction(id) {
  return api.get(`/transactions/${id}`);
}

export function createTransaction(data) {
  return api.post('/transactions', data);
}

export function updateTransaction(id, data) {
  return api.patch(`/transactions/${id}`, data);
}

export function deleteTransaction(id) {
  return api.delete(`/transactions/${id}`);
}
