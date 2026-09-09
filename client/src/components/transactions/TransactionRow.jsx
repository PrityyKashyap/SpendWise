import { Link } from 'react-router-dom';
import { formatMoney } from '../../utils/money.js';
import { PAYMENT_METHODS } from '@spendwise/shared/constants.js';
import CategoryIcon from '../ui/CategoryIcon.jsx';

const METHOD_LABELS = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.value, m.label]));

/**
 * One transaction in a list.
 *
 * A plain row, not a card — IDEA.md §26 warns against making every element a
 * card, and forty stacked cards is exactly what a transaction list should not
 * look like.
 */
export default function TransactionRow({ transaction }) {
  const isIncome = transaction.type === 'income';

  return (
    <Link
      to={`/transactions/${transaction._id}/edit`}
      className="flex items-center gap-3 px-1 py-3 transition hover:bg-canvas/60"
    >
      <CategoryIcon category={transaction.category} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{transaction.description}</p>
        <p className="mt-0.5 truncate text-xs text-ink-muted">
          {transaction.category?.name}
          <span aria-hidden="true"> · </span>
          {METHOD_LABELS[transaction.paymentMethod] ?? transaction.paymentMethod}
        </p>
      </div>

      {/* tabular-nums keeps the decimal points aligned down the column. */}
      <span
        className={`tabular shrink-0 text-sm font-semibold ${
          isIncome ? 'text-income' : 'text-ink'
        }`}
      >
        {isIncome ? '+' : '−'}
        {formatMoney(transaction.amount).replace('₹', '₹')}
      </span>
    </Link>
  );
}
