import { Link, Outlet } from 'react-router-dom';
import Logo from '../components/brand/Logo.jsx';

/** Centred card layout shared by the login and register pages. */
export default function AuthLayout() {
  return (
    <div className="grid min-h-screen place-items-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link
          to="/"
          className="mb-8 flex justify-center rounded-lg
                     focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          <Logo markClassName="h-11 w-11" wordClassName="text-2xl" withTagline />
        </Link>

        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm shadow-slate-900/5">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
