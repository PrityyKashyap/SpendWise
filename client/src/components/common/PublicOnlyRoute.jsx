import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { FullPageSpinner } from '../ui/Spinner.jsx';

/**
 * Gate for routes that only make sense when logged OUT (login, register).
 *
 * Without this, an authenticated user following an old /login link would be
 * shown a sign-in form for the account they are already using.
 */
export default function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <FullPageSpinner />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
