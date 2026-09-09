import api from './api.js';

export function listGroups() {
  return api.get('/groups');
}

export function getGroup(groupId) {
  return api.get(`/groups/${groupId}`);
}

export function createGroup(data) {
  return api.post('/groups', data);
}

export function updateGroup(groupId, data) {
  return api.patch(`/groups/${groupId}`, data);
}

export function archiveGroup(groupId) {
  return api.delete(`/groups/${groupId}`);
}

export function addMember(groupId, member) {
  return api.post(`/groups/${groupId}/members`, member);
}

export function removeMember(groupId, memberId) {
  return api.delete(`/groups/${groupId}/members/${memberId}`);
}

/* ---- group expenses ---- */

export function listGroupExpenses(groupId, params = {}) {
  return api.get(`/groups/${groupId}/expenses`, { params, fullResponse: true });
}

export function createGroupExpense(groupId, data) {
  return api.post(`/groups/${groupId}/expenses`, data);
}

export function deleteGroupExpense(groupId, expenseId) {
  return api.delete(`/groups/${groupId}/expenses/${expenseId}`);
}

/**
 * Resolve a split without saving it.
 *
 * The preview is computed by the same server code that will store the expense,
 * so the amounts shown while typing cannot disagree with what gets saved
 * (ARCHITECTURE.md §3.6).
 */
export function previewSplit(groupId, data) {
  return api.post(`/groups/${groupId}/expenses/preview`, data);
}
