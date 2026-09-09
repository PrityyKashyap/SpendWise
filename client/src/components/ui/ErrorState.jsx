import Button from './Button.jsx';

/** Failure state: what went wrong, plus a way to try again. */
export default function ErrorState({ error, onRetry, className = '' }) {
  return (
    <div
      role="alert"
      className={`rounded-lg border border-expense/20 bg-expense/5 p-4 ${className}`}
    >
      <p className="text-sm font-medium text-expense">
        {error?.code === 'NETWORK_ERROR' ? "Can't reach the server" : 'Something went wrong'}
      </p>
      <p className="mt-1 text-sm text-ink-muted">
        {error?.message || 'Please try again in a moment.'}
      </p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="mt-3">
          Try again
        </Button>
      )}
    </div>
  );
}
