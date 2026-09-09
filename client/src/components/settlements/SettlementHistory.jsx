import { useState } from 'react';
import { History, Undo2 } from 'lucide-react';
import { formatMoney } from '../../utils/money.js';
import { formatDate } from '../../utils/date.js';
import { cancelSettlement } from '../../services/settlementService.js';
import EmptyState from '../ui/EmptyState.jsx';

/** Payments already recorded, with the option to reverse one. */
export default function SettlementHistory({ groupId, settlements, onChanged }) {
  const [busyId, setBusyId] = useState(null);

  if (!settlements?.length) {
    return (
      <EmptyState
        icon={History}
        title="No payments recorded"
        description="When someone settles up, it will be listed here."
      />
    );
  }

  async function handleCancel(settlement) {
    setBusyId(settlement._id);
    try {
      await cancelSettlement(groupId, settlement._id);
      onChanged();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ul className="divide-y divide-line">
      {settlements.map((settlement) => {
        const isCancelled = settlement.status === 'cancelled';
        return (
          <li key={settlement._id} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm ${isCancelled ? 'text-ink-muted line-through' : 'text-ink'}`}>
                <span className="font-medium">{settlement.fromName}</span> paid{' '}
                <span className="font-medium">{settlement.toName}</span>
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                {formatDate(settlement.settledAt)}
                {isCancelled && ' · cancelled'}
              </p>
            </div>

            <span
              className={`tabular text-sm font-semibold ${
                isCancelled ? 'text-ink-muted line-through' : 'text-income'
              }`}
            >
              {formatMoney(settlement.amount)}
            </span>

            {/* Cancelled rather than deleted: the record that someone believed
                money moved is itself worth keeping. */}
            {!isCancelled && (
              <button
                type="button"
                onClick={() => handleCancel(settlement)}
                disabled={busyId === settlement._id}
                aria-label={`Cancel payment of ${formatMoney(settlement.amount)}`}
                title="Cancel this payment"
                className="text-ink-muted transition hover:text-expense disabled:opacity-40"
              >
                <Undo2 className="h-4 w-4" />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
