import { createContext } from 'react';

/**
 * The auth context object.
 *
 * Kept in its own non-component file on purpose: React Fast Refresh only
 * preserves state during hot reload when a module exports *only* components,
 * so mixing the context object into AuthProvider.jsx would silently break
 * hot reloading of the provider.
 */
export const AuthContext = createContext(null);
