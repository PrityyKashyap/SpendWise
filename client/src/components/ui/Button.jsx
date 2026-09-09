/**
 * Button primitive. Knows nothing about SpendWise — pure presentation.
 */
const VARIANTS = {
  primary: 'bg-brand text-white hover:opacity-90 disabled:opacity-50',
  secondary: 'border border-line bg-surface text-ink hover:bg-canvas disabled:opacity-50',
  ghost: 'text-ink-muted hover:bg-canvas disabled:opacity-50',
};

export default function Button({
  variant = 'primary',
  isLoading = false,
  disabled,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      // A loading button must also be disabled, or a double-click fires the
      // request twice.
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5
                  text-sm font-medium transition
                  focus-visible:outline-2 focus-visible:outline-offset-2
                  focus-visible:outline-brand
                  disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {isLoading && (
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current
                     border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}
