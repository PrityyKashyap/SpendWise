/**
 * Auth API calls. Components never import axios directly (IDEA.md §32.14).
 */
import api from './api.js';

/** POST /auth/register → { user, accessToken } */
export function register({ name, email, password }) {
  return api.post('/auth/register', { name, email, password });
}

/** POST /auth/login → { user, accessToken } */
export function login({ email, password }) {
  return api.post('/auth/login', { email, password });
}

/** POST /auth/logout — clears the refresh cookie and revokes it server-side. */
export function logout() {
  return api.post('/auth/logout');
}

/**
 * POST /auth/refresh → { user, accessToken }
 *
 * Called once on app start to restore a session from the httpOnly cookie.
 * `skipAuth` avoids attaching a stale access token we already know is useless.
 */
export function refresh() {
  // An empty object, not null. Axios serialises `null` to the literal string
  // "null" and still sends Content-Type: application/json, which express.json()
  // rejects in strict mode (only objects and arrays are valid top-level JSON).
  // That made every session restore fail with a 500 — so reloading the page, or
  // any silent refresh after the 15-minute access token expired, logged the
  // user out.
  return api.post('/auth/refresh', {}, { skipAuth: true });
}

/** GET /auth/me → { user } */
export function getMe() {
  return api.get('/auth/me');
}

/** PATCH /auth/me → update name, image or currency (IDEA.md §4). */
export function updateProfile(data) {
  return api.patch('/auth/me', data);
}

/**
 * PATCH /auth/change-password
 *
 * Succeeds by ending the session: the server clears every refresh token, so
 * the caller must log in again.
 */
export function changePassword(data) {
  return api.patch('/auth/change-password', data);
}
