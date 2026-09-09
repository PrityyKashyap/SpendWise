import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="grid min-h-screen place-items-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-ink">SpendWise</h1>
        <p className="mt-3 text-base text-ink-muted">
          Track your money, split group bills, and settle up without the awkward
          maths.
        </p>

        <p className="mt-6 text-sm font-medium tracking-wide text-brand">
          Track → Analyze → Split → Settle → Remind
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium
                         text-white transition hover:opacity-90"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium
                           text-white transition hover:opacity-90"
              >
                Get started
              </Link>
              <Link
                to="/login"
                className="rounded-lg border border-line bg-surface px-5 py-2.5
                           text-sm font-medium text-ink transition hover:bg-canvas"
              >
                Log in
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
