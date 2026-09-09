import { Check, TriangleAlert } from 'lucide-react';
import { formatMoney } from '../../utils/money.js';

/**
 * Live allocation banner for the split form.
 *
 * Shows whether the split currently adds up, and by how much it is off. This
 * is the client half of invariant I1 — the server enforces it, but a user
 * should see the shortfall as they type rather than discovering it on submit.
 */
export default function SplitSummary({ allocated, total, isValid, message }) {
  const difference = total - allocated;

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${
        isValid
          ? 'border-income/20 bg-income/5 text-income'
          : 'border-i-owe/25 bg-i-owe/5 text-i-owe'
      }`}
    >
      {isValid ? (
        <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
      ) : (
        <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      <span className="tabular">
        {isValid ? (
          <>
            {formatMoney(allocated)} of {formatMoney(total)} allocated
          </>
        ) : (
          message ?? (
            <>
              {formatMoney(Math.abs(difference))}{' '}
              {difference > 0 ? 'still to allocate' : 'over-allocated'}
            </>
          )
        )}
      </span>
    </div>
  );
}
