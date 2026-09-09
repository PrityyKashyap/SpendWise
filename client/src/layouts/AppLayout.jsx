import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';
import { useAuth } from '../hooks/useAuth.js';

/** Shell for authenticated pages: sidebar on desktop, bottom bar on mobile. */
export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="hidden items-center justify-end gap-3 border-b border-line bg-surface px-6 py-3 lg:flex">
          <span className="text-sm text-ink-muted">{user?.email}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5
                       text-sm font-medium text-ink-muted transition hover:bg-canvas hover:text-ink"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Log out
          </button>
        </header>

        {/* pb-24 on mobile keeps content clear of the fixed bottom bar. */}
        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
          <div className="mx-auto max-w-3xl">
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNav onLogout={handleLogout} />
    </div>
  );
}
