import { Receipt } from 'lucide-react';
import { formatMoney } from '../../utils/money.js';
import { groupByDate, formatRelativeDay } from '../../utils/date.js';
import MemberAvatar from './MemberAvatar.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import ErrorState from '../ui/ErrorState.jsx';
import { SkeletonRows } from '../ui/Skeleton.jsx';

export default function GroupExpenseList({
  expenses,
  isLoading,
  error,
  onRetry,
  currentMemberId,
  emptyAction,
}) {
  if (isLoading) return <SkeletonRows count={4} className="h-14" />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;

  if (!expenses?.length) {
    return (
      <EmptyState
        icon={Receipt}
        title="No expenses yet"
        description="Add the first shared expense and everyone's share is worked out for you."
        action={emptyAction}
      />
    );
  }

  return (
    <div className="space-y-5">
      {groupByDate(expenses).map(({ date, items }) => (
        <section key={date}>
          <h3 className="mb-1 px-1 text-xs font-medium uppercase tracking-wide text-ink-muted">
            {formatRelativeDay(date)}
          </h3>
          <div className="divide-y divide-line">
            {items.map((expense) => {
              const myShare = expense.participants.find(
                (p) => String(p.memberId) === String(currentMemberId)
              );

              return (
                <div key={expense._id} className="flex items-center gap-3 py-3">
                  <MemberAvatar member={{ _id: expense.paidBy, name: expense.paidByName }} />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{expense.description}</p>
                    <p className="mt-0.5 truncate text-xs text-ink-muted">
                      {expense.paidByName} paid · split {expense.splitType} between{' '}
                      {expense.participants.length}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="tabular text-sm font-semibold text-ink">
                      {formatMoney(expense.totalAmount)}
                    </p>
                    {myShare && (
                      <p className="tabular mt-0.5 text-xs text-ink-muted">
                        your share {formatMoney(myShare.share)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
