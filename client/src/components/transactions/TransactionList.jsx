import { Receipt } from 'lucide-react';
import { groupByDate, formatRelativeDay } from '../../utils/date.js';
import TransactionRow from './TransactionRow.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import ErrorState from '../ui/ErrorState.jsx';
import { SkeletonRows } from '../ui/Skeleton.jsx';

/**
 * A date-grouped transaction list with all four states
 * (ARCHITECTURE.md §4.5).
 */
export default function TransactionList({
  transactions,
  isLoading,
  error,
  onRetry,
  emptyTitle = 'No transactions yet',
  emptyDescription = 'Add your first income or expense to start tracking.',
  emptyAction,
}) {
  if (isLoading) return <SkeletonRows count={5} className="h-14" />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;

  if (!transactions?.length) {
    return (
      <EmptyState
        icon={Receipt}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="space-y-5">
      {groupByDate(transactions).map(({ date, items }) => (
        <section key={date}>
          <h3 className="mb-1 px-1 text-xs font-medium uppercase tracking-wide text-ink-muted">
            {formatRelativeDay(date)}
          </h3>
          <div className="divide-y divide-line">
            {items.map((transaction) => (
              <TransactionRow key={transaction._id} transaction={transaction} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
