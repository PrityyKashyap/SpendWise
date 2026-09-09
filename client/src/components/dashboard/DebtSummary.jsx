import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Handshake } from 'lucide-react';
import { formatMoney } from '../../utils/money.js';
import Card from '../ui/Card.jsx';
import Skeleton from '../ui/Skeleton.jsx';

/**
 * Outstanding debts in both directions (IDEA.md §8).
 *
 * These figures are deliberately NOT filtered by the selected month: a debt
 * from August is still owed in September, and hiding it when the month rolls
 * over would make real money silently disappear from the dashboard.
 */
export default function DebtSummary({ summary, isLoading }) {
  if (isLoading) return <Skeleton className="h-24" />;
  if (!summary) return null;

  const { othersOweMe, iOweOthers } = summary;

  if (othersOweMe === 0 && iOweOthers === 0) {
    return (
      <Card className="flex items-center gap-3 p-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-canvas">
          <Handshake className="h-4 w-4 text-ink-muted" aria-hidden="true" />
        </span>
        <p className="text-sm text-ink-muted">
          You&apos;re all square — no outstanding balances with anyone.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <Link to="/settlements">
        <Card className="p-4 transition hover:border-owed/40">
          <div className="flex items-center gap-1.5 text-xs text-ink-muted">
            <ArrowDownLeft className="h-3.5 w-3.5 text-owed" aria-hidden="true" />
            Others owe me
          </div>
          <p className="tabular mt-1.5 text-xl font-semibold text-owed">
            {formatMoney(othersOweMe)}
          </p>
        </Card>
      </Link>

      <Link to="/settlements">
        <Card className="p-4 transition hover:border-i-owe/40">
          <div className="flex items-center gap-1.5 text-xs text-ink-muted">
            <ArrowUpRight className="h-3.5 w-3.5 text-i-owe" aria-hidden="true" />
            I owe others
          </div>
          <p className="tabular mt-1.5 text-xl font-semibold text-i-owe">
            {formatMoney(iOweOthers)}
          </p>
        </Card>
      </Link>
    </div>
  );
}
