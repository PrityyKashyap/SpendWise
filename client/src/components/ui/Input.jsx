import { useId } from 'react';

/**
 * Labelled text input with inline error support.
 *
 * Accessibility is built in rather than left to each form (IDEA.md §26):
 * the label is properly associated, the error is linked via aria-describedby
 * so a screen reader announces it, and aria-invalid marks the field.
 */
export default function Input({ label, error, type = 'text', className = '', ...props }) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        type={type}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-ink
                    transition placeholder:text-ink-muted
                    focus:outline-2 focus:outline-offset-0
                    ${
                      error
                        ? 'border-expense focus:outline-expense'
                        : 'border-line focus:outline-brand'
                    }`}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-expense">
          {error}
        </p>
      )}
    </div>
  );
}
