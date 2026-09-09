import { Link, Outlet } from 'react-router-dom';

/** Centred card layout shared by the login and register pages. */
export default function AuthLayout() {
  return (
    <div className="grid min-h-screen place-items-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 block text-center">
          <span className="text-xl font-semibold tracking-tight text-ink">SpendWise</span>
          <span className="mt-1 block text-xs text-ink-muted">
            Track → Analyze → Split → Settle → Remind
          </span>
        </Link>

        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm shadow-slate-900/5">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
