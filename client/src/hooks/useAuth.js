import { useContext } from 'react';
import { AuthContext } from '../context/authContext.js';

/**
 * Access the current session.
 *
 * Throws when used outside AuthProvider — a clear error at the point of misuse
 * beats a confusing "cannot read property of null" further down.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return context;
}

export default useAuth;
