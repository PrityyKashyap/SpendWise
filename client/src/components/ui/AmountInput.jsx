import { useId } from 'react';

/**
 * Money input.
 *
 * Shows and accepts rupees, because that is what people think in. The parent
 * converts to integer paise with toPaise() before sending — conversion happens
 * only at this boundary (ARCHITECTURE.md D1).
 */
export default function AmountInput({ label = 'Amount', error, className = '', ...props }) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <span
          className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center
                     text-base text-ink-muted"
          aria-hidden="true"
        >
          ₹
        </span>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0.00"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`tabular w-full rounded-lg border bg-surface py-3 pl-8 pr-3 text-lg
                      font-medium text-ink transition focus:outline-2 focus:outline-offset-0
                      ${error ? 'border-expense focus:outline-expense' : 'border-line focus:outline-brand'}`}
          {...props}
        />
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-expense">
          {error}
        </p>
      )}
    </div>
  );
}
