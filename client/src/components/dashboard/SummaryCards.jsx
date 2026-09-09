import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { formatMoney } from '../../utils/money.js';
import Card from '../ui/Card.jsx';
import Skeleton from '../ui/Skeleton.jsx';

/**
 * The headline figures (IDEA.md §8).
 *
 * Ordered per §26: balance first, then income and expenses. Balance gets the
 * larger treatment because "how much do I have?" is the question the dashboard
 * exists to answer.
 */
export default function SummaryCards({ summary, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-28" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const isNegative = summary.balance < 0;

  return (
    <div className="space-y-3">
      <Card className="p-5">
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <Wallet className="h-4 w-4" aria-hidden="true" />
          Balance this month
        </div>
        <p
          className={`tabular mt-2 text-3xl font-semibold tracking-tight ${
            isNegative ? 'text-expense' : 'text-ink'
          }`}
        >
          {formatMoney(summary.balance)}
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          {summary.breakdown.transactionCount} transaction
          {summary.breakdown.transactionCount === 1 ? '' : 's'} recorded
          {isNegative && ' · you have spent more than you earned'}
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Stat
          icon={TrendingUp}
          label="Income"
          value={summary.totalIncome}
          tone="text-income"
        />
        <Stat
          icon={TrendingDown}
          label="Expenses"
          value={summary.totalExpenses}
          tone="text-expense"
          // Phase 7 will make this non-zero; showing the split only when it
          // matters keeps the card uncluttered today.
          note={
            summary.breakdown.groupExpenseShare > 0
              ? `incl. ${formatMoney(summary.breakdown.groupExpenseShare)} group share`
              : null
          }
        />
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone, note }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-1.5 text-xs text-ink-muted">
        <Icon className={`h-3.5 w-3.5 ${tone}`} aria-hidden="true" />
        {label}
      </div>
      <p className={`tabular mt-1.5 text-xl font-semibold ${tone}`}>{formatMoney(value)}</p>
      {note && <p className="mt-1 text-[11px] text-ink-muted">{note}</p>}
    </Card>
  );
}
