export default function Spinner({ className = '' }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2
                  border-line border-t-brand ${className}`}
    />
  );
}

/** Full-page loader, used while the session is being restored. */
export function FullPageSpinner() {
  return (
    <div className="grid min-h-screen place-items-center">
      <Spinner className="h-7 w-7" />
    </div>
  );
}
