import { useId } from 'react';

export default function Select({ label, error, options = [], className = '', ...props }) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <select
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`w-full appearance-none rounded-lg border bg-surface px-3 py-2.5 text-sm
                    text-ink transition focus:outline-2 focus:outline-offset-0
                    ${error ? 'border-expense focus:outline-expense' : 'border-line focus:outline-brand'}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-expense">
          {error}
        </p>
      )}
    </div>
  );
}
