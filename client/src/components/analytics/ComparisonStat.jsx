import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { formatMoney } from '../../utils/money.js';

/**
 * One figure with its month-over-month change.
 *
 * `isGoodWhenDown` matters: expenses falling is good, income falling is not.
 * Colouring both the same way would tell the user the wrong story.
 *
 * A null change means the previous month had no data — shown as an explicit
 * note rather than a 0% that would imply "no change".
 */
export default function ComparisonStat({ label, value, change, isGoodWhenDown = false, note }) {
  const hasChange = change !== null && change !== undefined;
  const isFlat = hasChange && change === 0;
  const isDown = hasChange && change < 0;
  const isGood = isGoodWhenDown ? isDown : !isDown;

  const Icon = isFlat ? Minus : isDown ? ArrowDown : ArrowUp;
  const tone = !hasChange || isFlat ? 'text-ink-muted' : isGood ? 'text-income' : 'text-expense';

  return (
    <div className="py-3">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="tabular mt-1 text-xl font-semibold text-ink">{formatMoney(value)}</p>

      {hasChange ? (
        <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${tone}`}>
          <Icon className="h-3 w-3" aria-hidden="true" />
          {Math.abs(change)}%
          <span className="font-normal text-ink-muted">vs last month</span>
        </p>
      ) : (
        <p className="mt-1 text-xs text-ink-muted">{note ?? 'No data to compare'}</p>
      )}
    </div>
  );
}
