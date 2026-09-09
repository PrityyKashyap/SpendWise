import { Bell, PartyPopper } from 'lucide-react';
import { formatMoney } from '../../utils/money.js';
import MemberAvatar from '../groups/MemberAvatar.jsx';
import Button from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';

/**
 * Who owes whom.
 *
 * Renders both views from the same component — the shape is identical, only
 * the source array differs.
 */
export default function BalanceList({ debts, currentMemberId, onSettle, onRemind }) {
  if (!debts?.length) {
    return (
      <EmptyState
        icon={PartyPopper}
        title="Everyone is square"
        description="No outstanding balances in this group."
      />
    );
  }

  return (
    <ul className="divide-y divide-line">
      {debts.map((debt) => {
        const isMine = String(debt.from) === String(currentMemberId);
        const isOwedToMe = String(debt.to) === String(currentMemberId);

        return (
          <li key={`${debt.from}-${debt.to}`} className="flex items-center gap-3 py-3">
            <MemberAvatar member={{ _id: debt.from, name: debt.fromName }} />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-ink">
                <span className="font-medium">{isMine ? 'You' : debt.fromName}</span>
                <span className="text-ink-muted"> owe{isMine ? '' : 's'} </span>
                <span className="font-medium">{isOwedToMe ? 'you' : debt.toName}</span>
              </p>
              <p
                className={`tabular mt-0.5 text-sm font-semibold ${
                  isOwedToMe ? 'text-owed' : isMine ? 'text-i-owe' : 'text-ink-muted'
                }`}
              >
                {formatMoney(debt.amount)}
              </p>
            </div>

            {/* Actions are offered only where the current user is a party to
                the debt — recording a payment between two other people is a
                claim you are not in a position to make.
                Remind appears only when the money is owed TO you: nudging
                someone to pay a third party is not your message to send. */}
            <div className="flex shrink-0 gap-1.5">
              {isOwedToMe && onRemind && (
                <Button
                  variant="ghost"
                  onClick={() => onRemind(debt)}
                  aria-label={`Remind ${debt.fromName}`}
                >
                  <Bell className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Remind</span>
                </Button>
              )}
              {(isMine || isOwedToMe) && onSettle && (
                <Button variant="secondary" onClick={() => onSettle(debt)}>
                  Settle up
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
