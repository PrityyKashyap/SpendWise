import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { FullPageSpinner } from '../ui/Spinner.jsx';

/**
 * Gate for authenticated-only routes.
 *
 * The isLoading branch is essential, not cosmetic. On a page refresh the
 * session is restored asynchronously; without this check `user` is briefly
 * null and a logged-in user would be bounced to /login every time they
 * reloaded (ARCHITECTURE.md §5.5).
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageSpinner />;

  // Remember where they were headed so login can send them back there.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
