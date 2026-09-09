/**
 * The single axios instance every API call goes through (IDEA.md §32.14).
 *
 * Also implements silent token refresh (ARCHITECTURE.md §5.4): when a request
 * fails with an expired access token, refresh once and replay the request, so
 * the 15-minute token lifetime is invisible to the user.
 */
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send the httpOnly refresh cookie
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

/* ------------------------------------------------------------------ *
 * Wiring to AuthContext.
 *
 * AuthContext owns the access token (it lives in React state, never in
 * localStorage). This module needs to read it and to report a new one, but
 * importing the context here would create a cycle — so the context injects
 * these handlers on mount instead.
 * ------------------------------------------------------------------ */
let handlers = {
  getAccessToken: () => null,
  onTokenRefreshed: () => {},
  onAuthFailure: () => {},
};

export function setAuthHandlers(next) {
  handlers = { ...handlers, ...next };
}

/* ------------------------------------------------------------------ *
 * Request: attach the current access token.
 * ------------------------------------------------------------------ */
api.interceptors.request.use((config) => {
  const token = handlers.getAccessToken();
  if (token && !config.skipAuth) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ------------------------------------------------------------------ *
 * Response: unwrap the envelope, and refresh on expiry.
 * ------------------------------------------------------------------ */

/**
 * Single-flight refresh state.
 *
 * Why this matters: a dashboard may fire four requests at once, and if the
 * access token has expired all four return 401 together. Refreshing once per
 * failure would run four refreshes in parallel — and because the server
 * ROTATES the refresh token on every use, the first would invalidate the rest,
 * logging the user out at random. So the first 401 performs the refresh and
 * every other request waits on that same promise.
 */
let refreshPromise = null;

/** Refresh once; concurrent callers share the in-flight request. */
function refreshAccessToken() {
  refreshPromise ??= axios
    .post(`${BASE_URL}/auth/refresh`, null, { withCredentials: true })
    .then((response) => {
      const { accessToken, user } = response.data.data;
      handlers.onTokenRefreshed(accessToken, user);
      return accessToken;
    })
    .finally(() => {
      // Cleared either way, so a later expiry can refresh again.
      refreshPromise = null;
    });

  return refreshPromise;
}

api.interceptors.response.use(
  (response) => {
    // The server always answers { success, data, meta? }.
    //
    // Callers get `data` directly, because that is what almost every caller
    // wants. Paginated endpoints also need `meta`, so those opt in with
    // `fullResponse: true` and receive { data, meta } instead.
    if (response.config?.fullResponse) {
      return { data: response.data?.data, meta: response.data?.meta };
    }
    return response.data?.data ?? response.data;
  },

  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const code = error.response?.data?.error?.code;

    const canRetry =
      status === 401 &&
      code === 'TOKEN_EXPIRED' &&
      original &&
      !original._retried &&
      // Never try to refresh a failing refresh call — that is an infinite loop.
      !original.url?.includes('/auth/refresh');

    if (canRetry) {
      original._retried = true;
      try {
        await refreshAccessToken();
        return api(original); // replay with the new token attached
      } catch {
        // The refresh token is gone or revoked: the session is genuinely over.
        handlers.onAuthFailure();
        return Promise.reject({
          code: 'SESSION_EXPIRED',
          message: 'Your session has expired. Please log in again.',
          status: 401,
        });
      }
    }

    // The server responded in our error format.
    if (error.response?.data?.error) {
      const { code: errorCode, message, fields } = error.response.data.error;
      return Promise.reject({ code: errorCode, message, fields, status });
    }

    // The request never reached the server: API down, wrong port, or CORS
    // blocked it. Worth distinguishing — "unreachable" and "server said no"
    // need very different fixes.
    if (error.request) {
      return Promise.reject({
        code: 'NETWORK_ERROR',
        message: 'Cannot reach the SpendWise server. Is it running?',
        status: 0,
      });
    }

    return Promise.reject({
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Something went wrong.',
      status: 0,
    });
  }
);

export default api;
