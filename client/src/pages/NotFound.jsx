import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="text-center">
        <p className="text-sm font-medium text-brand">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Page not found</h1>
        <p className="mt-2 text-sm text-ink-muted">
          That page doesn&apos;t exist yet.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-brand px-4 py-2 text-sm
                     font-medium text-white transition hover:opacity-90"
        >
          Go back
        </Link>
      </div>
    </main>
  );
}
