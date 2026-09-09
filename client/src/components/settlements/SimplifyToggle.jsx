import { Info } from 'lucide-react';

/**
 * Switch between the raw ledger and the simplified route.
 *
 * Pairwise is the default (ARCHITECTURE.md D6): it is what the expenses
 * actually say, so any figure can be explained back to a specific dinner or
 * cab. Simplification is genuinely useful but can ask someone to pay a person
 * they never shared an expense with, so it is opt-in and labelled.
 */
export default function SimplifyToggle({ isSimplified, onChange, pairwiseCount, simplifiedCount }) {
  return (
    <div className="mb-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-line p-0.5" role="group">
          <Option active={!isSimplified} onClick={() => onChange(false)}>
            Who owes whom
          </Option>
          <Option active={isSimplified} onClick={() => onChange(true)}>
            Fewest payments
          </Option>
        </div>

        {simplifiedCount != null && pairwiseCount > simplifiedCount && (
          <span className="text-xs text-ink-muted">
            {pairwiseCount} → {simplifiedCount} payments
          </span>
        )}
      </div>

      {isSimplified && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-ink-muted">
          <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
          Debts are rerouted to reduce the number of payments, so someone may be
          asked to pay a person they didn&apos;t share an expense with. Everyone ends
          up exactly square.
        </p>
      )}
    </div>
  );
}

function Option({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
        active ? 'bg-brand text-white' : 'text-ink-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}
