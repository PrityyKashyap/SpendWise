import api from './api.js';

/**
 * GET /groups/:id/balances
 *
 * `simplify` is opt-in: pairwise is the default because it is the raw ledger
 * truth and can be explained expense by expense (ARCHITECTURE.md D6).
 */
export function getBalances(groupId, { simplify = false } = {}) {
  return api.get(`/groups/${groupId}/balances`, {
    params: simplify ? { simplify: 'true' } : {},
  });
}

export function listSettlements(groupId, params = {}) {
  return api.get(`/groups/${groupId}/settlements`, { params });
}

export function createSettlement(groupId, data) {
  return api.post(`/groups/${groupId}/settlements`, data);
}

export function cancelSettlement(groupId, settlementId) {
  return api.patch(`/groups/${groupId}/settlements/${settlementId}/cancel`);
}
