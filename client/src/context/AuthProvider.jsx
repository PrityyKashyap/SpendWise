import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as authService from '../services/authService.js';
import { setAuthHandlers } from '../services/api.js';
import { AuthContext } from './authContext.js';

/**
 * Owns the session (ARCHITECTURE.md D7).
 *
 * The access token lives in React state and a ref — never in localStorage.
 * localStorage is readable by any script on the page, so one XSS bug would
 * hand an attacker a working token; state dies with the tab, and the httpOnly
 * refresh cookie restores the session on reload.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * The token is held in a ref as well as state.
   *
   * The axios interceptor reads the token synchronously at request time, and a
   * closure over the state variable would capture whatever value existed when
   * the handler was registered. The ref always reads current.
   */
  const accessTokenRef = useRef(null);

  const setSession = useCallback((token, nextUser) => {
    accessTokenRef.current = token;
    if (nextUser) setUser(nextUser);
  }, []);

  const clearSession = useCallback(() => {
    accessTokenRef.current = null;
    setUser(null);
  }, []);

  // Give the axios layer read access to the token, and a way to report both a
  // successful refresh and a dead session.
  useEffect(() => {
    setAuthHandlers({
      getAccessToken: () => accessTokenRef.current,
      onTokenRefreshed: (token, refreshedUser) => setSession(token, refreshedUser),
      onAuthFailure: () => clearSession(),
    });
  }, [setSession, clearSession]);

  /**
   * Restore the session on page load.
   *
   * The access token was lost when the tab closed, but the refresh cookie
   * survives — so we ask for a new access token once at start-up. Without
   * this, every refresh of the page would log the user out.
   */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { accessToken, user: restored } = await authService.refresh();
        if (!cancelled) setSession(accessToken, restored);
      } catch {
        // No cookie, or it expired. That is the normal state for a visitor —
        // not an error worth surfacing.
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setSession, clearSession]);

  const login = useCallback(
    async (credentials) => {
      const { accessToken, user: loggedIn } = await authService.login(credentials);
      setSession(accessToken, loggedIn);
      return loggedIn;
    },
    [setSession]
  );

  const register = useCallback(
    async (details) => {
      const { accessToken, user: created } = await authService.register(details);
      setSession(accessToken, created);
      return created;
    },
    [setSession]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Even if the server call fails, the local session must end — leaving
      // the user in a logged-in UI would be worse than a stale server record.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), isLoading, login, register, logout }),
    [user, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
