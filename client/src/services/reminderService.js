import api from './api.js';

/** POST /groups/:id/reminders → the generated message, recorded in history. */
export function generateReminder(groupId, data) {
  return api.post(`/groups/${groupId}/reminders`, data);
}

/** GET /groups/:id/reminders → reminder history (IDEA.md §16). */
export function listReminders(groupId, params = {}) {
  return api.get(`/groups/${groupId}/reminders`, { params });
}
