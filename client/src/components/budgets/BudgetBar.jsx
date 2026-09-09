import { formatMoney } from '../../utils/money.js';
import CategoryIcon from '../ui/CategoryIcon.jsx';

/**
 * One budget with its progress (IDEA.md §20).
 *
 * The bar is capped at 100% width but the overspill is shown in a contrasting
 * segment, so going over budget reads as *over* rather than merely full.
 */
const TONES = {
  exceeded: { bar: 'bg-expense', text: 'text-expense' },
  warning: { bar: 'bg-i-owe', text: 'text-i-owe' },
  ahead_of_pace: { bar: 'bg-i-owe', text: 'text-ink-muted' },
  ok: { bar: 'bg-income', text: 'text-ink-muted' },
};

export default function BudgetBar({ budget, onEdit }) {
  const tone = TONES[budget.status] ?? TONES.ok;
  const filled = Math.min(budget.percent, 100);

  return (
    <div className="py-3">
      <div className="flex items-center gap-3">
        <CategoryIcon category={budget.category} size="sm" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{budget.category.name}</p>
        </div>

        <p className="tabular shrink-0 text-sm text-ink">
          <span className="font-semibold">{formatMoney(budget.spent)}</span>
          <span className="text-ink-muted"> / {formatMoney(budget.amount)}</span>
        </p>

        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(budget)}
            className="shrink-0 text-xs font-medium text-brand hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas"
        role="progressbar"
        aria-valuenow={Math.round(budget.percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${budget.category.name} budget`}
      >
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${filled}%` }} />
      </div>

      <p className={`mt-1.5 text-xs ${tone.text}`}>{budget.message}</p>
    </div>
  );
}
